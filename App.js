import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  X,
  IndianRupee
} from 'lucide-react-native';

export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState([]);
  const [monthlyBalance, setMonthlyBalance] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [viewFilter, setViewFilter] = useState('month');
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    description: '',
    amount: '',
    category: 'food'
  });
  const [balanceInput, setBalanceInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const txnData = await AsyncStorage.getItem('transactions');
      const balData = await AsyncStorage.getItem('monthly-balance');
      
      if (txnData) {
        setTransactions(JSON.parse(txnData));
      }
      if (balData) {
        setMonthlyBalance(parseFloat(balData));
      }
    } catch (error) {
      console.log('No existing data found');
    }
  };

  const saveData = async (txns, balance) => {
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(txns));
      if (balance !== undefined) {
        await AsyncStorage.setItem('monthly-balance', balance.toString());
      }
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const addTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount) return;

    const transaction = {
      id: Date.now(),
      ...newTransaction,
      amount: parseFloat(newTransaction.amount),
      date: new Date().toISOString()
    };

    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    saveData(updatedTransactions);

    setNewTransaction({ type: 'expense', description: '', amount: '', category: 'food' });
    setShowAddModal(false);
  };

  const setBalance = (amount, carryForward = false) => {
    let newBalance = parseFloat(amount);
    if (carryForward) {
      newBalance = getCurrentBalance();
    }
    setMonthlyBalance(newBalance);
    saveData(transactions, newBalance);
    setShowBalanceModal(false);
    setBalanceInput('');
  };

  const getCurrentBalance = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return monthlyBalance + totalIncome - totalExpense;
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return transactions.filter(t => {
      const txnDate = new Date(t.date);
      if (viewFilter === 'day') {
        return txnDate >= today;
      } else if (viewFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return txnDate >= weekAgo;
      } else {
        return txnDate.getMonth() === now.getMonth() && 
               txnDate.getFullYear() === now.getFullYear();
      }
    });
  };

  const filteredTransactions = getFilteredTransactions();
  const currentBalance = getCurrentBalance();
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const categories = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'other'];

  return (
    <SafeAreaView style={styles.container}>
     <StatusBar style="dark" backgroundColor="#000000" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            
            <Text style={styles.title}>Spendly</Text>
          </View>
          <TouchableOpacity
            style={styles.setBalanceBtn}
            onPress={() => setShowBalanceModal(true)}
          >
            <Text style={styles.setBalanceBtnText}>Set Balance</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <View style={styles.balanceAmountRow}>
            <IndianRupee color="#fff" size={32} strokeWidth={2.5} />
            <Text style={styles.balanceAmount}>{currentBalance.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <TrendingUp color="#fff" size={16} strokeWidth={2} />
              <Text style={styles.summaryText}>Income: ₹{totalIncome.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <TrendingDown color="#fff" size={16} strokeWidth={2} />
              <Text style={styles.summaryText}>Expense: ₹{totalExpense.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          {['day', 'week', 'month'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterBtn,
                viewFilter === filter && styles.filterBtnActive
              ]}
              onPress={() => setViewFilter(filter)}
            >
              <Text style={[
                styles.filterBtnText,
                viewFilter === filter && styles.filterBtnTextActive
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Plus color="#fff" size={20} strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Add Transaction</Text>
        </TouchableOpacity>

        <View style={styles.transactionsList}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar color="#9ca3af" size={48} strokeWidth={1.5} />
              <Text style={styles.emptyText}>No transactions for this period</Text>
            </View>
          ) : (
            filteredTransactions.map(txn => (
              <View key={txn.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.iconCircle,
                    txn.type === 'income' ? styles.incomeCircle : styles.expenseCircle
                  ]}>
                    {txn.type === 'income' ? (
                      <TrendingUp color="#10b981" size={20} strokeWidth={2.5} />
                    ) : (
                      <TrendingDown color="#ef4444" size={20} strokeWidth={2.5} />
                    )}
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDesc}>{txn.description}</Text>
                    <Text style={styles.transactionMeta}>
                      {txn.category} • {new Date(txn.date).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  txn.type === 'income' ? styles.incomeAmount : styles.expenseAmount
                ]}>
                  {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  newTransaction.type === 'expense' && styles.typeBtnExpense
                ]}
                onPress={() => setNewTransaction({...newTransaction, type: 'expense'})}
              >
                <TrendingDown 
                  color={newTransaction.type === 'expense' ? '#fff' : '#6b7280'} 
                  size={18} 
                  strokeWidth={2.5}
                />
                <Text style={[
                  styles.typeBtnText,
                  newTransaction.type === 'expense' && styles.typeBtnTextActive
                ]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  newTransaction.type === 'income' && styles.typeBtnIncome
                ]}
                onPress={() => setNewTransaction({...newTransaction, type: 'income'})}
              >
                <TrendingUp 
                  color={newTransaction.type === 'income' ? '#fff' : '#6b7280'} 
                  size={18} 
                  strokeWidth={2.5}
                />
                <Text style={[
                  styles.typeBtnText,
                  newTransaction.type === 'income' && styles.typeBtnTextActive
                ]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newTransaction.description}
              onChangeText={(text) => setNewTransaction({...newTransaction, description: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={newTransaction.amount}
              onChangeText={(text) => setNewTransaction({...newTransaction, amount: text})}
            />

            <View style={styles.categoryPicker}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryBtn,
                      newTransaction.category === cat && styles.categoryBtnActive
                    ]}
                    onPress={() => setNewTransaction({...newTransaction, category: cat})}
                  >
                    <Text style={[
                      styles.categoryBtnText,
                      newTransaction.category === cat && styles.categoryBtnTextActive
                    ]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={addTransaction}
              >
                <Text style={styles.confirmBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set Balance Modal */}
      <Modal
        visible={showBalanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBalanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Monthly Balance</Text>
              <TouchableOpacity onPress={() => setShowBalanceModal(false)}>
                <X color="#6b7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Enter starting balance (e.g., 500)"
              keyboardType="numeric"
              value={balanceInput}
              onChangeText={setBalanceInput}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => balanceInput && setBalance(balanceInput)}
            >
              <Wallet color="#fff" size={20} strokeWidth={2} />
              <Text style={styles.primaryBtnText}>Set New Balance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setBalance(0, true)}
            >
              <TrendingUp color="#fff" size={20} strokeWidth={2} />
              <Text style={styles.secondaryBtnText}>Carry Forward Current Balance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtnAlt}
              onPress={() => setShowBalanceModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:30,
    backgroundColor: '#f0f4ff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  setBalanceBtn: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  setBalanceBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#000000',
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    color: '#fff',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#4f46e5',
  },
  filterBtnText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  addBtn: {
    backgroundColor: '#000000',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 12,
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeCircle: {
    backgroundColor: '#d1fae5',
  },
  expenseCircle: {
    backgroundColor: '#fee2e2',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  transactionMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: '#10b981',
  },
  expenseAmount: {
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  typeBtnExpense: {
    backgroundColor: '#ef4444',
  },
  typeBtnIncome: {
    backgroundColor: '#10b981',
  },
  typeBtnText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  categoryPicker: {
    marginBottom: 20,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginRight: 8,
  },
  categoryBtnActive: {
    backgroundColor: '#4f46e5',
  },
  categoryBtnText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryBtnTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#4b5563',
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  primaryBtn: {
    paddingVertical: 14,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 14,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelBtnAlt: {
    paddingVertical: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
  },
});
