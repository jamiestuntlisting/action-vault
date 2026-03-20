#!/usr/bin/env node
/**
 * parse-video-refs.js
 *
 * Scans videos.ts for videos missing coordinator/performer/production refs
 * and suggests matches based on title and description text.
 *
 * Usage:
 *   node scripts/parse-video-refs.js              # scan all videos
 *   node scripts/parse-video-refs.js --new         # scan only videos with empty refs
 *   node scripts/parse-video-refs.js --id v193     # scan a specific video
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// --- Load data files as raw text and parse names/titles ---

function extractArrayItems(filePath, regex) {
  const src = fs.readFileSync(filePath, 'utf8');
  const items = [];
  let match;
  while ((match = regex.exec(src)) !== null) {
    items.push(match.groups);
  }
  return items;
}

// Parse coordinators
function loadCoordinators() {
  const src = fs.readFileSync(path.join(DATA_DIR, 'coordinators.ts'), 'utf8');
  const items = [];
  const re = /id:\s*'(coord-\d+)',\s*\n\s*name:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    items.push({ id: m[1], name: m[2] });
  }
  return items;
}

// Parse performers
function loadPerformers() {
  const src = fs.readFileSync(path.join(DATA_DIR, 'performers.ts'), 'utf8');
  const items = [];
  const re = /id:\s*'(perf-\d+)',\s*\n\s*name:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    items.push({ id: m[1], name: m[2] });
  }
  return items;
}

// Parse productions
function loadProductions() {
  const src = fs.readFileSync(path.join(DATA_DIR, 'productions.ts'), 'utf8');
  const items = [];
  const re = /id:\s*'(prod-\d+)',\s*title:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    items.push({ id: m[1], title: m[2] });
  }
  return items;
}

// Parse videos
function loadVideos() {
  const src = fs.readFileSync(path.join(DATA_DIR, 'videos.ts'), 'utf8');
  const videos = [];

  // Split by video blocks
  const blocks = src.split(/\n\s*\{[\s\n]*id:\s*'/);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const idMatch = block.match(/^(v\d+)'/);
    if (!idMatch) continue;

    const id = idMatch[1];
    const titleMatch = block.match(/title:\s*'([^']+)'/);
    const descMatch = block.match(/description:\s*'([^']+)'/);
    const title = titleMatch ? titleMatch[1] : '';
    const desc = descMatch ? descMatch[1] : '';

    // Check if refs are empty
    const coordMatch = block.match(/coordinators:\s*\[([^\]]*)\]/);
    const perfMatch = block.match(/performers:\s*\[([^\]]*)\]/);
    const prodMatch = block.match(/productions:\s*\[([^\]]*)\]/);

    const hasCoords = coordMatch && coordMatch[1].trim().length > 0;
    const hasPerfs = perfMatch && perfMatch[1].trim().length > 0;
    const hasProds = prodMatch && prodMatch[1].trim().length > 0;

    videos.push({ id, title, desc, hasCoords, hasPerfs, hasProds });
  }
  return videos;
}

// --- Matching logic ---

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findMatches(text, items, nameField = 'name') {
  const textLower = text.toLowerCase();
  const matches = [];

  for (const item of items) {
    const name = item[nameField];
    const nameLower = name.toLowerCase();

    // Try full name match
    if (textLower.includes(nameLower)) {
      matches.push({ ...item, matchType: 'full' });
      continue;
    }

    // Try last name match (for people)
    if (nameField === 'name') {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        const lastName = parts[parts.length - 1].toLowerCase();
        // Only match last names that are 4+ chars to avoid false positives
        if (lastName.length >= 4) {
          // Check for last name with word boundaries
          const lastNameRe = new RegExp('\\b' + escapeRegex(lastName) + '\\b', 'i');
          if (lastNameRe.test(text)) {
            // Verify it's not a common word
            const commonWords = ['young', 'bell', 'ford', 'chase', 'burns', 'green', 'smith', 'brown', 'white', 'black', 'king', 'long', 'hall', 'lee', 'wood', 'walker'];
            if (!commonWords.includes(lastName.toLowerCase())) {
              matches.push({ ...item, matchType: 'lastName' });
            }
          }
        }
      }
    }

    // For productions, also try without common prefixes
    if (nameField === 'title') {
      const stripped = name.replace(/^The\s+/i, '');
      if (stripped !== name && stripped.length >= 4 && textLower.includes(stripped.toLowerCase())) {
        matches.push({ ...item, matchType: 'stripped' });
      }
    }
  }

  return matches;
}

// --- Main ---

function main() {
  const args = process.argv.slice(2);
  const onlyNew = args.includes('--new');
  const idIndex = args.indexOf('--id');
  const specificId = idIndex >= 0 ? args[idIndex + 1] : null;

  const coordinators = loadCoordinators();
  const performers = loadPerformers();
  const productions = loadProductions();
  const videos = loadVideos();

  console.log(`Loaded: ${coordinators.length} coordinators, ${performers.length} performers, ${productions.length} productions, ${videos.length} videos\n`);

  let scanned = 0;
  let suggestions = 0;

  for (const video of videos) {
    if (specificId && video.id !== specificId) continue;
    if (onlyNew && video.hasCoords && video.hasPerfs && video.hasProds) continue;

    const text = video.title + ' ' + video.desc;

    const coordMatches = video.hasCoords ? [] : findMatches(text, coordinators, 'name');
    const perfMatches = video.hasPerfs ? [] : findMatches(text, performers, 'name');
    const prodMatches = video.hasProds ? [] : findMatches(text, productions, 'title');

    if (coordMatches.length > 0 || perfMatches.length > 0 || prodMatches.length > 0) {
      console.log(`\x1b[1m${video.id}: ${video.title}\x1b[0m`);

      if (coordMatches.length > 0) {
        console.log(`  Coordinators: ${coordMatches.map(c => `coord('${c.id}') // ${c.name} [${c.matchType}]`).join(', ')}`);
      }
      if (perfMatches.length > 0) {
        console.log(`  Performers:   ${perfMatches.map(p => `perf('${p.id}') // ${p.name} [${p.matchType}]`).join(', ')}`);
      }
      if (prodMatches.length > 0) {
        console.log(`  Productions:  ${prodMatches.map(p => `prod('${p.id}') // ${p.title} [${p.matchType}]`).join(', ')}`);
      }
      console.log();
      suggestions++;
    }
    scanned++;
  }

  console.log(`\nScanned ${scanned} videos. Found ${suggestions} with suggested refs.`);
}

main();
