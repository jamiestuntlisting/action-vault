import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { avatarMap, avatarOptions } from '../../data/avatars';

export function ProfilePickerScreen({ navigation }: any) {
  const { state, dispatch } = useAppState();
  const [isManaging, setIsManaging] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('stunt');

  function selectProfile(profile: any) {
    if (isManaging) return;
    dispatch({ type: 'SET_ACTIVE_PROFILE', payload: profile });
    navigation.replace('MainTabs');
  }

  function addProfile() {
    if (!newName.trim()) return;
    if (state.profiles.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 profiles per account');
      return;
    }
    const newProfile = {
      id: 'profile-' + Date.now(),
      userId: state.currentUser?.id || '',
      name: newName.trim(),
      avatarKey: newAvatar,
      experienceLevel: 'fan' as const,
      onboardingComplete: true,
      interests: [],
    };
    dispatch({ type: 'ADD_PROFILE', payload: newProfile });
    setShowAddModal(false);
    setNewName('');
  }

  function deleteProfile(profileId: string) {
    if (state.profiles.length <= 1) {
      Alert.alert('Error', 'You must have at least one profile');
      return;
    }
    Alert.alert('Delete Profile', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_PROFILE', payload: profileId }) },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who's watching?</Text>

      <View style={styles.grid}>
        {state.profiles.map(profile => {
          const avatar = avatarMap.get(profile.avatarKey);
          return (
            <TouchableOpacity
              key={profile.id}
              style={styles.profileCard}
              onPress={() => selectProfile(profile)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatarCircle, { borderColor: avatar?.color || Colors.primary }]}>
                <Text style={styles.avatarEmoji}>{avatar?.emoji || '🎬'}</Text>
                {isManaging && (
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deleteProfile(profile.id)}>
                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.profileName}>{profile.name}</Text>
            </TouchableOpacity>
          );
        })}

        {state.profiles.length < 5 && (
          <TouchableOpacity style={styles.profileCard} onPress={() => setShowAddModal(true)}>
            <View style={styles.addCircle}>
              <Ionicons name="add" size={40} color={Colors.textTertiary} />
            </View>
            <Text style={styles.profileName}>Add Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.manageButton} onPress={() => setIsManaging(!isManaging)}>
        <Text style={styles.manageText}>{isManaging ? 'Done' : 'Manage Profiles'}</Text>
      </TouchableOpacity>

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Profile</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name"
              placeholderTextColor={Colors.inputPlaceholder}
              value={newName}
              onChangeText={setNewName}
            />
            <View style={styles.modalAvatars}>
              {avatarOptions.slice(0, 6).map(a => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.modalAvatar, newAvatar === a.key && styles.modalAvatarSelected]}
                  onPress={() => setNewAvatar(a.key)}
                >
                  <Text style={{ fontSize: 24 }}>{a.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={addProfile}>
                <Text style={styles.submitText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.section,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xxl,
  },
  profileCard: {
    alignItems: 'center',
    width: 100,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  profileName: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  manageButton: {
    marginTop: Spacing.section,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  manageText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: '80%',
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.lg,
    height: 48,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    marginBottom: Spacing.lg,
  },
  modalAvatars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  modalAvatar: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  modalAvatarSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textTertiary,
    fontSize: FontSize.lg,
  },
  modalSubmit: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  submitText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
});
