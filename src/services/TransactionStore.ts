import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../models/Transaction';

const STORAGE_KEY = '@expenses_app:transactions';

export const TransactionStore = {
  async getAll(): Promise<Transaction[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as Transaction[];
    } catch (e) {
      console.warn('Failed to read transactions', e);
      return [];
    }
  },

  async add(tx: Transaction): Promise<void> {
    try {
      const current = await TransactionStore.getAll();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([tx, ...current]));
    } catch (e) {
      console.warn('Failed to add transaction', e);
    }
  },
};

export default TransactionStore;
