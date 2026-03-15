/**
 * Fetch stunt reels and skill reels from the StuntListing production database.
 * Only includes members with standard or plus subscriptions (not free).
 *
 * Run: node scripts/fetch-stuntlisting-reels.js
 *
 * This generates src/data/stuntlisting-reels.json which is imported by the app.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: 'stuntlisting-production.c0ecmzrrogms.us-east-1.rds.amazonaws.com',
  port: 3306,
  user: 'actionvault',
  password: 'gerpos-ponBir-pyhco1',
  database: 'db',
};

const PAID_TIERS = "('standard_monthly', 'standard_yearly', 'plus_monthly', 'plus_yearly')";

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

async function main() {
  const conn = await mysql.createConnection(DB_CONFIG);

  // Stunt reels
  const [stuntReels] = await conn.query(`
    SELECT sr.id, sr.title, sr.reel_url, sr.thumb_url, sr.updated_at,
           u.first_name, u.last_name, u.subscription_type, u.display_image, u.alias, u.role
    FROM stunt_reels sr
    JOIN user u ON sr.userId = u.id
    WHERE u.subscription_type IN ${PAID_TIERS}
    AND u.is_subscription_active = 1
    AND sr.reel_url IS NOT NULL AND sr.reel_url != ''
    ORDER BY sr.updated_at DESC
  `);

  // Skill reels
  const [skillReels] = await conn.query(`
    SELECT ss.id, ss.skill_name, ss.description, ss.skill_url, ss.category, ss.level, ss.updated_at,
           u.first_name, u.last_name, u.subscription_type, u.display_image, u.alias, u.role
    FROM skill_sets ss
    JOIN user u ON ss.userId = u.id
    WHERE u.subscription_type IN ${PAID_TIERS}
    AND u.is_subscription_active = 1
    AND ss.skill_url IS NOT NULL AND TRIM(ss.skill_url) != '' AND ss.skill_url LIKE 'http%'
    ORDER BY ss.updated_at DESC
  `);

  await conn.end();

  // Process stunt reels - only YouTube/Vimeo with valid thumbnails
  const processedStuntReels = stuntReels
    .filter(r => {
      const ytId = extractYouTubeId(r.reel_url);
      const vimeoId = extractVimeoId(r.reel_url);
      return (ytId || vimeoId) && r.thumb_url && r.thumb_url.startsWith('http');
    })
    .map(r => {
      const ytId = extractYouTubeId(r.reel_url);
      return {
        id: 'sl-sr-' + r.id,
        title: r.title || `${r.first_name} ${r.last_name} Stunt Reel`,
        url: r.reel_url,
        youtubeId: ytId,
        thumb: r.thumb_url,
        name: `${r.first_name} ${r.last_name}`,
        alias: r.alias,
        photo: r.display_image ? `https://stuntlisting.com/images/uploads/${r.display_image}` : null,
        role: r.role,
        tier: r.subscription_type?.includes('plus') ? 'plus' : 'standard',
      };
    });

  // Process skill reels
  const processedSkillReels = skillReels
    .filter(r => {
      const ytId = extractYouTubeId(r.skill_url);
      const vimeoId = extractVimeoId(r.skill_url);
      return ytId || vimeoId;
    })
    .map(r => {
      const ytId = extractYouTubeId(r.skill_url);
      return {
        id: 'sl-sk-' + r.id,
        skill: r.skill_name,
        desc: r.description?.substring(0, 120) || '',
        url: r.skill_url,
        youtubeId: ytId,
        thumb: ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : null,
        cat: r.category,
        level: r.level,
        name: `${r.first_name} ${r.last_name}`,
        alias: r.alias,
        photo: r.display_image ? `https://stuntlisting.com/images/uploads/${r.display_image}` : null,
        role: r.role,
        tier: r.subscription_type?.includes('plus') ? 'plus' : 'standard',
      };
    });

  const output = {
    fetchedAt: new Date().toISOString(),
    stuntReels: processedStuntReels,
    skillReels: processedSkillReels,
  };

  const outPath = path.join(__dirname, '..', 'src', 'data', 'stuntlisting-reels.json');
  fs.writeFileSync(outPath, JSON.stringify(output));

  console.log(`Stunt reels: ${processedStuntReels.length}`);
  console.log(`Skill reels: ${processedSkillReels.length}`);
  const size = fs.statSync(outPath).size;
  console.log(`Output: ${(size / 1024).toFixed(0)} KB`);
}

main().catch(console.error);
