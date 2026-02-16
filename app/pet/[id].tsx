import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { usePetStore } from '@/lib/stores/petStore';
import { useRunStore } from '@/lib/stores/runStore';
import { PET_IMAGES } from '@/lib/pets/images';
import { enduranceWolf } from '@/lib/pets/config';
import { formatDistance } from '@/lib/utils/format';

export default function PetDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pet, level, stageName, imagePrefix, progress, remaining, totalKm, xp } = usePetStore();
  const { currentStreak, longestStreak, runs, totalDistance } = useRunStore();

  const imageMap = PET_IMAGES[imagePrefix as keyof typeof PET_IMAGES];
  const petImage = imageMap?.idle ?? PET_IMAGES['wolf-pup'].idle;

  return (
    <LinearGradient colors={[colors.background, colors.backgroundLight]} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.sm }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="chevron-left" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{pet?.name || 'Your Wolf'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Pet Image */}
        <View style={styles.petContainer}>
          <View style={styles.petGlow} />
          <Image source={petImage} style={styles.petImage} contentFit="contain" />
        </View>

        <Text style={styles.petName}>{pet?.name}</Text>
        <Text style={styles.speciesName}>{enduranceWolf.name}</Text>
        <Text style={styles.petLevel}>Level {level} • {stageName}</Text>

        {/* Evolution Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>EVOLUTION PROGRESS</Text>

          {enduranceWolf.stages.map((stage, idx) => {
            const isUnlocked = level >= stage.level;
            const isCurrent = level === stage.level;
            return (
              <View key={stage.level} style={styles.stageRow}>
                <View style={[styles.stageDot, isUnlocked && styles.stageDotActive, isCurrent && styles.stageDotCurrent]} />
                {idx < enduranceWolf.stages.length - 1 && (
                  <View style={[styles.stageLine, isUnlocked && styles.stageLineActive]} />
                )}
                <View style={styles.stageInfo}>
                  <Text style={[styles.stageName, isUnlocked && styles.stageNameActive]}>
                    {stage.name} {isCurrent && '← You are here'}
                  </Text>
                  <Text style={styles.stageReq}>
                    {stage.requirements ? `${stage.requirements.totalKm} km total` : 'Starting stage'}
                  </Text>
                </View>
              </View>
            );
          })}

          {level < 3 && (
            <View style={styles.progressSection}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {remaining.toFixed(1)} km remaining • {Math.round(progress * 100)}%
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>STATS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridValue}>{runs.length}</Text>
              <Text style={styles.gridLabel}>Total Runs</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridValue}>{totalKm.toFixed(1)}</Text>
              <Text style={styles.gridLabel}>Total km</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridValue}>{currentStreak}</Text>
              <Text style={styles.gridLabel}>Current Streak</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridValue}>{longestStreak}</Text>
              <Text style={styles.gridLabel}>Best Streak</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridValue}>{xp}</Text>
              <Text style={styles.gridLabel}>Total XP</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridValue}>{formatDistance(totalDistance)}</Text>
              <Text style={styles.gridLabel}>Lifetime</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ABOUT {enduranceWolf.name.toUpperCase()}</Text>
          <Text style={styles.description}>{enduranceWolf.description}</Text>
          <Text style={styles.description}>
            Archetype: {enduranceWolf.archetype} • Rewards distance over speed
          </Text>
        </View>

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  petContainer: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  petGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(79, 143, 255, 0.08)',
  },
  petImage: { width: 200, height: 200 },
  petName: { ...typography.h1, color: colors.text, textAlign: 'center' },
  speciesName: { ...typography.bodySmall, color: colors.accent, textAlign: 'center', marginTop: 2 },
  petLevel: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
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
  stageRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  stageDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.textMuted,
    marginTop: 4, marginRight: spacing.md,
  },
  stageDotActive: { backgroundColor: colors.accent },
  stageDotCurrent: { backgroundColor: colors.success, borderWidth: 2, borderColor: colors.success },
  stageLine: {
    position: 'absolute', left: 5, top: 16, width: 2, height: 24,
    backgroundColor: colors.textMuted,
  },
  stageLineActive: { backgroundColor: colors.accent },
  stageInfo: { flex: 1 },
  stageName: { ...typography.body, color: colors.textMuted },
  stageNameActive: { color: colors.text, fontWeight: '600' },
  stageReq: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  progressSection: { marginTop: spacing.md },
  progressBg: { height: 8, backgroundColor: colors.xpBarBg, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.xs },
  progressFill: { height: '100%', backgroundColor: colors.xpBar, borderRadius: 4 },
  progressText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '33%', alignItems: 'center', paddingVertical: spacing.sm },
  gridValue: { ...typography.h2, color: colors.text },
  gridLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  description: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.sm },
});
