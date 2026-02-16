import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { useRunStore } from '@/lib/stores/runStore';
import { type RunRow } from '@/lib/storage/db';
import { formatDistance, formatPace, formatDuration, formatDate } from '@/lib/utils/format';

function RunItem({ run }: { run: RunRow }) {
  return (
    <View style={styles.runCard}>
      <View style={styles.runHeader}>
        <Text style={styles.runDate}>{formatDate(run.start_time)}</Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{run.xp_awarded} XP</Text>
        </View>
      </View>
      <View style={styles.runStats}>
        <View style={styles.runStat}>
          <Text style={styles.runStatValue}>{formatDistance(run.distance_meters)}</Text>
          <Text style={styles.runStatLabel}>Distance</Text>
        </View>
        <View style={styles.runStat}>
          <Text style={styles.runStatValue}>{formatPace(run.pace_seconds_per_km)}</Text>
          <Text style={styles.runStatLabel}>Pace</Text>
        </View>
        <View style={styles.runStat}>
          <Text style={styles.runStatValue}>{formatDuration(run.duration_seconds)}</Text>
          <Text style={styles.runStatLabel}>Duration</Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { runs, isSyncing, loadRuns, sync } = useRunStore();

  useEffect(() => {
    loadRuns();
  }, []);

  const handleRefresh = useCallback(async () => {
    await sync(true);
    loadRuns();
  }, [sync, loadRuns]);

  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Run History</Text>
        <Text style={styles.subtitle}>{runs.length} runs tracked</Text>
      </View>
      <FlatList
        data={runs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RunItem run={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🐺</Text>
            <Text style={styles.emptyTitle}>No runs yet</Text>
            <Text style={styles.emptyText}>Go for a run and your wolf will be here to celebrate!</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  runCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  runDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  xpBadge: {
    backgroundColor: 'rgba(79, 143, 255, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  xpText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  runStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  runStat: { alignItems: 'center' },
  runStatValue: {
    ...typography.h3,
    color: colors.text,
  },
  runStatLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
