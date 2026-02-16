import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { initHealthKit } from '@/lib/health/sync';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await initHealthKit();
    router.push('/onboarding/name-pet');
  };

  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/pets/endurance-wolf/wolf-pup.png')}
            style={styles.wolfImage}
            contentFit="contain"
          />
        </View>

        <Text style={styles.title}>RunPets</Text>
        <Text style={styles.subtitle}>Your running brings them to life</Text>
        <Text style={styles.description}>
          A virtual pet that evolves with every mile you run.{'\n'}
          Your miles make them grow. Your PRs trigger transformations.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>

        <Text style={styles.healthNote}>
          We'll ask for HealthKit access to track your runs
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  imageContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(79, 143, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  wolfImage: {
    width: 200,
    height: 200,
  },
  title: {
    ...typography.h1,
    fontSize: 36,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.h3,
    color: colors.accent,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.accentLight,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    ...typography.h3,
    color: colors.text,
  },
  healthNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
