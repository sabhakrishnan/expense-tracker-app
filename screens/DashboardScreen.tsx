import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../src/theme';

const { width: screenWidth } = Dimensions.get('window');

// Currency formatter for INR
const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

interface BudgetGaugeProps {
  category: string;
  spent: number;
  budget: number;
  icon: keyof typeof Ionicons.glyphMap;
}

// CSS-based circular progress (works on web)
const BudgetGauge = ({ category, spent, budget, icon }: BudgetGaugeProps) => {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = spent > budget;

  const getColor = () => {
    if (isOverBudget) return Colors.danger;
    if (percentage >= 80) return Colors.warning;
    return Colors.success;
  };

  return (
    <View style={styles.gaugeCard}>
      <View style={styles.gaugeIconContainer}>
        <Ionicons name={icon} size={20} color={getColor()} />
      </View>
      <View style={styles.circularProgress}>
        <View style={[styles.circularBg, { borderColor: Colors.borderLight }]}>
          <View 
            style={[
              styles.circularFill, 
              { 
                borderColor: getColor(),
                transform: [{ rotate: `${(percentage / 100) * 360}deg` }],
              }
            ]} 
          />
          <View style={styles.circularInner}>
            <Text style={styles.percentText}>{Math.round(percentage)}%</Text>
          </View>
        </View>
      </View>
      <Text style={styles.gaugeCategory}>{category}</Text>
      <Text style={[styles.gaugeAmount, isOverBudget && styles.overBudget]}>
        {formatCurrency(spent)}
      </Text>
    </View>
  );
};

interface StatCardProps {
  title: string;
  amount: number;
  icon: keyof typeof Ionicons.glyphMap;
  trend?: number;
  gradient: readonly [string, string, ...string[]];
}

const StatCard = ({ title, amount, icon, trend, gradient }: StatCardProps) => (
  <LinearGradient
    colors={gradient}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.statCard}
  >
    <View style={styles.statIconContainer}>
      <Ionicons name={icon} size={24} color="rgba(255,255,255,0.9)" />
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statAmount}>{formatCurrency(amount)}</Text>
    {trend !== undefined && (
      <View style={styles.trendContainer}>
        <Ionicons 
          name={trend >= 0 ? 'trending-up' : 'trending-down'} 
          size={14} 
          color="rgba(255,255,255,0.8)" 
        />
        <Text style={styles.trendText}>
          {trend >= 0 ? '+' : ''}{trend}% this month
        </Text>
      </View>
    )}
  </LinearGradient>
);

// Simple bar component for charts
interface SimpleBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

const SimpleBar = ({ label, value, maxValue, color }: SimpleBarProps) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View style={styles.barContainer}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{formatCurrency(value)}</Text>
    </View>
  );
};

interface TopCategoryProps {
  item: { name: string; spent: number; icon: keyof typeof Ionicons.glyphMap };
  index: number;
  total: number;
}

const TopSpendingCategory = ({ item, index, total }: TopCategoryProps) => {
  const percentage = total > 0 ? (item.spent / total) * 100 : 0;
  
  return (
    <View style={styles.topCategoryItem}>
      <View style={[styles.categoryRankBadge, index === 0 && styles.rankFirst]}>
        <Text style={[styles.categoryRank, index === 0 && styles.rankFirstText]}>
          {index + 1}
        </Text>
      </View>
      <View style={styles.categoryIconSmall}>
        <Ionicons name={item.icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${percentage}%` }]} />
        </View>
      </View>
      <Text style={styles.categoryAmount}>{formatCurrency(item.spent)}</Text>
    </View>
  );
};

const DashboardScreen = () => {
  const navigation = useNavigation();
  
  // Mock data with realistic INR values
  const totalExpenses = 45250;
  const totalIncome = 85000;
  const savings = totalIncome - totalExpenses;
  
  const categories = [
    { name: 'Food', spent: 12500, budget: 15000, icon: 'restaurant-outline' as const },
    { name: 'Transport', spent: 8200, budget: 10000, icon: 'car-outline' as const },
    { name: 'Rent', spent: 18000, budget: 18000, icon: 'home-outline' as const },
    { name: 'Shopping', spent: 6550, budget: 8000, icon: 'bag-outline' as const },
    { name: 'Bills', spent: 4500, budget: 5000, icon: 'flash-outline' as const },
  ];

  const weeklyData = [
    { label: 'Mon', value: 2800 },
    { label: 'Tue', value: 1500 },
    { label: 'Wed', value: 3200 },
    { label: 'Thu', value: 2100 },
    { label: 'Fri', value: 4500 },
    { label: 'Sat', value: 6200 },
    { label: 'Sun', value: 3800 },
  ];

  const maxWeekly = Math.max(...weeklyData.map(d => d.value));

  const topSpendingCategories = [...categories]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 4);

  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={Colors.gradientPrimary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Good Morning! 👋</Text>
              <Text style={styles.headerTitle}>Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
          
          {/* Main Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(savings)}</Text>
            <View style={styles.balanceStats}>
              <View style={styles.balanceStat}>
                <Ionicons name="arrow-down-circle" size={18} color={Colors.success} />
                <Text style={styles.balanceStatText}>Income: {formatCurrency(totalIncome)}</Text>
              </View>
              <View style={styles.balanceStat}>
                <Ionicons name="arrow-up-circle" size={18} color={Colors.danger} />
                <Text style={styles.balanceStatText}>Expenses: {formatCurrency(totalExpenses)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <StatCard
              title="This Month"
              amount={totalExpenses}
              icon="wallet-outline"
              trend={-12}
              gradient={['#EF4444', '#F97316'] as const}
            />
            <StatCard
              title="Savings"
              amount={savings}
              icon="trending-up-outline"
              trend={8}
              gradient={['#22C55E', '#10B981'] as const}
            />
          </View>

          {/* Budget Status */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Status</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gaugeList}
          >
            {categories.map((cat) => (
              <BudgetGauge 
                key={cat.name}
                category={cat.name} 
                spent={cat.spent} 
                budget={cat.budget}
                icon={cat.icon}
              />
            ))}
          </ScrollView>

          {/* Spending Trend - Simple Bar Chart */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Spending Trend</Text>
                <Text style={styles.cardSubtitle}>Last 7 days</Text>
              </View>
            </View>
            <View style={styles.simpleChart}>
              {weeklyData.map((day, index) => (
                <View key={day.label} style={styles.chartBarWrapper}>
                  <View style={styles.chartBarContainer}>
                    <View 
                      style={[
                        styles.chartBar, 
                        { 
                          height: `${(day.value / maxWeekly) * 100}%`,
                          backgroundColor: index === 5 ? Colors.primary : Colors.primaryLight,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.chartBarLabel}>{day.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Top Spending Categories */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Top Categories</Text>
                <Text style={styles.cardSubtitle}>Where your money goes</Text>
              </View>
            </View>
            {topSpendingCategories.map((item, index) => (
              <TopSpendingCategory 
                key={item.name} 
                item={item} 
                index={index}
                total={totalSpent}
              />
            ))}
          </View>

          {/* Monthly Overview */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Monthly Overview</Text>
                <Text style={styles.cardSubtitle}>Income vs Expenses</Text>
              </View>
            </View>
            <SimpleBar label="Income" value={totalIncome} maxValue={totalIncome} color={Colors.success} />
            <SimpleBar label="Expenses" value={totalExpenses} maxValue={totalIncome} color={Colors.danger} />
            <SimpleBar label="Savings" value={savings} maxValue={totalIncome} color={Colors.primary} />
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Add' as never)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={Colors.gradientPrimary as [string, string]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color={Colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 100,
    paddingHorizontal: Spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.white,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  balanceLabel: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  balanceStatText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    marginTop: -60,
    paddingHorizontal: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statTitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  statAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    marginTop: Spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  trendText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  seeAllText: {
    ...Typography.label,
    color: Colors.primary,
  },
  gaugeList: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  gaugeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    width: 120,
    ...Shadows.sm,
  },
  gaugeIconContainer: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  circularProgress: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularFill: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 6,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  circularInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  gaugeCategory: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  gaugeAmount: {
    ...Typography.label,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  overBudget: {
    color: Colors.danger,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  simpleChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: Spacing.md,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarContainer: {
    width: 24,
    height: 120,
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderRadius: 12,
  },
  chartBarLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  barLabel: {
    width: 70,
    ...Typography.label,
    color: Colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.borderLight,
    borderRadius: 6,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barValue: {
    width: 80,
    ...Typography.label,
    color: Colors.text,
    textAlign: 'right',
  },
  topCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoryRankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  rankFirst: {
    backgroundColor: Colors.warning,
  },
  categoryRank: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  rankFirstText: {
    color: Colors.white,
  },
  categoryIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  categoryAmount: {
    ...Typography.label,
    color: Colors.text,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    ...Shadows.lg,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DashboardScreen;
