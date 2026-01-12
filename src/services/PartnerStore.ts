import AsyncStorage from '@react-native-async-storage/async-storage';

const PARTNER_SETTINGS_KEY = '@expenses_app:partner_settings';

export interface PartnerSettings {
  /** Whether Partner Mode is enabled */
  enabled: boolean;
  /** Partner's email address */
  partnerEmail: string;
  /** Partner's shared file ID (discovered after they share their file with us) */
  partnerFileId?: string;
  /** When partner mode was enabled */
  enabledAt?: string;
}

const defaultSettings: PartnerSettings = {
  enabled: false,
  partnerEmail: '',
};

/**
 * PartnerStore
 * 
 * Manages Partner Mode settings for expense sharing.
 * Stores partner email and sharing status in AsyncStorage.
 */
export const PartnerStore = {
  /**
   * Get current partner settings
   */
  async getSettings(): Promise<PartnerSettings> {
    try {
      const raw = await AsyncStorage.getItem(PARTNER_SETTINGS_KEY);
      if (!raw) return { ...defaultSettings };
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch (e) {
      console.warn('Failed to read partner settings:', e);
      return { ...defaultSettings };
    }
  },

  /**
   * Save partner settings
   */
  async saveSettings(settings: PartnerSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(PARTNER_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save partner settings:', e);
    }
  },

  /**
   * Enable Partner Mode with the given email
   */
  async enablePartnerMode(partnerEmail: string): Promise<void> {
    const settings: PartnerSettings = {
      enabled: true,
      partnerEmail: partnerEmail.toLowerCase().trim(),
      enabledAt: new Date().toISOString(),
    };
    await PartnerStore.saveSettings(settings);
  },

  /**
   * Disable Partner Mode
   */
  async disablePartnerMode(): Promise<void> {
    await PartnerStore.saveSettings({ ...defaultSettings });
  },

  /**
   * Update the partner's file ID (after discovery)
   */
  async setPartnerFileId(fileId: string): Promise<void> {
    const settings = await PartnerStore.getSettings();
    settings.partnerFileId = fileId;
    await PartnerStore.saveSettings(settings);
  },

  /**
   * Check if Partner Mode is enabled
   */
  async isEnabled(): Promise<boolean> {
    const settings = await PartnerStore.getSettings();
    return settings.enabled && !!settings.partnerEmail;
  },
};

export default PartnerStore;
