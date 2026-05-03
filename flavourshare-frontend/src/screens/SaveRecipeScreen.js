import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, TextInput, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { API_BASE_URL } from '../constants/api';

const REQUEST_TIMEOUT = 15000;

export default function SaveRecipeScreen({ route, navigation }) {
  const { recipeId } = route.params;
  const { token } = useContext(AuthContext);
  const { showAlert } = useContext(ModalContext);

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingCollectionId, setSavingCollectionId] = useState(null);
  
  // Create New Collection State
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newImageUri, setNewImageUri] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/collections`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: REQUEST_TIMEOUT
      });
      setCollections(res.data);
    } catch (err) {
      console.log('Error fetching collections', err);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewImageUri(result.assets[0].uri);
    }
  };

  const getFormDataImage = async (uri) => {
    const filename = uri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;
    
    if (Platform.OS === 'web') {
      const res = await fetch(uri);
      const blob = await res.blob();
      return { blob, filename };
    }
    return { uri, name: filename, type };
  };

  const createCollectionAndSave = async () => {
    if (!newName.trim()) {
      showAlert('Error', 'Collection name is required', 'error');
      return;
    }
    setCreating(true);
    try {
      // 1. Create collection
      const formData = new FormData();
      formData.append('name', newName);
      formData.append('note', newNote);
      
      if (newImageUri) {
        const imageFile = await getFormDataImage(newImageUri);
        if (Platform.OS === 'web') formData.append('image', imageFile.blob, imageFile.filename);
        else formData.append('image', imageFile);
      }

      const collRes = await axios.post(`${API_BASE_URL}/api/collections`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: REQUEST_TIMEOUT
      });

      const newCollectionId = collRes.data._id;

      // 2. Save Recipe explicitly using the new collectionId
      await saveToCollection(newCollectionId);
    } catch (err) {
      console.log(err);
      showAlert('Error', 'Failed to create collection', 'error');
      setCreating(false);
    }
  };

  const saveToCollection = async (collectionId) => {
    if (!recipeId) {
      showAlert('Error', 'Recipe id is missing', 'error');
      return;
    }

    setSavingCollectionId(collectionId);
    try {
      await axios.post(`${API_BASE_URL}/api/saved`, {
        recipeId,
        collectionId
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: REQUEST_TIMEOUT
      });
      
      navigation.goBack();
      setTimeout(() => {
        showAlert('Success', 'Recipe saved to collection!', 'success');
      }, 250);
    } catch (err) {
      const msg = err.code === 'ECONNABORTED'
        ? 'Saving took too long. Please check your connection and try again.'
        : err.response?.data?.message || 'Failed to save recipe';
      if (msg === 'Recipe already saved in this collection') {
        showAlert('Info', msg, 'info');
      } else {
        showAlert('Error', msg, 'error');
      }
    } finally {
      setSavingCollectionId(null);
      setCreating(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#e67e22" /></View>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Save Recipe</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {!isCreating ? (
        <View style={{flex: 1}}>
          <TouchableOpacity style={styles.newBtn} onPress={() => setIsCreating(true)}>
            <Ionicons name="add-circle-outline" size={24} color="#e67e22" />
            <Text style={styles.newBtnText}>New Collection</Text>
          </TouchableOpacity>

          {collections.length === 0 ? (
             <View style={styles.centered}>
               <Text style={styles.emptyText}>No collections yet.</Text>
             </View>
          ) : (
            <FlatList 
              data={collections}
              keyExtractor={item => item._id}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => saveToCollection(item._id)}
                  disabled={savingCollectionId !== null}
                >
                  {item.image ? (
                     <Image source={{ uri: item.image }} style={styles.cardImage} />
                  ) : (
                     <View style={[styles.cardImage, {backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center'}]}>
                        <Ionicons name="folder" size={32} color="#ccc" />
                     </View>
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    {item.note ? <Text style={styles.cardNote} numberOfLines={1}>{item.note}</Text> : null}
                  </View>
                  {savingCollectionId === item._id ? (
                    <ActivityIndicator size="small" color="#e67e22" style={{ marginRight: 10 }} />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#ccc" style={{marginRight: 10}} />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => setIsCreating(false)}>
            <Ionicons name="arrow-back" size={20} color="#e67e22" />
            <Text style={{color: '#e67e22', marginLeft: 5, fontWeight: 'bold'}}>Back to Collections</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Collection Name *</Text>
          <TextInput 
            style={styles.input} 
            value={newName} 
            onChangeText={setNewName} 
            placeholder="e.g. Sunday Dinners" 
          />

          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput 
            style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
            value={newNote} 
            onChangeText={setNewNote} 
            placeholder="What's this collection about?" 
            multiline
          />

          <Text style={styles.label}>Cover Photo</Text>
          <TouchableOpacity onPress={pickImage} style={styles.imageBtn}>
            <Text style={styles.imageBtnText}>{newImageUri ? 'Change Photo' : '📷 Add Cover Photo'}</Text>
          </TouchableOpacity>
          {newImageUri && <Image source={{ uri: newImageUri }} style={styles.previewImage} />}

          <TouchableOpacity style={styles.saveBtn} onPress={createCollectionAndSave} disabled={creating}>
            {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Collection & Recipe</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc', paddingTop: Platform.OS === 'android' ? 40 : 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  newBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 20, marginTop: 20, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e67e22', justifyContent: 'center' },
  newBtnText: { color: '#e67e22', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  emptyText: { color: '#999', fontSize: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' },
  cardImage: { width: 80, height: 80 },
  cardInfo: { flex: 1, padding: 15, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 5 },
  cardNote: { fontSize: 13, color: '#666' },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20 },
  imageBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  imageBtnText: { color: '#666', fontWeight: 'bold' },
  previewImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 20, resizeMode: 'cover' },
  saveBtn: { backgroundColor: '#e67e22', padding: 15, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
