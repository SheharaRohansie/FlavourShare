import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';

export default function ListDetailScreen({ route, navigation }) {
  const { listId } = route.params;
  const { token } = useContext(AuthContext);
  const { showAlert, showConfirm } = useContext(ModalContext);
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Quick add state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchList();
    });
    return unsubscribe;
  }, [navigation, listId]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/shoppingLists/${listId}`, { headers: { Authorization: `Bearer ${token}` } });
      setList(res.data);
    } catch (err) {
      console.log('Error fetching list details', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemId) => {
    // Optimistic UI update
    setList(prev => {
      const newItems = prev.items.map(item => item._id === itemId ? { ...item, isBought: !item.isBought } : item);
      return { ...prev, items: newItems };
    });

    try {
      await axios.put(`${API_BASE_URL}/api/shoppingLists/${listId}/toggle-item/${itemId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch(err) {
      console.log('Error toggling item', err);
      // Revert on failure
      fetchList();
    }
  };

  const quickAddItem = async () => {
    if (!newItemName.trim()) return;

    const qtyNumber = newItemQty === '' || isNaN(newItemQty) ? 1 : Number(newItemQty);
    const updatedItems = [...list.items, { name: newItemName, quantity: qtyNumber, unit: '', isBought: false }];
    
    try {
      const formData = new FormData();
      formData.append('items', JSON.stringify(updatedItems));

      const res = await axios.put(`${API_BASE_URL}/api/shoppingLists/${listId}`, 
        formData, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setList(res.data);
      setNewItemName('');
      setNewItemQty('');
    } catch(err) {
      showAlert('Error', 'Failed to add item', 'error');
    }
  };

  const confirmDelete = () => {
    showConfirm('Delete List', 'Are you sure you want to delete this list?', deleteList);
  };

  const deleteList = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/shoppingLists/${listId}`, { headers: { Authorization: `Bearer ${token}` } });
      navigation.goBack();
    } catch(err) {
      showAlert('Error', 'Failed to delete list', 'error');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemRow} onPress={() => toggleItem(item._id)}>
      <View style={[styles.checkbox, item.isBought && styles.checkboxActive]}>
        {item.isBought && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
      <View style={{flex: 1}}>
        <Text style={[styles.itemName, item.isBought && styles.itemBoughtText]}>{item.name}</Text>
      </View>
      <Text style={[styles.itemQty, item.isBought && styles.itemBoughtText]}>
        {item.quantity} {item.unit}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !list) return <View style={styles.centered}><ActivityIndicator size="large" color="#e67e22" /></View>;
  if (!list) return <View style={styles.centered}><Text>List not found</Text></View>;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{paddingRight: 15}}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{list.name}</Text>
        <View style={{flexDirection: 'row'}}>
          <TouchableOpacity onPress={() => navigation.navigate('CreateEditList', { existingList: list })} style={{marginRight: 15}}>
            <Ionicons name="pencil" size={24} color="#3498db" />
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete}>
            <Ionicons name="trash" size={24} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={list.items}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />

      <View style={styles.quickAddContainer}>
        <TextInput 
          style={[styles.input, {flex: 2, marginRight: 10}]} 
          placeholder="New item..." 
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TextInput 
          style={[styles.input, {flex: 1, marginRight: 10}]} 
          placeholder="Qty" 
          keyboardType="numeric"
          value={newItemQty}
          onChangeText={setNewItemQty}
        />
        <TouchableOpacity style={styles.addBtn} onPress={quickAddItem}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ccc', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#2ecc71', borderColor: '#2ecc71' },
  itemName: { fontSize: 16, color: '#333' },
  itemQty: { fontSize: 16, color: '#666', fontWeight: 'bold' },
  itemBoughtText: { textDecorationLine: 'line-through', color: '#aaa' },
  quickAddContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', elevation: 10, shadowColor: '#000', shadowOffset: {width: 0, height: -2}, shadowOpacity: 0.1, shadowRadius: 5 },
  input: { backgroundColor: '#eef2f5', borderRadius: 8, paddingHorizontal: 15, height: 45 },
  addBtn: { backgroundColor: '#e67e22', width: 45, height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }
});
