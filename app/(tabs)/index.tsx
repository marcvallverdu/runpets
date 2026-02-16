import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { usePetStore } from '@/lib/stores/petStore';
import { useRunStore } from '@/lib/stores/runStore';
import { PET_IMAGES, type PetImageMood } from '@/lib/pets/images';
import { formatDistance, formatPace, formatDuration } from '@/lib/utils/format';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    pet, level, mood, stageName, imagePrefix, progress, remaining, nextThreshold, totalKm, loadPet, checkEvolution,
  } = usePetStore();

  const {
    runs, todayRuns, weeklyDistance, totalDistance, currentStreak, isSyncing, loadRuns, sync,
  } = useRunStore();

  useEffect(() => {
    loadPet();
    loadRuns();
    // Auto-sync on mount (use mock data for dev)
    sync('auto').then(() => {
      loadPet();
      loadRuns();
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    await sync('auto');
    loadPet();
    loadRuns();
    const evolved = checkEvolution();
    if (evolved) {
      router.push('/celebration');
    }
  }, [sync, loadPet, loadRuns, checkEvolution, router]);

  const todayDistance = todayRuns.reduce((s, r) => s + r.distance_meters, 0);
  const todayPace = todayRuns.length > 0
    ? todayRuns.reduce((s, r) => s + (r.pace_seconds_per_km || 0), 0) / todayRuns.length
    : null;
  const todayDuration = todayRuns.reduce((s, r) => s + r.duration_seconds, 0);

  // Get the correct image for stage + mood
  const moodKey: PetImageMood = mood === 'celebrating' ? 'celebrating'
    : mood === 'sleeping' ? 'sleeping'
      : mood === 'waiting' ? 'waiting'
        : 'idle';

  const imageMap = PET_IMAGES[imagePrefix as keyof typeof PET_IMAGES];
  const petImage = imageMap ? imageMap[moodKey] : PET_IMAGES['wolf-pup'].idle;

  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={isSyncing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Streak */}
        <View style={styles.streakRow}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>{currentStreak} day streak</Text>
        </View>

        {/* Pet */}
        <Pressable style={styles.petContainer}>
          <View style={styles.petGlow} />
          <Image source={petImage} style={styles.petImage} contentFit="contain" />
        </Pressable>

        <Text style={styles.petName}>{pet?.name || 'Your Wolf'}</Text>
        <Text style={styles.petLevel}>Level {level} • {stageName}</Text>

        {/* XP Progress */}
        {level < 3 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {remaining.toFixed(1)} km to evolve • {Math.round(progress * 100)}%
            </Text>
          </View>
        )}
        {level >= 3 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.progressText}>✨ Fully evolved! ✨</Text>
          </View>
        )}

        {/* Today's Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today</Text>
          {todayRuns.length > 0 ? (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDistance(todayDistance)}</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatPace(todayPace)}</Text>
                <Text style={styles.statLabel}>Avg Pace</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDuration(todayDuration)}</Text>
                <Text style={styles.statLabel}>Time</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No runs today yet. Get out there! 🐺</Text>
          )}
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryRow}>
          <View style={[styles.card, styles.summaryCard]}>
            <Text style={styles.summaryValue}>{formatDistance(weeklyDistance)}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={[styles.card, styles.summaryCard]}>
            <Text style={styles.summaryValue}>{formatDistance(totalDistance)}</Text>
            <Text style={styles.statLabel}>Lifetime</Text>
          </View>
        </View>

        {/* Total km counter */}
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalKm.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Total km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{runs.length}</Text>
              <Text style={styles.statLabel}>Runs</Text>
            </View>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  streakIcon: { fontSize: 22, marginRight: spacing.xs },
  streakText: {
    ...typography.h3,
    color: colors.streak,
  },
  petContainer: {
    alignSelf: 'center',
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  petGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(79, 143, 255, 0.06)',
  },
  petImage: { width: 260, height: 260 },
  petName: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
  },
  petLevel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBg: {
    height: 8,
    backgroundColor: colors.xpBarBg,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.xpBar,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 0.5,
    height: 30,
    backgroundColor: colors.cardBorder,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.h2,
    color: colors.accent,
    marginBottom: 2,
  },
});
