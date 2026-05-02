import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';

export default function ShoppingListScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const { showAlert, showConfirm } = useContext(ModalContext);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLists();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/shoppingLists`, { headers: { Authorization: `Bearer ${token}` } });
      setLists(res.data);
    } catch (err) {
      console.log('Error fetching shopping lists', err);
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/shoppingLists/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchLists();
    } catch (err) {
      console.log('Error deleting list', err);
      showAlert('Error', 'Could not delete the list', 'error');
    }
  };

  const deleteList = (id) => {
    showConfirm('Delete List', 'Are you sure you want to delete this shopping list?', () => executeDelete(id));
  };

  const renderItem = ({ item }) => {
    const totalItems = item.items.length;
    const boughtItems = item.items.filter(i => i.isBought).length;

    return (
      <View style={styles.card}>
        <TouchableOpacity 
          style={{ flex: 1, flexDirection: 'row' }} 
          onPress={() => navigation.navigate('ListDetail', { listId: item._id })}
        >
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholderImg]}>
              <Ionicons name="basket-outline" size={40} color="#999" />
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>Items: {boughtItems} / {totalItems} completed</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => navigation.navigate('CreateEditList', { existingList: item })}
          >
            <Ionicons name="pencil" size={20} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => deleteList(item._id)}
          >
            <Ionicons name="trash" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Lists</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateEditList')}>
          <Ionicons name="add-circle" size={32} color="#e67e22" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#e67e22" /></View>
      ) : lists.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cart-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No shopping lists yet. Create one!</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  emptyText: { color: '#999', marginTop: 10, fontSize: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' },
  image: { width: 90, height: 90 },
  placeholderImg: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, padding: 15, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 5 },
  meta: { fontSize: 13, color: '#666' },
  editBtn: { padding: 15, justifyContent: 'center' }
});
