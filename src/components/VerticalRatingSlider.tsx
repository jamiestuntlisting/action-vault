import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, GestureResponderEvent } from 'react-native';
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
  const thumbY = trackHeight - pct * trackHeight - THUMB_SIZE / 2;
  const fillHeight = pct * trackHeight;

  const ticks = [];
  for (let i = 0; i <= STEPS; i += 2) {
    const tickPct = i / STEPS;
    const tickY = trackHeight - tickPct * trackHeight;
    ticks.push(
      <View key={i} style={[styles.tickRow, { top: tickY - 8 }]} pointerEvents="none">
        <Text style={styles.tickLabel}>{i}</Text>
        <View style={styles.tickMark} />
      </View>,
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.readout}>{value}</Text>
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
              top: thumbY + THUMB_SIZE / 2,
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
    marginTop: -THUMB_SIZE / 2,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tickRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    left: 20,
    width: 60,
  },
  tickLabel: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    width: 16,
    textAlign: 'right',
  },
  tickMark: {
    width: 8,
    height: 2,
    backgroundColor: Colors.borderLight,
    borderRadius: 1,
  },
});
