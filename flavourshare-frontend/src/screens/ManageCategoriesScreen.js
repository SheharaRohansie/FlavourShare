import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, FlatList, Alert, Platform, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { API_BASE_URL } from '../constants/api';

const RequiredLabel = ({ label }) => (
  <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
);

export default function ManageCategoriesScreen() {
  const { token, user } = useContext(AuthContext);
  const { showAlert, showConfirm } = useContext(ModalContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
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

  const pickImage = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showAlert('Permission required', 'You\'ve refused to allow this app to access your photos!', 'error');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setImageUri(null);
    setImageChanged(false);
    setNameError('');
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setName(category.name);
    setDescription(category.description || '');
    setImageUri(category.image || null);
    setImageChanged(false);
  };

  const handleDelete = (id) => {
    showConfirm('Confirm Delete', 'Are you sure you want to delete this category?', () => deleteCategory(id));
  };

  const deleteCategory = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Error deleting category', 'error');
    }
  };

  const submitCategory = async () => {
    let isValid = true;
    if (!name) {
      setNameError('This field is required *');
      isValid = false;
    } else {
      setNameError('');
    }

    
    if (!isValid) return;
    
    setFormLoading(true);
    try {
      let formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);

      if (imageChanged && imageUri) {
        let filename = imageUri.split('/').pop();
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image`;
        
        if (Platform.OS === 'web') {
          const res = await fetch(imageUri);
          const blob = await res.blob();
          formData.append('image', blob, filename || 'upload.jpg');
        } else {
          formData.append('image', { uri: imageUri, name: filename, type });
        }
      }

      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        },
        timeout: 30000
      };

      if (editingId) {
        await axios.put(`${API_BASE_URL}/api/categories/${editingId}`, formData, config);
      } else {
        await axios.post(`${API_BASE_URL}/api/categories`, formData, config);
      }

      resetForm();
      fetchCategories();
      showAlert('Success', 'Category saved successfully!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving category';
      if (msg.toLowerCase().includes('already have a category')) {
        setNameError(msg);
      }
      showAlert('Error', msg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const renderCategory = ({ item }) => (
    <View style={styles.card}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.catImage} />
      ) : (
        <View style={styles.imgPlaceholder}><Text style={styles.imgText}>No Image</Text></View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.catName}>{item.name}</Text>
        <Text style={styles.catDesc} numberOfLines={1}>{item.description}</Text>
      </View>
      {item.createdBy === user?._id && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Manage Categories</Text>
      
      <View style={styles.form}>
        <Text style={styles.formTitle}>{editingId ? 'Edit Category' : 'Add New Category'}</Text>
        <RequiredLabel label="Category Name" />
        <TextInput
          style={styles.input}
          placeholder="Category Name"
          value={name}
          onChangeText={(text) => { setName(text); setNameError(''); }}
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        
        <Text style={styles.labelNonRequired}>Description (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
        />
        <TouchableOpacity style={styles.imgBtn} onPress={pickImage}>
          <Text style={styles.imgBtnText}>{imageUri ? 'Change Image' : 'Pick Image'}</Text>
        </TouchableOpacity>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

        <View style={styles.formActions}>
          {editingId && (
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm} disabled={formLoading}>
              <Text style={styles.submitText}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.submitBtn} onPress={submitCategory} disabled={formLoading}>
            {formLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{editingId ? 'Update' : 'Create'}</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#e67e22" style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item._id}
          renderItem={renderCategory}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20, paddingTop: 40 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  formTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15, color: '#222' },
  label: { fontSize: 13, color: '#444', marginBottom: 6, fontWeight: '600', marginLeft: 4 },
  labelNonRequired: { fontSize: 13, color: '#444', marginBottom: 6, fontWeight: '600', marginLeft: 4 },
  required: { color: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: -8, marginBottom: 12, marginLeft: 8 },
  input: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  imgBtn: { backgroundColor: '#eef2f5', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  imgBtnText: { color: '#e67e22', fontWeight: 'bold' },
  preview: { width: '100%', height: 100, borderRadius: 8, marginBottom: 10, resizeMode: 'cover' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  submitBtn: { backgroundColor: '#e67e22', padding: 12, borderRadius: 8, alignItems: 'center', flex: 1 },
  cancelBtn: { backgroundColor: '#999', padding: 12, borderRadius: 8, alignItems: 'center', flex: 1 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  list: { paddingBottom: 20 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  catImage: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  imgPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eee', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  imgText: { fontSize: 10, color: '#999' },
  cardInfo: { flex: 1 },
  catName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  catDesc: { fontSize: 12, color: '#666', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: { backgroundColor: '#007bff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  deleteBtn: { backgroundColor: '#dc3545', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});


