import { Transaction } from '../models/Transaction';
import { TransactionStore } from './TransactionStore';
import { PartnerStore } from './PartnerStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSACTIONS_FILE_NAME = 'transactions.json';
const SHARED_TRANSACTIONS_FILE_NAME = 'expenses_app_shared_transactions.json';
const SHARED_FILE_ID_KEY = '@expenses_app:shared_file_id';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

/**
 * GoogleDriveService
 * 
 * Provides functions to sync transactions with Google Drive App Data folder.
 * Requires a valid OAuth access token with the scope:
 *   https://www.googleapis.com/auth/drive.appdata
 */
export const GoogleDriveService = {
  /**
   * Find the transactions.json file in App Data folder.
   * Returns the file ID if found, or null if not found.
   */
  async findTransactionsFile(accessToken: string): Promise<string | null> {
    try {
      const query = encodeURIComponent(`name='${TRANSACTIONS_FILE_NAME}' and 'appDataFolder' in parents and trashed=false`);
      const response = await fetch(
        `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${query}&fields=files(id,name)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.warn('Failed to search for transactions file:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
      return null;
    } catch (error) {
      console.warn('Error finding transactions file:', error);
      return null;
    }
  },

  /**
   * Create the transactions.json file in App Data folder if it doesn't exist.
   * Returns the file ID.
   */
  async createTransactionsFileIfNotExists(accessToken: string): Promise<string | null> {
    try {
      // Check if file already exists
      const existingFileId = await GoogleDriveService.findTransactionsFile(accessToken);
      if (existingFileId) {
        console.log('Transactions file already exists:', existingFileId);
        return existingFileId;
      }

      // Create new file with empty transactions array
      const metadata = {
        name: TRANSACTIONS_FILE_NAME,
        parents: ['appDataFolder'],
        mimeType: 'application/json',
      };

      const initialContent: Transaction[] = [];

      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append(
        'file',
        new Blob([JSON.stringify(initialContent)], { type: 'application/json' })
      );

      const response = await fetch(
        `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        }
      );

      if (!response.ok) {
        console.warn('Failed to create transactions file:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('Created transactions file:', data.id);
      return data.id;
    } catch (error) {
      console.warn('Error creating transactions file:', error);
      return null;
    }
  },

  /**
   * Fetch all transactions from the Google Drive transactions.json file.
   */
  async fetchAllTransactions(accessToken: string): Promise<Transaction[]> {
    try {
      const fileId = await GoogleDriveService.findTransactionsFile(accessToken);
      if (!fileId) {
        console.log('No transactions file found on Drive');
        return [];
      }

      const response = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.warn('Failed to fetch transactions file:', response.status);
        return [];
      }

      const data = await response.json();
      // Parse dates back to Date objects
      const transactions: Transaction[] = (data || []).map((t: any) => ({
        ...t,
        date: new Date(t.date),
      }));

      return transactions;
    } catch (error) {
      console.warn('Error fetching transactions:', error);
      return [];
    }
  },

  /**
   * Save all transactions to the Google Drive transactions.json file.
   * This overwrites the entire file content.
   */
  async saveAllTransactions(accessToken: string, transactions: Transaction[]): Promise<boolean> {
    try {
      let fileId = await GoogleDriveService.findTransactionsFile(accessToken);
      
      // Create file if it doesn't exist
      if (!fileId) {
        fileId = await GoogleDriveService.createTransactionsFileIfNotExists(accessToken);
        if (!fileId) {
          console.warn('Could not create or find transactions file');
          return false;
        }
      }

      // Update file content
      const response = await fetch(
        `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactions),
        }
      );

      if (!response.ok) {
        console.warn('Failed to save transactions:', response.status);
        return false;
      }

      console.log('Transactions saved to Drive');
      return true;
    } catch (error) {
      console.warn('Error saving transactions:', error);
      return false;
    }
  },

  /**
   * Append a new transaction to the Google Drive file.
   * Fetches current transactions, adds the new one, and saves back.
   */
  async appendTransaction(accessToken: string, transaction: Transaction): Promise<boolean> {
    try {
      const transactions = await GoogleDriveService.fetchAllTransactions(accessToken);
      transactions.unshift(transaction); // Add to beginning (newest first)
      return await GoogleDriveService.saveAllTransactions(accessToken, transactions);
    } catch (error) {
      console.warn('Error appending transaction:', error);
      return false;
    }
  },

  /**
   * Sync local state with Google Drive on app startup.
   * Strategy: Merge remote and local transactions, preferring newest versions.
   * - Fetches remote transactions from Drive
   * - Gets local transactions from AsyncStorage
   * - Merges by ID (remote wins for same ID, adds unique local ones)
   * - Saves merged result to both local and remote
   */
  async syncOnStartup(accessToken: string): Promise<Transaction[]> {
    try {
      // Ensure file exists
      await GoogleDriveService.createTransactionsFileIfNotExists(accessToken);

      // Fetch remote transactions
      const remoteTransactions = await GoogleDriveService.fetchAllTransactions(accessToken);

      // Get local transactions
      const localTransactions = await TransactionStore.getAll();

      // Merge: create a map by ID, remote wins for conflicts
      const mergedMap = new Map<string, Transaction>();

      // Add local first
      for (const tx of localTransactions) {
        mergedMap.set(tx.id, tx);
      }

      // Remote overwrites local (or adds new)
      for (const tx of remoteTransactions) {
        mergedMap.set(tx.id, tx);
      }

      // Convert back to array and sort by date (newest first)
      const mergedTransactions = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Save merged result to both local and remote
      // Save to local
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('@expenses_app:transactions', JSON.stringify(mergedTransactions));

      // Save to remote
      await GoogleDriveService.saveAllTransactions(accessToken, mergedTransactions);

      console.log(`Synced ${mergedTransactions.length} transactions`);
      return mergedTransactions;
    } catch (error) {
      console.warn('Error syncing on startup:', error);
      // Return local transactions as fallback
      return await TransactionStore.getAll();
    }
  },

  // ============================================
  // PARTNER MODE FUNCTIONS
  // ============================================

  /**
   * Get cached shared file ID from local storage
   */
  async getCachedSharedFileId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(SHARED_FILE_ID_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Cache shared file ID to local storage
   */
  async cacheSharedFileId(fileId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(SHARED_FILE_ID_KEY, fileId);
    } catch (e) {
      console.warn('Failed to cache shared file ID:', e);
    }
  },

  /**
   * Verify a file ID is still valid (not deleted)
   */
  async verifyFileExists(accessToken: string, fileId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}?fields=id,trashed`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        return !data.trashed;
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Find or create a shared transactions file in a regular Drive folder.
   * Unlike appDataFolder, regular files can be shared with other users.
   * Uses local caching to avoid search permission issues.
   * Returns the file ID.
   */
  async findOrCreateSharedFile(accessToken: string): Promise<string | null> {
    try {
      console.log('Finding or creating shared file...');
      
      // Step 1: Check if we have a cached file ID
      const cachedId = await GoogleDriveService.getCachedSharedFileId();
      if (cachedId) {
        console.log('Found cached file ID:', cachedId);
        // Verify it still exists
        const exists = await GoogleDriveService.verifyFileExists(accessToken, cachedId);
        if (exists) {
          console.log('Cached file is valid');
          return cachedId;
        }
        console.log('Cached file no longer exists, creating new one');
      }

      // Step 2: Create new shared file (no search needed with drive.file scope)
      console.log('Creating new shared file...');
      const metadata = {
        name: SHARED_TRANSACTIONS_FILE_NAME,
        mimeType: 'application/json',
      };

      const initialContent: Transaction[] = [];

      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append(
        'file',
        new Blob([JSON.stringify(initialContent)], { type: 'application/json' })
      );

      const createResponse = await fetch(
        `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        }
      );

      console.log('Create response status:', createResponse.status);

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.warn('Failed to create shared file:', createResponse.status, errorText);
        return null;
      }

      const createData = await createResponse.json();
      console.log('Created shared file:', createData.id);
      
      // Cache the new file ID
      await GoogleDriveService.cacheSharedFileId(createData.id);
      
      return createData.id;
    } catch (error) {
      console.warn('Error finding/creating shared file:', error);
      return null;
    }
  },

  /**
   * Share the transactions file with a partner via email.
   * Creates a sharable file (not in appDataFolder) and grants reader permission.
   */
  async shareWithPartner(accessToken: string, partnerEmail: string): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      console.log('shareWithPartner called for:', partnerEmail);
      
      // First, ensure we have a shared file
      const fileId = await GoogleDriveService.findOrCreateSharedFile(accessToken);
      console.log('Shared file ID:', fileId);
      
      if (!fileId) {
        return { success: false, error: 'Could not create shared file. Check that the Drive API scope is enabled.' };
      }

      // Copy current transactions to the shared file
      console.log('Fetching transactions to copy to shared file...');
      const transactions = await GoogleDriveService.fetchAllTransactions(accessToken);
      console.log('Found', transactions.length, 'transactions to copy');
      
      const saveResult = await GoogleDriveService.saveToFile(accessToken, fileId, transactions);
      console.log('Save to shared file result:', saveResult);

      // Create permission for partner
      console.log('Creating permission for partner...');
      const permissionResponse = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'user',
            emailAddress: partnerEmail,
          }),
        }
      );

      console.log('Permission response status:', permissionResponse.status);

      if (!permissionResponse.ok) {
        const errorData = await permissionResponse.json().catch(() => ({}));
        console.warn('Failed to share file:', permissionResponse.status, JSON.stringify(errorData));
        return { 
          success: false, 
          error: errorData.error?.message || `Failed to share (${permissionResponse.status})` 
        };
      }

      console.log('Successfully shared file with:', partnerEmail);
      return { success: true, fileId };
    } catch (error) {
      console.warn('Error sharing file:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Save transactions to a specific file ID (for shared file support).
   */
  async saveToFile(accessToken: string, fileId: string, transactions: Transaction[]): Promise<boolean> {
    try {
      const response = await fetch(
        `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactions),
        }
      );

      return response.ok;
    } catch (error) {
      console.warn('Error saving to file:', error);
      return false;
    }
  },

  /**
   * Find files shared with the current user by a specific email.
   * Searches for the partner's shared transactions file.
   */
  async findPartnerSharedFile(accessToken: string, partnerEmail: string): Promise<string | null> {
    try {
      // Search for files shared with me that match the shared transactions filename
      const query = encodeURIComponent(
        `name='${SHARED_TRANSACTIONS_FILE_NAME}' and sharedWithMe=true and trashed=false`
      );
      
      const response = await fetch(
        `${DRIVE_API_BASE}/files?q=${query}&fields=files(id,name,owners)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.warn('Failed to search for partner file:', response.status);
        return null;
      }

      const data = await response.json();
      if (!data.files || data.files.length === 0) {
        console.log('No shared files found from partner');
        return null;
      }

      // Find the file owned by the partner
      for (const file of data.files) {
        if (file.owners) {
          const ownerMatch = file.owners.some(
            (owner: any) => owner.emailAddress?.toLowerCase() === partnerEmail.toLowerCase()
          );
          if (ownerMatch) {
            console.log('Found partner shared file:', file.id);
            return file.id;
          }
        }
      }

      // If no exact match found but files exist, return first one
      if (data.files.length > 0) {
        console.log('Found shared file (unverified owner):', data.files[0].id);
        return data.files[0].id;
      }

      return null;
    } catch (error) {
      console.warn('Error finding partner file:', error);
      return null;
    }
  },

  /**
   * Fetch transactions from a specific file ID.
   */
  async fetchFromFile(accessToken: string, fileId: string): Promise<Transaction[]> {
    try {
      const response = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.warn('Failed to fetch file:', response.status);
        return [];
      }

      const data = await response.json();
      const transactions: Transaction[] = (data || []).map((t: any) => ({
        ...t,
        date: new Date(t.date),
      }));

      return transactions;
    } catch (error) {
      console.warn('Error fetching from file:', error);
      return [];
    }
  },

  /**
   * Fetch partner's transactions if Partner Mode is enabled.
   */
  async fetchPartnerTransactions(accessToken: string): Promise<Transaction[]> {
    try {
      const partnerSettings = await PartnerStore.getSettings();
      if (!partnerSettings.enabled || !partnerSettings.partnerEmail) {
        return [];
      }

      // Try cached file ID first
      let fileId = partnerSettings.partnerFileId || null;
      
      // If no cached ID, discover the file
      if (!fileId) {
        fileId = await GoogleDriveService.findPartnerSharedFile(
          accessToken, 
          partnerSettings.partnerEmail
        );
        
        if (fileId) {
          // Cache the file ID for next time
          await PartnerStore.setPartnerFileId(fileId);
        }
      }

      if (!fileId) {
        console.log('Partner has not shared their file yet');
        return [];
      }

      const transactions = await GoogleDriveService.fetchFromFile(accessToken, fileId);
      
      // Mark transactions with partner's email for identification
      return transactions.map(t => ({
        ...t,
        ownerEmail: t.ownerEmail || partnerSettings.partnerEmail,
      }));
    } catch (error) {
      console.warn('Error fetching partner transactions:', error);
      return [];
    }
  },

  /**
   * Enhanced sync that includes partner transactions when Partner Mode is enabled.
   * Merges own transactions with partner's shared transactions into unified timeline.
   */
  async syncWithPartner(accessToken: string, userEmail: string): Promise<Transaction[]> {
    try {
      // Get own transactions first
      const ownTransactions = await GoogleDriveService.syncOnStartup(accessToken);
      
      // Tag own transactions with user's email
      const taggedOwn = ownTransactions.map(t => ({
        ...t,
        ownerEmail: t.ownerEmail || userEmail,
      }));

      // Check if Partner Mode is enabled
      const partnerSettings = await PartnerStore.getSettings();
      if (!partnerSettings.enabled) {
        return taggedOwn;
      }

      // Fetch partner transactions
      const partnerTransactions = await GoogleDriveService.fetchPartnerTransactions(accessToken);

      // Merge transactions by ID (avoid duplicates)
      const mergedMap = new Map<string, Transaction>();
      
      // Add own transactions
      for (const tx of taggedOwn) {
        mergedMap.set(tx.id, tx);
      }
      
      // Add partner transactions (won't overwrite own if same ID)
      for (const tx of partnerTransactions) {
        if (!mergedMap.has(tx.id)) {
          mergedMap.set(tx.id, tx);
        }
      }

      // Sort by date (newest first)
      const merged = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      console.log(`Synced ${taggedOwn.length} own + ${partnerTransactions.length} partner = ${merged.length} total transactions`);
      return merged;
    } catch (error) {
      console.warn('Error in partner sync:', error);
      return await TransactionStore.getAll();
    }
  },

  /**
   * Update the shared file with current transactions (for partner to see).
   * Call this after adding/modifying transactions when Partner Mode is enabled.
   */
  async updateSharedFile(accessToken: string, userEmail: string): Promise<boolean> {
    try {
      const partnerSettings = await PartnerStore.getSettings();
      if (!partnerSettings.enabled) {
        return true; // Not in partner mode, nothing to update
      }

      const fileId = await GoogleDriveService.findOrCreateSharedFile(accessToken);
      if (!fileId) {
        return false;
      }

      // Get current transactions and tag with owner
      const transactions = await GoogleDriveService.fetchAllTransactions(accessToken);
      const taggedTransactions = transactions.map(t => ({
        ...t,
        ownerEmail: t.ownerEmail || userEmail,
      }));

      return await GoogleDriveService.saveToFile(accessToken, fileId, taggedTransactions);
    } catch (error) {
      console.warn('Error updating shared file:', error);
      return false;
    }
  },
};

export default GoogleDriveService;
