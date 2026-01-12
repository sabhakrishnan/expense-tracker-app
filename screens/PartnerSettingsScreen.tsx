import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PartnerStore, PartnerSettings } from '../src/services/PartnerStore';
import GoogleDriveService from '../src/services/GoogleDriveService';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../src/theme';

const { width } = Dimensions.get('window');

interface PartnerSettingsScreenProps {
  accessToken: string;
  userEmail: string;
}

const PartnerSettingsScreen: React.FC<PartnerSettingsScreenProps> = ({ 
  accessToken, 
  userEmail 
}) => {
  const [settings, setSettings] = useState<PartnerSettings>({
    enabled: false,
    partnerEmail: '',
  });
  const [partnerEmailInput, setPartnerEmailInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const saved = await PartnerStore.getSettings();
      setSettings(saved);
      setPartnerEmailInput(saved.partnerEmail || '');
    } catch (error) {
      console.warn('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEnablePartnerMode = async () => {
    const email = partnerEmailInput.trim().toLowerCase();
    
    if (!email) {
      Alert.alert('Error', 'Please enter your partner\'s email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (email === userEmail.toLowerCase()) {
      Alert.alert('Error', 'You cannot partner with yourself');
      return;
    }

    setSharing(true);
    try {
      const result = await GoogleDriveService.shareWithPartner(accessToken, email);
      
      if (!result.success) {
        Alert.alert('Sharing Failed', result.error || 'Could not share transactions with your partner.');
        setSharing(false);
        return;
      }

      await PartnerStore.enablePartnerMode(email);
      await GoogleDriveService.updateSharedFile(accessToken, userEmail);
      await loadSettings();

      Alert.alert(
        'Partner Mode Enabled! 🎉',
        `Your transactions are now shared with ${email}.\n\nAsk your partner to open the app and click "Link Only" with your email.`,
        [{ text: 'Got it!' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleLinkToPartner = async () => {
    const email = partnerEmailInput.trim().toLowerCase();
    
    if (!email || !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLinking(true);
    try {
      const partnerFileId = await GoogleDriveService.findPartnerSharedFile(accessToken, email);
      
      if (!partnerFileId) {
        Alert.alert(
          'Partner Not Found',
          `Could not find a shared file from ${email}. Make sure your partner has shared their transactions with you first.`
        );
        setLinking(false);
        return;
      }

      await PartnerStore.enablePartnerMode(email);
      await PartnerStore.setPartnerFileId(partnerFileId);
      await loadSettings();

      Alert.alert(
        'Linked to Partner! 🎉',
        `You can now see ${email}'s transactions.`,
        [{ text: 'Got it!' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  const handleShareMyTransactions = async () => {
    if (!settings.partnerEmail) return;

    setSharing(true);
    try {
      const result = await GoogleDriveService.shareWithPartner(accessToken, settings.partnerEmail);
      
      if (!result.success) {
        Alert.alert('Sharing Failed', result.error || 'Could not share your transactions.');
        setSharing(false);
        return;
      }

      await GoogleDriveService.updateSharedFile(accessToken, userEmail);
      Alert.alert('Sharing Enabled! 🎉', `Your transactions are now shared with ${settings.partnerEmail}.`);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setSharing(false);
    }
  };

  const handleDisablePartnerMode = async () => {
    Alert.alert(
      'Disable Partner Mode?',
      'Your transactions will no longer be shared.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            await PartnerStore.disablePartnerMode();
            setPartnerEmailInput('');
            await loadSettings();
          },
        },
      ]
    );
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const transactions = await GoogleDriveService.syncWithPartner(accessToken, userEmail);
      Alert.alert('Sync Complete', `Found ${transactions.length} total transactions`);
    } catch (error) {
      Alert.alert('Sync Failed', 'Could not sync with partner.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradientPrimary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerIconContainer}>
          <Ionicons name="people" size={40} color={Colors.white} />
        </View>
        <Text style={styles.headerTitle}>Partner Mode</Text>
        <Text style={styles.headerSubtitle}>
          Share expenses with your partner
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Status Card */}
        <View style={[styles.card, settings.enabled && styles.cardActive]}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIconContainer}>
              <Ionicons 
                name={settings.enabled ? 'checkmark-circle' : 'ellipse-outline'} 
                size={24} 
                color={settings.enabled ? Colors.success : Colors.textTertiary} 
              />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[styles.statusValue, settings.enabled && styles.statusValueActive]}>
                {settings.enabled ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
          </View>

          {settings.enabled && settings.partnerEmail && (
            <View style={styles.partnerInfoRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.partnerEmail}>{settings.partnerEmail}</Text>
            </View>
          )}
        </View>

        {/* Setup or Actions */}
        {!settings.enabled ? (
          <>
            {/* Email Input Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Connect with Partner</Text>
              
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={partnerEmailInput}
                  onChangeText={setPartnerEmailInput}
                  placeholder="partner@example.com"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleEnablePartnerMode}
                disabled={sharing || linking}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradientPrimary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {sharing ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="share-outline" size={20} color={Colors.white} />
                      <Text style={styles.buttonText}>Share & Connect</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleLinkToPartner}
                disabled={sharing || linking}
                activeOpacity={0.8}
              >
                {linking ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <>
                    <Ionicons name="link-outline" size={20} color={Colors.primary} />
                    <Text style={styles.buttonTextSecondary}>Link to Partner's Shared File</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Instructions Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>How it works</Text>
              
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  <Text style={styles.bold}>Person A</Text> enters partner's email and taps "Share & Connect"
                </Text>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  <Text style={styles.bold}>Person B</Text> enters Person A's email and taps "Link to Partner's Shared File"
                </Text>
              </View>

              <View style={styles.step}>
                <View style={[styles.stepNumber, styles.stepNumberSuccess]}>
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                </View>
                <Text style={styles.stepText}>
                  Both see a unified expense timeline!
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Actions Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quick Actions</Text>

              <TouchableOpacity
                style={[styles.actionRow]}
                onPress={handleSyncNow}
                disabled={syncing}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.successLight + '30' }]}>
                  <Ionicons name="sync-outline" size={22} color={Colors.success} />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Sync Now</Text>
                  <Text style={styles.actionSubtitle}>Fetch latest partner transactions</Text>
                </View>
                {syncing ? (
                  <ActivityIndicator color={Colors.success} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleShareMyTransactions}
                disabled={sharing}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight + '30' }]}>
                  <Ionicons name="share-outline" size={22} color={Colors.primary} />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Share My Transactions</Text>
                  <Text style={styles.actionSubtitle}>Update shared file for partner</Text>
                </View>
                {sharing ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleDisablePartnerMode}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: Colors.dangerLight + '30' }]}>
                  <Ionicons name="person-remove-outline" size={22} color={Colors.danger} />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={[styles.actionTitle, { color: Colors.danger }]}>Disconnect</Text>
                  <Text style={styles.actionSubtitle}>Stop sharing with partner</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Account Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Account</Text>
          <View style={styles.accountRow}>
            <View style={styles.accountIcon}>
              <Ionicons name="person-circle-outline" size={40} color={Colors.primary} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountEmail}>{userEmail}</Text>
              <Text style={styles.accountHint}>Share this email with your partner</Text>
            </View>
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipContainer}>
          <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
          <Text style={styles.tipText}>
            Each person's transactions are tagged so you can see who spent what
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    ...Typography.body,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: Spacing.lg,
    marginTop: -20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: Colors.success,
  },
  cardTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    marginRight: Spacing.md,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    ...Typography.h4,
    color: Colors.textSecondary,
  },
  statusValueActive: {
    color: Colors.success,
  },
  partnerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  partnerEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.lg,
    ...Typography.body,
    color: Colors.text,
  },
  button: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  buttonPrimary: {
    marginBottom: Spacing.sm,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  buttonText: {
    ...Typography.label,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: Colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  buttonTextSecondary: {
    ...Typography.label,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginHorizontal: Spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepNumberSuccess: {
    backgroundColor: Colors.success,
  },
  stepNumberText: {
    ...Typography.label,
    color: Colors.white,
  },
  stepText: {
    flex: 1,
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '600',
    color: Colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    ...Typography.label,
    color: Colors.text,
  },
  actionSubtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    marginRight: Spacing.md,
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    ...Typography.label,
    color: Colors.text,
  },
  accountHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xxxl,
  },
  tipText: {
    flex: 1,
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
});

export default PartnerSettingsScreen;
