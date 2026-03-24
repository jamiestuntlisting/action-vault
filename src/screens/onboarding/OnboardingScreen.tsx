import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, FontWeight, BorderRadius } from '../../theme';
import { useAppState } from '../../services/AppState';
import { skillTags } from '../../data';
import { avatarOptions } from '../../data/avatars';
import { SkillTagChip } from '../../components/SkillTagChip';
import { ExperienceLevel, SkillTag } from '../../types';
import { usePageTitle } from '../../hooks/usePageTitle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = ['welcome', 'skills', 'experience', 'profile'] as const;

export function OnboardingScreen({ navigation }: any) {
  usePageTitle('Welcome');
  const { state, dispatch } = useAppState();
  const [step, setStep] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<SkillTag[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('fan');
  const [profileName, setProfileName] = useState(state.profiles[0]?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState('stunt');

  function toggleSkill(tag: SkillTag) {
    if (selectedSkills.some(s => s.id === tag.id)) {
      setSelectedSkills(selectedSkills.filter(s => s.id !== tag.id));
    } else {
      setSelectedSkills([...selectedSkills, tag]);
    }
  }

  function nextStep() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  }

  function finishOnboarding() {
    const profile = state.profiles[0];
    if (profile) {
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: {
          ...profile,
          name: profileName || profile.name,
          avatarKey: selectedAvatar,
          experienceLevel,
          onboardingComplete: true,
          interests: selectedSkills,
        },
      });
      dispatch({ type: 'SET_ACTIVE_PROFILE', payload: { ...profile, name: profileName || profile.name, avatarKey: selectedAvatar, experienceLevel, onboardingComplete: true, interests: selectedSkills } });
    }
    dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    navigation.replace('MainTabs');
  }

  function renderStep() {
    switch (STEPS[step]) {
      case 'welcome':
        return (
          <View style={styles.stepContent}>
            <Ionicons name="film" size={80} color={Colors.primary} />
            <Text style={styles.welcomeTitle}>Welcome to Action Vault</Text>
            <Text style={styles.welcomeSubtitle}>The best behind-the-scenes stunt content, all in one place.</Text>
            <Text style={styles.welcomeDescription}>
              Browse, study, and learn the craft of stunts with curated videos, courses, and stunt-specific tools.
            </Text>
          </View>
        );

      case 'skills':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What are you into?</Text>
            <Text style={styles.stepSubtitle}>Select 3 or more stunt types you're interested in</Text>
            <View style={styles.skillGrid}>
              {skillTags.filter(t => !['bts-featurette', 'interview'].includes(t.id)).map(tag => (
                <SkillTagChip
                  key={tag.id}
                  tag={tag}
                  selected={selectedSkills.some(s => s.id === tag.id)}
                  onPress={() => toggleSkill(tag)}
                  size="medium"
                />
              ))}
            </View>
            <Text style={styles.selectionCount}>{selectedSkills.length} selected</Text>
          </View>
        );

      case 'experience':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What describes you best?</Text>
            <Text style={styles.stepSubtitle}>This helps us personalize your experience</Text>
            {([
              { key: 'professional', icon: 'shield-checkmark', label: "I'm a working professional", desc: 'SAG-AFTRA stunt performer or coordinator' },
              { key: 'training', icon: 'school', label: "I'm training", desc: 'Student or aspiring stunt performer' },
              { key: 'fan', icon: 'heart', label: "I'm a fan", desc: 'Action film enthusiast who loves BTS content' },
            ] as const).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.experienceOption, experienceLevel === opt.key && styles.experienceOptionSelected]}
                onPress={() => setExperienceLevel(opt.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={opt.icon as any} size={28} color={experienceLevel === opt.key ? Colors.primary : Colors.textTertiary} />
                <View style={styles.experienceText}>
                  <Text style={[styles.experienceLabel, experienceLevel === opt.key && styles.experienceLabelSelected]}>{opt.label}</Text>
                  <Text style={styles.experienceDesc}>{opt.desc}</Text>
                </View>
                {experienceLevel === opt.key && <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'profile':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Create your profile</Text>
            <Text style={styles.stepSubtitle}>Choose a name and avatar</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Your name"
              placeholderTextColor={Colors.inputPlaceholder}
              value={profileName}
              onChangeText={setProfileName}
              autoCapitalize="words"
            />
            <Text style={styles.avatarLabel}>Choose your avatar</Text>
            <View style={styles.avatarGrid}>
              {avatarOptions.map(a => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.avatarOption, selectedAvatar === a.key && styles.avatarOptionSelected]}
                  onPress={() => setSelectedAvatar(a.key)}
                >
                  <Text style={styles.avatarEmoji}>{a.emoji}</Text>
                  <Text style={styles.avatarName}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
    }
  }

  const canProceed = step === 0 || step === 2 || step === 3 || (step === 1 && selectedSkills.length >= 3);

  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
        ))}
      </View>

      <FlatList
        data={[1]}
        renderItem={() => renderStep()}
        keyExtractor={() => 'step'}
        contentContainerStyle={styles.scrollContent}
      />

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={nextStep}
          disabled={!canProceed}
          activeOpacity={0.8}
        >
          <Text style={styles.nextText}>{step === STEPS.length - 1 ? "Let's Go!" : 'Next'}</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceHighlight,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xxl,
  },
  stepContent: {
    alignItems: 'center',
  },
  welcomeTitle: {
    color: Colors.white,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.heavy,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  welcomeSubtitle: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  welcomeDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 24,
  },
  stepTitle: {
    color: Colors.white,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  selectionCount: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.lg,
  },
  experienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    width: '100%',
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.lg,
  },
  experienceOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  experienceText: {
    flex: 1,
  },
  experienceLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  experienceLabelSelected: {
    color: Colors.primary,
  },
  experienceDesc: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  nameInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.xl,
    height: 52,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    width: '100%',
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  avatarLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  avatarOption: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: 80,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatarOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  avatarEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  avatarName: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xxl,
    paddingBottom: 40,
  },
  backButton: {
    padding: Spacing.md,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
    gap: Spacing.sm,
    marginLeft: 'auto',
  },
  nextButtonDisabled: {
    backgroundColor: Colors.surfaceHighlight,
    opacity: 0.5,
  },
  nextText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
});
