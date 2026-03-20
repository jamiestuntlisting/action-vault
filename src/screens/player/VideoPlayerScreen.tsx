import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Platform, TextInput, Keyboard, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { videoMap, videos } from '../../data';
import { performers } from '../../data/performers';
import { coordinators } from '../../data/coordinators';

const isWeb = Platform.OS === 'web';

// Only import WebView on native
let NativeWebView: any = null;
if (!isWeb) {
  try { NativeWebView = require('react-native-webview').WebView; } catch (e) {}
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayerScreen({ route, navigation }: any) {
  const { videoId, startTime = 0, embedUrl: directEmbedUrl, title: reelTitle, queue: reelQueue, videoQueue, reelId: currentReelId } = route.params;
  const video = videoId ? videoMap.get(videoId) : null;
  const { state, dispatch, getRating } = useAppState();
  const webviewRef = useRef<any>(null);
  const webPlayerRef = useRef<any>(null);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [showTagOverlay, setShowTagOverlay] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagRole, setTagRole] = useState('Performer');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagConfirm, setShowTagConfirm] = useState(false);
  const [ratingToast, setRatingToast] = useState<string | null>(null);
  const controlsTimer = useRef<any>(null);

  // Determine if there's a next item in the queue
  const hasNextInQueue = (reelQueue && reelQueue.length > 0) || (videoQueue && videoQueue.length > 0);

  // Current rating for this video (library videos)
  const videoRating = videoId ? getRating(videoId) : null;

  // Current rating for reels
  const reelRating = currentReelId ? (state.settings.reelRatings || {} as any)[currentReelId] : null;

  // Which thumbs state to show — only for library videos and reels, NOT Atlas Action
  const canRate = !!(videoId || currentReelId);
  const currentThumbs = videoId ? videoRating?.thumbs : (currentReelId ? reelRating?.thumbs : null);

  // Is this a reel (skill or stunt reel)? If so, show flag button instead of tag person
  const isReel = !!(currentReelId || (directEmbedUrl && !videoId));
  const canTagPerson = !!videoId; // Only library videos support person tagging

  // Atlas Action videos: no videoId, no reelId, just directEmbedUrl
  const isAtlasAction = !!(directEmbedUrl && !videoId && !currentReelId);

  // Build list of known names for autocomplete
  const knownNames = useMemo(() => {
    const names = new Set<string>();
    performers.forEach(p => names.add(p.name));
    coordinators.forEach(c => names.add(c.name));
    // Include existing person tags
    (state.settings.personTags || []).forEach((t: any) => names.add(t.name));
    return Array.from(names).sort();
  }, [state.settings.personTags]);

  // Filter suggestions as user types
  useEffect(() => {
    if (!tagName.trim()) { setTagSuggestions([]); return; }
    const q = tagName.toLowerCase();
    setTagSuggestions(knownNames.filter(n => n.toLowerCase().includes(q)).slice(0, 5));
  }, [tagName, knownNames]);

  function submitPersonTag(name?: string) {
    const finalName = (name || tagName).trim();
    if (!finalName || !videoId) return;
    const existing = state.settings.personTags || [];
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        personTags: [
          ...existing,
          { videoId, name: finalName, timestampSeconds: Math.floor(currentTime), role: tagRole, taggedAt: new Date().toISOString() },
        ],
      },
    });
    setTagName('');
    setShowTagOverlay(false);
    setShowTagConfirm(true);
    setTimeout(() => setShowTagConfirm(false), 2000);
  }

  // ─── Rating handlers ───
  function handleThumb(direction: 'up' | 'down') {
    if (videoId) {
      // Library video rating
      const rating = getRating(videoId);
      dispatch({
        type: 'SET_RATING',
        payload: {
          profileId: '',
          videoId,
          thumbs: rating?.thumbs === direction ? null : direction,
          difficultyRating: rating?.difficultyRating || null,
          bestOfBest: rating?.bestOfBest || false,
          reviewText: rating?.reviewText || '',
          createdAt: new Date().toISOString(),
        },
      });
    } else if (currentReelId) {
      // Reel rating
      const existing = state.settings.reelRatings || {};
      const current = (existing as any)[currentReelId];
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          reelRatings: {
            ...existing,
            [currentReelId]: {
              thumbs: current?.thumbs === direction ? null : direction,
              ratedAt: new Date().toISOString(),
            },
          },
        },
      });
    }
    // Show toast
    const isRemoving = (videoId && videoRating?.thumbs === direction) || (currentReelId && reelRating?.thumbs === direction);
    setRatingToast(isRemoving ? 'Rating removed' : direction === 'up' ? 'Rated 👍' : 'Not for me 👎');
    setTimeout(() => setRatingToast(null), 1500);
  }

  // ─── Skip to next in queue ───
  function skipToNext() {
    // Save progress before skipping
    if (videoId) {
      dispatch({
        type: 'ADD_TO_WATCH_HISTORY',
        payload: {
          profileId: '',
          videoId,
          progressSeconds: currentTime,
          completed: duration > 0 ? currentTime >= duration * 0.9 : false,
          lastWatchedAt: new Date().toISOString(),
        },
      });
    }
    if (reelQueue && reelQueue.length > 0) {
      const next = reelQueue[0];
      const remaining = reelQueue.slice(1);
      navigation.replace('VideoPlayer', {
        embedUrl: next.embedUrl,
        title: next.title,
        queue: remaining,
        reelId: next.reelId,
      });
    } else if (videoQueue && videoQueue.length > 0) {
      const next = videoQueue[0];
      const remaining = videoQueue.slice(1);
      navigation.replace('VideoPlayer', {
        videoId: next.videoId,
        videoQueue: remaining,
      });
    }
  }

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  useEffect(() => {
    if (showControls && playerReady) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 5000);
    }
    return () => clearTimeout(controlsTimer.current);
  }, [showControls, playerReady]);

  // Support direct embed URL for reels (no video object needed)
  const resolvedEmbedUrl = directEmbedUrl || (video ? video.embedUrl : null);
  const youtubeId = directEmbedUrl
    ? (directEmbedUrl.match(/youtube\.com\/embed\/([^?&/]+)/)?.[1] || '')
    : (video ? (video.sourceUrl.match(/(?:v=|\/embed\/)([^&?/]+)/)?.[1] || '') : '');

  if (!video && !directEmbedUrl) return null;

  // Use YouTube IFrame Player API for full control
  const playerHtml = `
    <!DOCTYPE html>
    <html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
      #player { width: 100%; height: 100%; }
    </style>
    </head><body>
    <div id="player"></div>
    <script>
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      var player;
      var timeUpdateInterval;

      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          videoId: '${youtubeId}',
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            disablekb: 1,
            showinfo: 0,
            start: ${startTime},
            fs: 0,
            iv_load_policy: 3,
            cc_load_policy: 0,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          }
        });
      }

      function onPlayerReady(event) {
        event.target.playVideo();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ready',
          duration: player.getDuration()
        }));
        startTimeUpdates();
      }

      function onPlayerStateChange(event) {
        var state = event.data;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'stateChange',
          state: state,
          currentTime: player.getCurrentTime(),
          duration: player.getDuration()
        }));
        if (state === YT.PlayerState.PLAYING) {
          startTimeUpdates();
        } else {
          stopTimeUpdates();
        }
      }

      function startTimeUpdates() {
        stopTimeUpdates();
        timeUpdateInterval = setInterval(function() {
          if (player && player.getCurrentTime) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'timeUpdate',
              currentTime: player.getCurrentTime(),
              duration: player.getDuration()
            }));
          }
        }, 1000);
      }

      function stopTimeUpdates() {
        if (timeUpdateInterval) {
          clearInterval(timeUpdateInterval);
          timeUpdateInterval = null;
        }
      }

      // Commands from React Native
      window.playerCommand = function(cmd) {
        if (!player) return;
        try {
          var data = JSON.parse(cmd);
          switch(data.action) {
            case 'play': player.playVideo(); break;
            case 'pause': player.pauseVideo(); break;
            case 'seek': player.seekTo(data.time, true); break;
            case 'setSpeed': player.setPlaybackRate(data.rate); break;
          }
        } catch(e) {}
      };
    </script>
    </body></html>
  `;

  function sendCommand(action: string, params: any = {}) {
    const cmd = JSON.stringify({ action, ...params });
    if (isWeb && webPlayerRef.current) {
      // Web: call playerCommand on the iframe's content window or via the YT API ref
      try {
        webPlayerRef.current.playerCommand(cmd);
      } catch (e) {}
    } else {
      webviewRef.current?.injectJavaScript(`window.playerCommand('${cmd}'); true;`);
    }
  }

  function handleMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent ? event.nativeEvent.data : event.data);
      switch (data.type) {
        case 'ready':
          setPlayerReady(true);
          if (data.duration) setDuration(data.duration);
          break;
        case 'timeUpdate':
          setCurrentTime(data.currentTime || 0);
          if (data.duration) setDuration(data.duration);
          break;
        case 'stateChange':
          // YT.PlayerState: PLAYING=1, PAUSED=2, ENDED=0, BUFFERING=3
          setIsPlaying(data.state === 1);
          setCurrentTime(data.currentTime || 0);
          if (data.duration) setDuration(data.duration);
          // Auto-advance to next item in queue when video ends
          if (data.state === 0) {
            if (reelQueue && reelQueue.length > 0) {
              const next = reelQueue[0];
              const remaining = reelQueue.slice(1);
              navigation.replace('VideoPlayer', {
                embedUrl: next.embedUrl,
                title: next.title,
                queue: remaining,
                reelId: next.reelId,
              });
            } else if (videoQueue && videoQueue.length > 0) {
              const next = videoQueue[0];
              const remaining = videoQueue.slice(1);
              navigation.replace('VideoPlayer', {
                videoId: next.videoId,
                videoQueue: remaining,
              });
            }
          }
          break;
      }
    } catch (e) {}
  }

  // Web: set up YouTube IFrame API
  useEffect(() => {
    if (!isWeb || !youtubeId) return;
    // Load YouTube IFrame API
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    function createPlayer() {
      const container = document.getElementById('yt-player-container');
      if (!container) return;
      // Clear any existing player
      container.innerHTML = '';
      const playerDiv = document.createElement('div');
      playerDiv.id = 'yt-player';
      container.appendChild(playerDiv);

      const player = new (window as any).YT.Player('yt-player', {
        videoId: youtubeId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          controls: isAtlasAction ? 0 : 1,
          rel: 0,
          modestbranding: 1,
          start: startTime,
          iv_load_policy: 3,
          cc_load_policy: 0,
          disablekb: isAtlasAction ? 1 : 0,
          fs: isAtlasAction ? 0 : 1,
          showinfo: 0,
        },
        events: {
          onReady: (event: any) => {
            event.target.playVideo();
            setPlayerReady(true);
            setDuration(player.getDuration() || 0);
            // Start time updates
            const interval = setInterval(() => {
              try {
                if (player && player.getCurrentTime) {
                  setCurrentTime(player.getCurrentTime());
                  setDuration(player.getDuration() || 0);
                }
              } catch (e) {}
            }, 1000);
            (webPlayerRef as any)._timeInterval = interval;
          },
          onStateChange: (event: any) => {
            const ytState = event.data;
            setIsPlaying(ytState === 1);
            try {
              setCurrentTime(player.getCurrentTime() || 0);
              setDuration(player.getDuration() || 0);
            } catch (e) {}
            // Auto-advance on end (state === 0)
            if (ytState === 0) {
              if (reelQueue && reelQueue.length > 0) {
                const next = reelQueue[0];
                const remaining = reelQueue.slice(1);
                navigation.replace('VideoPlayer', {
                  embedUrl: next.embedUrl,
                  title: next.title,
                  queue: remaining,
                  reelId: next.reelId,
                });
              } else if (videoQueue && videoQueue.length > 0) {
                const next = videoQueue[0];
                const remaining = videoQueue.slice(1);
                navigation.replace('VideoPlayer', {
                  videoId: next.videoId,
                  videoQueue: remaining,
                });
              }
            }
          },
        },
      });

      webPlayerRef.current = {
        playerCommand: (cmd: string) => {
          try {
            const data = JSON.parse(cmd);
            switch (data.action) {
              case 'play': player.playVideo(); break;
              case 'pause': player.pauseVideo(); break;
              case 'seek': player.seekTo(data.time, true); break;
              case 'setSpeed': player.setPlaybackRate(data.rate); break;
            }
          } catch (e) {}
        },
      };
    }

    // Wait for YT API to load
    if ((window as any).YT && (window as any).YT.Player) {
      setTimeout(createPlayer, 100);
    } else {
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if ((webPlayerRef as any)._timeInterval) {
        clearInterval((webPlayerRef as any)._timeInterval);
      }
    };
  }, [youtubeId]);

  function toggleControls() {
    setShowControls(!showControls);
  }

  function togglePlayPause() {
    if (isPlaying) {
      sendCommand('pause');
    } else {
      sendCommand('play');
    }
    setIsPlaying(!isPlaying);
  }

  function skipForward() {
    const newTime = Math.min(currentTime + 10, duration);
    sendCommand('seek', { time: newTime });
    setCurrentTime(newTime);
  }

  function skipBackward() {
    const newTime = Math.max(currentTime - 10, 0);
    sendCommand('seek', { time: newTime });
    setCurrentTime(newTime);
  }

  function changeSpeed(newSpeed: number) {
    setSpeed(newSpeed);
    setIsSlowMo(newSpeed < 1);
    sendCommand('setSpeed', { rate: newSpeed });
  }

  function toggleSlowMo() {
    if (isSlowMo) {
      changeSpeed(1);
    } else {
      changeSpeed(0.25);
    }
  }

  function handleClose() {
    if (videoId) {
      dispatch({
        type: 'ADD_TO_WATCH_HISTORY',
        payload: {
          profileId: '',
          videoId,
          progressSeconds: currentTime,
          completed: duration > 0 ? currentTime >= duration * 0.9 : false,
          lastWatchedAt: new Date().toISOString(),
        },
      });
    }
    navigation.goBack();
  }

  function addBookmark() {
    if (!videoId) return;
    dispatch({
      type: 'ADD_BOOKMARK',
      payload: {
        id: 'bk-' + Date.now(),
        profileId: '',
        videoId,
        timestampSeconds: Math.floor(currentTime),
        note: '',
        createdAt: new Date().toISOString(),
      },
    });
  }

  function handleReportBrokenVideo() {
    const videoTitle = reelTitle || 'Unknown Reel';
    const videoUrl = directEmbedUrl || '';
    const reelRef = currentReelId || 'N/A';
    const subject = encodeURIComponent(`Broken Video Report: ${videoTitle}`);
    const body = encodeURIComponent(
      `Hi StuntListing,\n\n` +
      `I'd like to report a video that isn't working.\n\n` +
      `Video Title: ${videoTitle}\n` +
      `Reel ID: ${reelRef}\n` +
      `Video URL: ${videoUrl}\n` +
      `Reported At: ${new Date().toISOString()}\n\n` +
      `Please look into this. Thank you!`
    );
    const mailtoUrl = `mailto:stuntlisting@gmail.com?subject=${subject}&body=${body}`;
    if (isWeb) {
      window.open(mailtoUrl, '_blank');
    } else {
      Linking.openURL(mailtoUrl);
    }
  }

  const videoDuration = duration || (video ? video.durationSeconds : 0);
  const progressPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  // Shared tag overlay component — only for library videos
  const tagOverlay = (showTagOverlay && canTagPerson) ? (
    <View style={styles.tagOverlay}>
      <Text style={styles.tagOverlayTitle}>Tag a Person</Text>
      <View style={styles.tagRoleRow}>
        {['Performer', 'Coordinator', 'Actor', 'Director'].map(role => (
          <TouchableOpacity
            key={role}
            style={[styles.tagRoleBtn, tagRole === role && styles.tagRoleBtnActive]}
            onPress={() => setTagRole(role)}
          >
            <Text style={[styles.tagRoleText, tagRole === role && styles.tagRoleTextActive]}>{role}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tagInputRow}>
        <TextInput
          style={styles.tagInput}
          placeholder="Type name..."
          placeholderTextColor={Colors.textMuted}
          value={tagName}
          onChangeText={setTagName}
          onSubmitEditing={() => submitPersonTag()}
          autoFocus
          returnKeyType="done"
        />
        <TouchableOpacity onPress={() => submitPersonTag()} style={styles.tagSubmitBtn}>
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {tagSuggestions.length > 0 && (
        <View style={styles.tagSuggestions}>
          {tagSuggestions.map(s => (
            <TouchableOpacity key={s} style={styles.tagSuggestionItem} onPress={() => submitPersonTag(s)}>
              <Ionicons name="person" size={14} color={Colors.textSecondary} />
              <Text style={styles.tagSuggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  ) : null;

  // Shared confirmation toasts
  const toasts = (
    <>
      {showTagConfirm && (
        <View style={styles.tagConfirmToast}>
          <Ionicons name="checkmark-circle" size={18} color="#4caf50" />
          <Text style={styles.tagConfirmText}>Person tagged!</Text>
        </View>
      )}
      {ratingToast && (
        <View style={styles.tagConfirmToast}>
          <Ionicons name="star" size={18} color={Colors.primary} />
          <Text style={[styles.tagConfirmText, { color: Colors.primary }]}>{ratingToast}</Text>
        </View>
      )}
    </>
  );

  // Queue info bar
  const queueInfo = hasNextInQueue ? (
    <View style={styles.queueInfo}>
      <Text style={styles.queueInfoText}>
        Up next: {reelQueue?.[0]?.title || (videoQueue?.[0]?.videoId ? videoMap.get(videoQueue[0].videoId)?.title : '')}
      </Text>
      <Text style={styles.queueCountText}>
        {(reelQueue?.length || 0) + (videoQueue?.length || 0)} remaining
      </Text>
    </View>
  ) : null;

  // Web platform: use YouTube IFrame API directly
  if (isWeb) {
    return (
      <View style={styles.container}>
        {/* Header bar */}
        <View style={styles.webHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.webHeaderTitle} numberOfLines={1}>{video ? video.title : (reelTitle || 'Reel')}</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {/* Thumbs up — only for library videos and reels, not Atlas Action */}
            {canRate && (
              <TouchableOpacity onPress={() => handleThumb('up')} style={styles.backButton}>
                <Ionicons
                  name={currentThumbs === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={20}
                  color={currentThumbs === 'up' ? Colors.primary : Colors.white}
                />
              </TouchableOpacity>
            )}
            {/* Thumbs down */}
            {canRate && (
              <TouchableOpacity onPress={() => handleThumb('down')} style={styles.backButton}>
                <Ionicons
                  name={currentThumbs === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
                  size={20}
                  color={currentThumbs === 'down' ? '#ff4444' : Colors.white}
                />
              </TouchableOpacity>
            )}
            {/* Skip to next */}
            {hasNextInQueue && (
              <TouchableOpacity onPress={skipToNext} style={styles.backButton}>
                <Ionicons name="play-skip-forward" size={22} color={Colors.white} />
              </TouchableOpacity>
            )}
            {/* Tag person — library videos only */}
            {canTagPerson && (
              <TouchableOpacity onPress={() => setShowTagOverlay(!showTagOverlay)} style={styles.backButton}>
                <Ionicons name="person-add-outline" size={20} color={showTagOverlay ? Colors.primary : Colors.white} />
              </TouchableOpacity>
            )}
            {/* Report broken video — reels only */}
            {isReel && (
              <TouchableOpacity onPress={handleReportBrokenVideo} style={styles.backButton}>
                <Ionicons name="flag-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
            )}
            {canTagPerson && (
              <TouchableOpacity onPress={addBookmark} style={styles.backButton}>
                <Ionicons name="bookmark-outline" size={22} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Queue info */}
        {queueInfo}

        {/* YouTube Player Container */}
        <View style={{ flex: 1 }} nativeID="yt-player-container" />

        {/* Frame-by-frame keyboard hint */}
        <View style={{ backgroundColor: 'rgba(0,0,0,0.85)', paddingVertical: 4, paddingHorizontal: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center' }}>
            ⌨️ Frame-by-frame: pause video, then press , (back) or . (forward)  ·  ← → to skip 5s  ·  Space to play/pause
          </Text>
        </View>

        {/* Atlas Action: overlay to block YouTube logo/links */}
        {isAtlasAction && (
          <View
            style={{
              position: 'absolute',
              top: 44,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 5,
            }}
            pointerEvents="box-none"
          >
            {/* Block top-right YouTube logo area */}
            <View style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 50 }} />
            {/* Block bottom-right YouTube logo area */}
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 140, height: 40 }} />
          </View>
        )}

        {tagOverlay}
        {toasts}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NativeWebView
        ref={webviewRef}
        source={{ html: playerHtml }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        scrollEnabled={false}
        onMessage={handleMessage}
        allowsFullscreenVideo={false}
      />

      {/* Back button - always visible */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {/* Tag person — library videos only */}
        {canTagPerson && (
          <TouchableOpacity onPress={() => setShowTagOverlay(!showTagOverlay)} style={styles.backButton}>
            <Ionicons name="person-add-outline" size={20} color={showTagOverlay ? Colors.primary : Colors.white} />
          </TouchableOpacity>
        )}
        {/* Report broken video — reels only */}
        {isReel && (
          <TouchableOpacity onPress={handleReportBrokenVideo} style={styles.backButton}>
            <Ionicons name="flag-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
        {canTagPerson && (
          <TouchableOpacity onPress={addBookmark} style={styles.backButton}>
            <Ionicons name="bookmark-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Title bar */}
      <View style={styles.titleBar}>
        <Text style={styles.videoTitle} numberOfLines={1}>{video ? video.title : (reelTitle || 'Reel')}</Text>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        {/* Progress info */}
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
          </View>
          <Text style={styles.timeText}>{formatTime(videoDuration)}</Text>
        </View>

        {/* Playback controls */}
        <View style={styles.controlButtons}>
          <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
            <Ionicons name="play-back" size={20} color={Colors.white} />
            <Text style={styles.controlLabel}>-10s</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={skipForward}>
            <Ionicons name="play-forward" size={20} color={Colors.white} />
            <Text style={styles.controlLabel}>+10s</Text>
          </TouchableOpacity>

          {/* Skip to next in queue */}
          {hasNextInQueue && (
            <TouchableOpacity style={styles.controlButton} onPress={skipToNext}>
              <Ionicons name="play-skip-forward" size={20} color={Colors.white} />
              <Text style={styles.controlLabel}>Next</Text>
            </TouchableOpacity>
          )}

          {/* Thumbs up — only for library videos and reels, not Atlas Action */}
          {canRate && (
            <TouchableOpacity
              style={[styles.controlButton, currentThumbs === 'up' && styles.controlButtonActive]}
              onPress={() => handleThumb('up')}
            >
              <Ionicons
                name={currentThumbs === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
                size={18}
                color={currentThumbs === 'up' ? Colors.primary : Colors.white}
              />
              <Text style={[styles.controlLabel, currentThumbs === 'up' && styles.controlLabelActive]}>Rate</Text>
            </TouchableOpacity>
          )}

          {/* Thumbs down */}
          {canRate && (
            <TouchableOpacity
              style={[styles.controlButton, currentThumbs === 'down' && styles.controlButtonActive]}
              onPress={() => handleThumb('down')}
            >
              <Ionicons
                name={currentThumbs === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
                size={18}
                color={currentThumbs === 'down' ? '#ff4444' : Colors.white}
              />
              <Text style={[styles.controlLabel, currentThumbs === 'down' && { color: '#ff4444' }]}>Nah</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, isSlowMo && styles.controlButtonActive]}
            onPress={toggleSlowMo}
          >
            <Ionicons name="speedometer-outline" size={18} color={isSlowMo ? Colors.primary : Colors.white} />
            <Text style={[styles.controlLabel, isSlowMo && styles.controlLabelActive]}>Slow-Mo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowSpeedPicker(!showSpeedPicker)}
          >
            <Text style={styles.speedValue}>{speed}x</Text>
            <Text style={styles.controlLabel}>Speed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tagOverlay}
      {toasts}

      {/* Speed picker overlay */}
      {showSpeedPicker && (
        <View style={styles.speedPicker}>
          {PLAYBACK_SPEEDS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.speedOption, speed === s && styles.speedOptionActive]}
              onPress={() => { changeSpeed(s); setShowSpeedPicker(false); }}
            >
              <Text style={[styles.speedOptionText, speed === s && styles.speedOptionTextActive]}>{s}x</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingTop: 20,
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  webHeaderTitle: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: Spacing.sm,
  },
  backButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  titleBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 95 : 65,
    left: Spacing.screen,
    right: Spacing.screen,
  },
  videoTitle: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.screen,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    paddingTop: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 8,
  },
  timeText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    width: 40,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  controlButton: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(229,9,20,0.2)',
    borderRadius: BorderRadius.sm,
  },
  controlLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
  },
  controlLabelActive: {
    color: Colors.primary,
  },
  speedValue: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  speedPicker: {
    position: 'absolute',
    bottom: 120,
    right: Spacing.screen,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 2,
  },
  speedOption: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  speedOptionActive: {
    backgroundColor: Colors.primary,
  },
  speedOptionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  speedOptionTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  queueInfo: {
    backgroundColor: 'rgba(229,9,20,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueInfoText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    flex: 1,
  },
  queueCountText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  // Tag overlay styles
  tagOverlay: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 60 : (Platform.OS === 'ios' ? 100 : 70),
    right: Spacing.screen,
    width: 260,
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    zIndex: 100,
  },
  tagOverlayTitle: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  tagRoleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  tagRoleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tagRoleBtnActive: {
    backgroundColor: Colors.primary + '44',
    borderColor: Colors.primary,
  },
  tagRoleText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  tagRoleTextActive: {
    color: Colors.primary,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.white,
    fontSize: FontSize.sm,
  },
  tagSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    padding: 8,
  },
  tagSuggestions: {
    marginTop: 4,
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  tagSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tagSuggestionText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
  },
  tagConfirmToast: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 60 : (Platform.OS === 'ios' ? 100 : 70),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20,20,20,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
  },
  tagConfirmText: {
    color: '#4caf50',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
