import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { usePetStore } from '@/lib/stores/petStore';
import { ONBOARDING_KEY } from '../_layout';

export default function NamePetScreen() {
  const [name, setName] = useState('');
  const router = useRouter();
  const createPet = usePetStore((s) => s.createPet);

  const handleSubmit = async () => {
    const petName = name.trim() || 'Stompi';
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createPet(petName);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/pets/endurance-wolf/wolf-pup-celebrating.png')}
            style={styles.wolfImage}
            contentFit="contain"
          />
        </View>

        <Text style={styles.title}>Name your wolf</Text>
        <Text style={styles.subtitle}>
          This Endurance Wolf pup will be your running companion
        </Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Stompi, Luna, Bolt..."
          placeholderTextColor={colors.textMuted}
          maxLength={20}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            !name.trim() && styles.buttonMuted,
          ]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>
            {name.trim() ? `Let's go, ${name.trim()}!` : "Let's Go!"}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
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
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  wolfImage: { width: 180, height: 180 },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
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
  buttonMuted: { opacity: 0.7 },
  buttonText: {
    ...typography.h3,
    color: colors.text,
  },
});
