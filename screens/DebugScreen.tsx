import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { Transaction } from '../src/models/Transaction';
import { TransactionStore } from '../src/services/TransactionStore';
import { parseSmsToTransaction } from '../src/services/SmsParserService';

const DebugScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const load = async () => {
    const all = await TransactionStore.getAll();
    setTransactions(all);
  };

  useEffect(() => { load(); }, []);

  const handleClear = async () => {
    await (require('@react-native-async-storage/async-storage')).removeItem('@expenses_app:transactions');
    load();
  };

  const handleSimulate = async () => {
    const sample = "Your account XXXX1234 was debited for INR 1,250.00 at AMAZON. Ref: 12345";
    const parsed = parseSmsToTransaction(sample);
    if (parsed.matched && parsed.transaction) {
      await TransactionStore.add(parsed.transaction);
      load();
      Alert.alert('Simulated', 'Added a parsed transaction (Review)');
    } else {
      Alert.alert('No match', 'Parser did not match sample SMS');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug</Text>
      <Button title="Simulate SMS" onPress={handleSimulate} />
      <Button title="Clear Stored Transactions" color="red" onPress={handleClear} />
      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.detail}>{item.detail}</Text>
            <Text>{item.type} {item.amount}</Text>
            <Text>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  item: { padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  detail: { fontWeight: '600' },
});

export default DebugScreen;
