import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../constants/api';

const RequiredLabel = ({ label }) => (
  <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
);

export default function CreateEditListScreen({ route, navigation }) {
  const existingList = route.params?.existingList;
  const { token } = useContext(AuthContext);
  const { showAlert } = useContext(ModalContext);

  const [name, setName] = useState(existingList?.name || '');
  const [items, setItems] = useState(existingList?.items || []);
  const [imageUri, setImageUri] = useState(existingList?.image || null);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const addItemRow = () => {
    setItems([...items, { name: '', quantity: 1, unit: '', isBought: false }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItemRow = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const saveList = async () => {
    let isValid = true;
    if (!name.trim()) {
      setNameError('This field is required *');
      isValid = false;
    } else {
      setNameError('');
    }
    
    if (!isValid) return;

    const filteredItems = items
      .filter(i => i.name.trim() !== '')
      .map(i => ({
        ...i,
        quantity: i.quantity === '' || isNaN(i.quantity) ? 1 : Number(i.quantity)
      }));

    if (filteredItems.length === 0) {
      showAlert('Error', 'Please add at least one item to the shopping list', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('items', JSON.stringify(filteredItems));

      if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        
        if (Platform.OS === 'web') {
          const resFlow = await fetch(imageUri);
          const blob = await resFlow.blob();
          formData.append('image', blob, filename || 'cover.jpg');
        } else {
          formData.append('image', { uri: imageUri, name: filename, type });
        }
      }

      if (existingList) {
        await axios.put(`${API_BASE_URL}/api/shoppingLists/${existingList._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/shoppingLists`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      navigation.goBack();
    } catch(err) {
      console.log('Error saving list', err);
      showAlert('Error', 'Failed to save list', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 15}}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{existingList ? 'Edit List' : 'New List'}</Text>
        <TouchableOpacity onPress={saveList} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#e67e22" /> : <Text style={styles.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Image Picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color="#ccc" />
              <Text style={{color: '#999', marginTop: 10}}>Add Cover Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <RequiredLabel label="List Name" />
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Weekly Groceries, BBQ Party"
          value={name}
          onChangeText={(text) => { setName(text); setNameError(''); }}
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.label}>Items</Text>
          <TouchableOpacity onPress={addItemRow}>
            <Text style={styles.addText}>+ Add Row</Text>
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <TextInput 
              style={[styles.input, {flex: 3, marginBottom: 0, marginRight: 10}]} 
              placeholder="Item name"
              value={item.name}
              onChangeText={(val) => updateItem(index, 'name', val)}
            />
            <TextInput 
              style={[styles.input, {flex: 1, marginBottom: 0, marginRight: 10}]} 
              placeholder="Qty"
              keyboardType="numeric"
              value={String(item.quantity)}
              onChangeText={(val) => updateItem(index, 'quantity', val)}
            />
            <TextInput 
              style={[styles.input, {flex: 1.5, marginBottom: 0, marginRight: 10}]} 
              placeholder="Unit (oz, kg)"
              value={item.unit}
              onChangeText={(val) => updateItem(index, 'unit', val)}
            />
            <TouchableOpacity onPress={() => removeItemRow(index)} style={{justifyContent: 'center', alignItems: 'center', width: 30}}>
              <Ionicons name="remove-circle" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        ))}

        {items.length === 0 && (
           <Text style={{color: '#aaa', fontStyle: 'italic', marginBottom: 20}}>No items added yet. Click "+ Add Row" to start.</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  saveBtn: { fontSize: 18, fontWeight: 'bold', color: '#e67e22' },
  imagePicker: { alignSelf: 'center', width: 150, height: 150, borderRadius: 75, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 30, overflow: 'hidden', borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center' },
  label: { fontSize: 16, fontWeight: 'bold', color: '#444', marginBottom: 10 },
  required: { color: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: -15, marginBottom: 15, marginLeft: 5 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 15, height: 45, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10, marginBottom: 10 },
  addText: { color: '#3498db', fontWeight: 'bold' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 }
});


