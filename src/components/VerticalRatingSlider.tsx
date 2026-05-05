import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, GestureResponderEvent, Platform } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius } from '../theme';

interface VerticalRatingSliderProps {
  value: number;
  onChange: (value: number) => void;
  height?: number;
  disabled?: boolean;
}

const MIN = 0;
const MAX = 10;
const STEPS = MAX - MIN;
const TRACK_WIDTH = 8;
const THUMB_SIZE = 32;

export function VerticalRatingSlider({ value, onChange, height = 320, disabled = false }: VerticalRatingSliderProps) {
  const [dragging, setDragging] = useState(false);
  const trackHeight = height;
  const trackRef = useRef<View>(null);
  const trackTopRef = useRef(0);

  const valueFromY = useCallback((y: number) => {
    const clamped = Math.max(0, Math.min(trackHeight, y));
    const ratio = 1 - clamped / trackHeight;
    return Math.round(ratio * STEPS) + MIN;
  }, [trackHeight]);

  const measureAndUpdate = useCallback((pageY: number) => {
    if (disabled) return;
    trackRef.current?.measureInWindow?.((_x, trackY) => {
      trackTopRef.current = trackY;
      const local = pageY - trackY;
      onChange(valueFromY(local));
    });
  }, [disabled, onChange, valueFromY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        setDragging(true);
        measureAndUpdate(evt.nativeEvent.pageY);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const pageY = evt.nativeEvent.pageY;
        if (trackTopRef.current != null) {
          const local = pageY - trackTopRef.current;
          onChange(valueFromY(local));
        }
      },
      onPanResponderRelease: () => setDragging(false),
      onPanResponderTerminate: () => setDragging(false),
    })
  ).current;

  const pct = (value - MIN) / STEPS;
  // Thumb's CENTER aligns with the value tick; previously the formula put
  // the thumb's TOP there, which made the value-10 thumb visually sit
  // halfway below the "10" label (off the chart, per Jamie's feedback).
  const thumbCenterY = trackHeight - pct * trackHeight;
  const fillHeight = pct * trackHeight;

  const ticks = [];
  for (let i = 0; i <= STEPS; i += 2) {
    const tickPct = i / STEPS;
    const tickY = trackHeight - tickPct * trackHeight;
    const isNoScore = i === 0;
    ticks.push(
      // Right-anchor the row so the tick MARK lands at the same x for every
      // row regardless of label width (otherwise "No score" pushed its mark
      // far to the right of the numeric ticks').
      <View key={i} style={[styles.tickRow, { top: tickY - 8 }]} pointerEvents="none">
        <Text
          style={[styles.tickLabel, isNoScore && styles.tickLabelNoScore]}
          numberOfLines={1}
        >
          {isNoScore ? 'No score' : i}
        </Text>
        <View style={styles.tickMark} />
      </View>,
    );
  }

  // Web keyboard support: arrow keys nudge the rating ±1.
  // Up/Right increases, Down/Left decreases. Active when the slider has DOM focus.
  const containerWebRef = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node: any = containerWebRef.current;
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (disabled) return;
      // Only react when the slider (or a child) is focused.
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

  // Web-only props for keyboard focus + ARIA semantics.
  const webProps: any = Platform.OS === 'web'
    ? {
        ref: containerWebRef,
        tabIndex: disabled ? -1 : 0,
        role: 'slider',
        'aria-valuemin': MIN,
        'aria-valuemax': MAX,
        'aria-valuenow': value,
        'aria-disabled': disabled,
      }
    : {};

  return (
    <View style={styles.container} {...webProps}>
      <Text style={[styles.readout, value === 0 && styles.readoutNoScore]}>
        {value === 0 ? 'No score' : value}
      </Text>
      <View style={[styles.sliderArea, { height: trackHeight + THUMB_SIZE }]}>
        {ticks}
        <View
          ref={trackRef}
          style={[styles.track, { height: trackHeight, marginTop: THUMB_SIZE / 2 }]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.trackFill, { height: fillHeight }]} />
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              // Thumb's center sits at the value's tick. Track has
              // marginTop: THUMB_SIZE/2 within sliderArea, so a track-local
              // y of thumbCenterY lands at sliderArea-local y of
              // thumbCenterY + THUMB_SIZE/2; subtract THUMB_SIZE/2 to get
              // the thumb's top → cancels to thumbCenterY.
              top: thumbCenterY,
              transform: [{ scale: dragging ? 1.15 : 1 }],
              backgroundColor: disabled ? Colors.textMuted : Colors.accent,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 170,
  },
  readout: {
    color: Colors.accent,
    fontSize: 56,
    fontWeight: FontWeight.heavy,
    marginBottom: 12,
    minWidth: 70,
    textAlign: 'center',
  },
  readoutNoScore: {
    fontSize: 22,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
    marginBottom: 12 + (56 - 22),
  },
  tickLabelNoScore: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontStyle: 'italic',
  },
  sliderArea: {
    position: 'relative',
    width: 170,
    alignItems: 'center',
  },
  track: {
    position: 'absolute',
    width: TRACK_WIDTH,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surfaceHighlight,
    left: (170 - TRACK_WIDTH) / 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  trackFill: {
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.round,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    left: (170 - THUMB_SIZE) / 2,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  // Right-anchor each tick row so the tickMark column sits at the same x
  // for every tick, regardless of whether the label is "10" or "No score".
  tickRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    right: (170 - TRACK_WIDTH) / 2 + TRACK_WIDTH + 6, // align mark to track's left edge + small gap
    gap: 6,
  },
  tickLabel: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  tickMark: {
    width: 8,
    height: 2,
    backgroundColor: Colors.borderLight,
    borderRadius: 1,
  },
});
