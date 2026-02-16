import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { useRunStore } from '@/lib/stores/runStore';
import { usePetStore } from '@/lib/stores/petStore';
import { formatDistance } from '@/lib/utils/format';

function SettingsRow({ icon, label, value, onPress }: {
  icon: string; label: string; value?: string; onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <FontAwesome name={icon as never} size={16} color={colors.accent} style={styles.rowIcon} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { totalDistance, runs, currentStreak, longestStreak } = useRunStore();
  const { pet, level, totalKm } = usePetStore();

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete your pet and all run history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            // In a real app we'd clear SQLite + AsyncStorage
            Alert.alert('Not implemented yet', 'Coming in a future update!');
          },
        },
      ],
    );
  };

  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Settings</Text>

        {/* Pet Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>YOUR PET</Text>
          <SettingsRow icon="paw" label="Name" value={pet?.name || 'Stompi'} />
          <SettingsRow icon="star" label="Level" value={`${level} — ${usePetStore.getState().stageName}`} />
          <SettingsRow icon="road" label="Total Distance" value={`${totalKm.toFixed(1)} km`} />
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>STATS</Text>
          <SettingsRow icon="bar-chart" label="Total Runs" value={String(runs.length)} />
          <SettingsRow icon="road" label="Lifetime Distance" value={formatDistance(totalDistance)} />
          <SettingsRow icon="fire" label="Current Streak" value={`${currentStreak} days`} />
          <SettingsRow icon="trophy" label="Best Streak" value={`${longestStreak} days`} />
        </View>

        {/* App */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>APP</Text>
          <SettingsRow icon="heart" label="Rate RunPets" onPress={() => {}} />
          <SettingsRow icon="envelope" label="Contact Support" onPress={() => {}} />
          <SettingsRow icon="info-circle" label="Version" value="1.0.0" />
        </View>

        {/* Danger Zone */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.danger }]}>DANGER ZONE</Text>
          <Pressable style={styles.dangerRow} onPress={handleResetData}>
            <FontAwesome name="trash" size={16} color={colors.danger} style={styles.rowIcon} />
            <Text style={styles.dangerText}>Reset All Data</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>RunPets v1.0.0 • Made with 🐺 and ☕</Text>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.cardBorder,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIcon: { width: 24, marginRight: spacing.md },
  rowLabel: { ...typography.body, color: colors.text },
  rowValue: { ...typography.bodySmall, color: colors.textSecondary, marginRight: spacing.sm },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dangerText: { ...typography.body, color: colors.danger },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
