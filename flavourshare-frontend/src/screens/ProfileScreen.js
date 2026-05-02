import React, { useCallback, useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, Modal, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { API_BASE_URL } from '../constants/api';

export default function ProfileScreen({ navigation }) {
  const { user, token, logout } = useContext(AuthContext);
  const { showAlert, showConfirm } = useContext(ModalContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUri, setEditImageUri] = useState(null);
  const [editImageChanged, setEditImageChanged] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchMyCategories();
    }, [])
  );

  const fetchMyCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categories/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch (err) {
      console.log('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (category) => {
    setEditingId(category._id);
    setEditName(category.name);
    setEditDescription(category.description || '');
    setEditImageUri(category.image || null);
    setEditImageChanged(false);
    setNameError('');
    setEditModalVisible(true);
  };

  const resetEditModal = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    setEditImageUri(null);
    setEditImageChanged(false);
    setNameError('');
    setEditModalVisible(false);
  };

  const pickEditImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setEditImageUri(result.assets[0].uri);
      setEditImageChanged(true);
    }
  };

  const submitEditCategory = async () => {
    let isValid = true;
    if (!editName.trim()) { setNameError('This field is required *'); isValid = false; } else setNameError('');
    if (!isValid) return;

    setEditLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('description', editDescription.trim());

      if (editImageChanged && editImageUri) {
        const filename = editImageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        if (Platform.OS === 'web') {
          const res = await fetch(editImageUri);
          const blob = await res.blob();
          formData.append('image', blob, filename || 'upload.jpg');
        } else {
          formData.append('image', { uri: editImageUri, name: filename, type });
        }
      }

      await axios.put(`${API_BASE_URL}/api/categories/${editingId}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      showAlert('Success', 'Category updated!', 'success');
      resetEditModal();
      fetchMyCategories();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update category';
      if (msg.toLowerCase().includes('already have a category')) {
        setNameError(msg);
      }
      showAlert('Error', msg, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDeleteCategory = (id) => {
    showConfirm('Confirm Delete', 'Are you sure you want to delete this category?', () => deleteCategory(id));
  };

  const deleteCategory = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyCategories();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error deleting category';
      showAlert('Error', msg, 'error');
    }
  };

  return (
    <View style={styles.container}>
      <Modal transparent visible={editModalVisible} animationType="slide" onRequestClose={resetEditModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Category</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={(text) => { setEditName(text); setNameError(''); }} />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={editDescription} onChangeText={setEditDescription} multiline />

            <TouchableOpacity style={styles.imgBtn} onPress={pickEditImage}>
              <Text style={styles.imgBtnText}>{editImageUri ? 'Change Image' : 'Pick Image (Optional)'}</Text>
            </TouchableOpacity>
            {editImageUri ? <Image source={{ uri: editImageUri }} style={styles.preview} /> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={resetEditModal} disabled={editLoading}>
                <Text style={styles.actionBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={submitEditCategory} disabled={editLoading}>
                {editLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>🍽️ FlavourShare</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'details' && styles.tabActive]} 
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>User Details</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'categories' && styles.tabActive]} 
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>My Categories</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'details' ? (
          <>
            <View style={styles.card}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{user?.firstName} {user?.lastName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{user?.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact Number</Text>
                <Text style={styles.detailValue}>{user?.contactNumber}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {loading ? (
              <ActivityIndicator size="large" color="#e67e22" style={{ marginTop: 20 }} />
            ) : categories.length === 0 ? (
              <Text style={styles.emptyText}>No categories yet. Create one in your recipes!</Text>
            ) : (
              categories.map((cat) => (
                <View key={cat._id} style={styles.categoryCard}>
                  {cat.image ? (
                    <Image source={{ uri: cat.image }} style={styles.categoryImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>📷</Text></View>
                  )}
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryDescription} numberOfLines={2}>{cat.description || 'No description'}</Text>
                  </View>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity style={styles.actionSmallBtn} onPress={() => openEditModal(cat)}>
                      <Text style={styles.actionSmallText}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionSmallBtn, styles.deleteSmallBtn]} onPress={() => confirmDeleteCategory(cat._id)}>
                      <Text style={styles.actionSmallText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 44, paddingBottom: 18, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#e67e22' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#e67e22' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#e67e22' },
  scroll: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 20, marginBottom: 24 },
  detailRow: { marginBottom: 18 },
  detailLabel: { fontSize: 12, color: '#999', marginBottom: 4, fontWeight: '600' },
  detailValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  label: { fontSize: 12, color: '#999', marginTop: 12 },
  value: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  editButton: { backgroundColor: '#e67e22', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center', marginTop: 20 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 14, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#e67e22' },
  categoryImage: { width: 60, height: 60, borderRadius: 30, marginRight: 14 },
  imagePlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eee', marginRight: 14, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholderText: { fontSize: 24 },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  categoryDescription: { fontSize: 12, color: '#666', marginTop: 4 },
  categoryActions: { flexDirection: 'row', gap: 8 },
  actionSmallBtn: { backgroundColor: '#007bff', width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  deleteSmallBtn: { backgroundColor: '#dc3545' },
  actionSmallText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#e74c3c', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: 4, marginBottom: 4, marginLeft: 4 },
  imgBtn: { backgroundColor: '#eef2f5', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  imgBtnText: { color: '#e67e22', fontWeight: 'bold' },
  preview: { width: '100%', height: 100, borderRadius: 8, marginBottom: 10, resizeMode: 'cover' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: { flex: 1, backgroundColor: '#e67e22', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#999' },
  actionBtnText: { color: '#fff', fontWeight: 'bold' }
});

