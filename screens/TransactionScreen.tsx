import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Button, FlatList, TextInput, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Transaction } from '../src/models/Transaction';
import { TransactionService } from '../src/services/TransactionService';
import { parseSmsToTransaction } from '../src/services/SmsParserService';
import { TransactionStore } from '../src/services/TransactionStore';

const TransactionScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileUri = asset.uri;
        const response = await fetch(fileUri);
        const fileContent = await response.text();
        
        const parsedTransactions = await TransactionService.getTransactionsFromCSV(fileContent);
          setTransactions(parsedTransactions);
      }
    } catch (err) {
      console.error('Error picking or parsing document:', err);
    }
  };

    useEffect(() => {
      // Load persisted transactions (including ones added by SMS parser)
      (async () => {
        const stored = await TransactionStore.getAll();
        setTransactions(stored);
      })();
    }, []);

    const handleSimulateSms = async () => {
      const sample = "Your account XXXX1234 was debited for INR 1,250.00 at AMAZON. Ref: 12345";
      const parsed = parseSmsToTransaction(sample);
      if (parsed.matched && parsed.transaction) {
        await TransactionStore.add(parsed.transaction);
        const stored = await TransactionStore.getAll();
        setTransactions(stored);
      } else {
        alert('No transaction parsed from sample SMS');
      }
    };

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) {
      return transactions;
    }
    return transactions.filter(transaction =>
      transaction.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDetailText}>{item.detail}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.itemCategory}>{item.category}</Text>
          {item.ownerEmail && (
            <Text style={styles.ownerTag}>
              • {item.ownerEmail.split('@')[0]}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.itemAmountContainer}>
        <Text style={[styles.itemAmount, { color: item.type === 'Cr' ? 'green' : 'red' }]}>
          {item.type === 'Db' ? '-' : ''}${item.amount.toFixed(2)}
        </Text>
        <Text style={styles.itemDate}>{item.date.toLocaleDateString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transactions</Text>
      <Button title="Import CSV" onPress={handleImport} />
      <Button title="Simulate SMS" onPress={handleSimulateSms} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search by detail or category..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredTransactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No transactions found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginVertical: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemDetailText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  itemCategory: {
    fontSize: 14,
    color: '#666',
  },
  ownerTag: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  itemAmountContainer: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

export default TransactionScreen;
