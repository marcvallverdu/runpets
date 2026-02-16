import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { usePetStore } from '@/lib/stores/petStore';
import { useRunStore } from '@/lib/stores/runStore';
import { PET_IMAGES } from '@/lib/pets/images';
import { formatDistance } from '@/lib/utils/format';

export default function CelebrationScreen() {
  const router = useRouter();
  const { pet, level, stageName, imagePrefix } = usePetStore();
  const { lastSyncResult, totalDistance } = useRunStore();
  const [showEvolution, setShowEvolution] = useState(false);

  const xpProgress = useSharedValue(0);
  const petScale = useSharedValue(0.5);
  const overlayOpacity = useSharedValue(0);

  const evolved = lastSyncResult?.evolved ?? false;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    overlayOpacity.value = withTiming(1, { duration: 300 });
    petScale.value = withSpring(1, { damping: 8, stiffness: 100 });
    xpProgress.value = withTiming(1, { duration: 1500 });

    if (evolved) {
      const timer = setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowEvolution(true);
        petScale.value = withSequence(
          withTiming(1.3, { duration: 300 }),
          withSpring(1, { damping: 8 }),
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const petAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: petScale.value }],
  }));

  const xpBarStyle = useAnimatedStyle(() => ({
    width: `${xpProgress.value * 100}%`,
  }));

  const imageMap = PET_IMAGES[imagePrefix as keyof typeof PET_IMAGES];
  const petImage = imageMap?.celebrating ?? PET_IMAGES['wolf-pup'].celebrating;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <View style={styles.content}>
        {showEvolution ? (
          <>
            <Text style={styles.evolveTitle}>🎉 YOUR PET EVOLVED! 🎉</Text>
            <Animated.View style={petAnimStyle}>
              <Image source={petImage} style={styles.petImage} contentFit="contain" />
            </Animated.View>
            <Text style={styles.evolveName}>{pet?.name} is now a {stageName}!</Text>
            <Text style={styles.evolveLevel}>Level {level}</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>🏃 Run Complete!</Text>
            <Animated.View style={petAnimStyle}>
              <Image source={petImage} style={styles.petImage} contentFit="contain" />
            </Animated.View>
            <Text style={styles.statsText}>
              Total Distance: {formatDistance(totalDistance)}
            </Text>

            <View style={styles.xpContainer}>
              <Text style={styles.xpLabel}>XP Progress</Text>
              <View style={styles.xpBarBg}>
                <Animated.View style={[styles.xpBarFill, xpBarStyle]} />
              </View>
            </View>

            {evolved && (
              <Text style={styles.evolveTeaser}>Something is happening... ✨</Text>
            )}
          </>
        )}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  petImage: {
    width: 220,
    height: 220,
    marginBottom: spacing.lg,
  },
  statsText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  xpContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  xpLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  xpBarBg: {
    height: 12,
    backgroundColor: colors.xpBarBg,
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.xpBar,
    borderRadius: 6,
  },
  evolveTitle: {
    ...typography.h1,
    fontSize: 28,
    color: colors.success,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  evolveName: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  evolveLevel: {
    ...typography.h3,
    color: colors.accent,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  evolveTeaser: {
    ...typography.body,
    color: colors.accent,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonPressed: {
    backgroundColor: colors.accentLight,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    ...typography.h3,
    color: colors.text,
  },
});
