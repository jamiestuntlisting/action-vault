// Horizontal sibling of VerticalRatingSlider, used in mobile-portrait
// voting layouts where the slider sits below the video instead of beside
// it. Same props + same value semantics so the calling screen just swaps
// components.

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, GestureResponderEvent, Platform } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius } from '../theme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  width?: number;       // length of the horizontal track
  disabled?: boolean;
}

const MIN = 0;
const MAX = 10;
const STEPS = MAX - MIN;
const TRACK_HEIGHT = 8;
const THUMB_SIZE = 32;

export function HorizontalRatingSlider({ value, onChange, width = 320, disabled = false }: Props) {
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<View>(null);
  const trackLeftRef = useRef(0);

  const valueFromX = useCallback((x: number) => {
    const clamped = Math.max(0, Math.min(width, x));
    const ratio = clamped / width;
    return Math.round(ratio * STEPS) + MIN;
  }, [width]);

  const measureAndUpdate = useCallback((pageX: number) => {
    if (disabled) return;
    trackRef.current?.measureInWindow?.((trackX) => {
      trackLeftRef.current = trackX;
      onChange(valueFromX(pageX - trackX));
    });
  }, [disabled, onChange, valueFromX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        setDragging(true);
        measureAndUpdate(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        if (trackLeftRef.current != null) {
          onChange(valueFromX(evt.nativeEvent.pageX - trackLeftRef.current));
        }
      },
      onPanResponderRelease: () => setDragging(false),
      onPanResponderTerminate: () => setDragging(false),
    })
  ).current;

  const pct = (value - MIN) / STEPS;
  const thumbCenterX = pct * width;
  const fillWidth = pct * width;

  // Web keyboard support (same as vertical sibling).
  const containerWebRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node: any = containerWebRef.current;
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (disabled) return;
      if (!node.contains(document.activeElement) && document.activeElement !== node) return;
      let next = value;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = Math.min(MAX, value + 1);
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = Math.max(MIN, value - 1);
      else if (e.key === 'Home') next = MIN;
      else if (e.key === 'End') next = MAX;
      else return;
      e.preventDefault();
      if (next !== value) onChange(next);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [value, disabled, onChange]);

  const webProps: any = Platform.OS === 'web'
    ? {
        ref: containerWebRef,
        tabIndex: disabled ? -1 : 0,
        role: 'slider',
        'aria-valuemin': MIN,
        'aria-valuemax': MAX,
        'aria-valuenow': value,
        'aria-orientation': 'horizontal',
        'aria-disabled': disabled,
      }
    : {};

  // Tick marks below the track. "No score" replaces the "0" label; the
  // tick mark itself stays in the same column for all ticks.
  const ticks: React.ReactElement[] = [];
  for (let i = 0; i <= STEPS; i += 2) {
    const tickX = (i / STEPS) * width;
    const isNoScore = i === 0;
    ticks.push(
      <View
        key={i}
        style={[styles.tickCol, { left: tickX, transform: [{ translateX: -30 }], width: 60 }]}
        pointerEvents="none"
      >
        <View style={styles.tickMark} />
        <Text
          style={[styles.tickLabel, isNoScore && styles.tickLabelNoScore]}
          numberOfLines={1}
        >
          {isNoScore ? 'No score' : i}
        </Text>
      </View>,
    );
  }

  return (
    <View style={styles.container} {...webProps}>
      <Text style={[styles.readout, value === 0 && styles.readoutNoScore]}>
        {value === 0 ? 'No score' : value}
      </Text>
      <View style={[styles.sliderArea, { width: width + THUMB_SIZE }]}>
        <View
          ref={trackRef}
          style={[styles.track, { width, marginLeft: THUMB_SIZE / 2 }]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.trackFill, { width: fillWidth }]} />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              // Track sits inside sliderArea with marginLeft: THUMB_SIZE/2.
              // Thumb's center should land at THUMB_SIZE/2 + thumbCenterX in
              // sliderArea coords; subtract THUMB_SIZE/2 to get the left
              // edge → just thumbCenterX.
              left: thumbCenterX,
              transform: [{ scale: dragging ? 1.15 : 1 }],
              backgroundColor: disabled ? Colors.textMuted : Colors.accent,
            },
          ]}
        />
        <View style={[styles.tickStrip, { width, marginLeft: THUMB_SIZE / 2 }]}>
          {ticks}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', alignSelf: 'stretch' },
  readout: {
    color: Colors.accent, fontSize: 48, fontWeight: FontWeight.heavy,
    minWidth: 70, textAlign: 'center',
  },
  readoutNoScore: {
    fontSize: 20, color: Colors.textTertiary, fontWeight: FontWeight.semibold,
  },
  // sliderArea height accommodates: thumb (32) overflowing the track on top,
  // track itself (8), gap (10), tick marks (8) + tick labels (~16) below.
  sliderArea: { position: 'relative', height: THUMB_SIZE + 10 + 8 + 18, marginTop: 8 },
  track: {
    position: 'absolute',
    top: (THUMB_SIZE - TRACK_HEIGHT) / 2,
    height: TRACK_HEIGHT,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  trackFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: BorderRadius.round },
  thumb: {
    position: 'absolute',
    top: 0,
    width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2,
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tickStrip: { position: 'absolute', top: THUMB_SIZE + 10, height: 26 },
  tickCol: { position: 'absolute', alignItems: 'center', gap: 4 },
  tickMark: { width: 2, height: 8, backgroundColor: Colors.borderLight, borderRadius: 1 },
  tickLabel: { color: Colors.textTertiary, fontSize: FontSize.sm, fontWeight: FontWeight.medium, textAlign: 'center' },
  tickLabelNoScore: { color: Colors.textMuted, fontSize: 11, fontStyle: 'italic' },
});
