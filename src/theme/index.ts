/**
 * Modern Theme Configuration
 * 
 * A contemporary design system with:
 * - Soft gradients and glass-morphism effects
 * - Modern color palette with accessibility in mind
 * - Consistent spacing and typography
 */

export const Colors = {
  // Primary palette - Modern blue
  primary: '#6366F1',      // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  
  // Secondary palette - Teal accent
  secondary: '#14B8A6',    // Teal
  secondaryLight: '#5EEAD4',
  secondaryDark: '#0D9488',
  
  // Semantic colors
  success: '#22C55E',
  successLight: '#86EFAC',
  warning: '#F59E0B',
  warningLight: '#FCD34D',
  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  info: '#3B82F6',
  infoLight: '#93C5FD',
  
  // Neutrals
  white: '#FFFFFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Text colors
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  
  // Gradients (for use with LinearGradient)
  gradientPrimary: ['#6366F1', '#8B5CF6'],
  gradientSecondary: ['#14B8A6', '#06B6D4'],
  gradientSuccess: ['#22C55E', '#10B981'],
  gradientDanger: ['#EF4444', '#F97316'],
  gradientDark: ['#1E293B', '#334155'],
  gradientCard: ['#FFFFFF', '#F8FAFC'],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Typography = {
  // Font sizes
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Modern icon mapping (using Ionicons with modern variants)
export const Icons = {
  // Navigation
  dashboard: 'grid-outline',
  dashboardActive: 'grid',
  transactions: 'receipt-outline',
  transactionsActive: 'receipt',
  add: 'add-circle-outline',
  addActive: 'add-circle',
  partner: 'people-outline',
  partnerActive: 'people',
  settings: 'settings-outline',
  settingsActive: 'settings',
  
  // Actions
  share: 'share-outline',
  sync: 'sync-outline',
  link: 'link-outline',
  unlink: 'unlink-outline',
  check: 'checkmark-circle',
  close: 'close-circle',
  chevronRight: 'chevron-forward',
  chevronDown: 'chevron-down',
  
  // Finance
  wallet: 'wallet-outline',
  card: 'card-outline',
  cash: 'cash-outline',
  trending: 'trending-up-outline',
  trendingDown: 'trending-down-outline',
  
  // Categories
  food: 'restaurant-outline',
  transport: 'car-outline',
  shopping: 'bag-outline',
  entertainment: 'game-controller-outline',
  health: 'fitness-outline',
  bills: 'flash-outline',
  
  // General
  email: 'mail-outline',
  person: 'person-outline',
  search: 'search-outline',
  filter: 'funnel-outline',
  calendar: 'calendar-outline',
  info: 'information-circle-outline',
  warning: 'warning-outline',
  success: 'checkmark-circle-outline',
};

export default {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  Icons,
};
