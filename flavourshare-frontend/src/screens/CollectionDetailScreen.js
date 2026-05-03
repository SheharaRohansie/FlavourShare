import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { API_BASE_URL } from '../constants/api';

export default function CollectionDetailScreen({ route, navigation }) {
  const { collectionId } = route.params;
  const { token } = useContext(AuthContext);
  const { showAlert, showConfirm } = useContext(ModalContext);

  const [collection, setCollection] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editImageUri, setEditImageUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingRecipeId, setDeletingRecipeId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [collectionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [collRes, recipesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/collections`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/saved?collectionId=${collectionId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const currentCollection = collRes.data.find(c => c._id === collectionId);
      setCollection(currentCollection);
      setRecipes(recipesRes.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setEditName(collection.name);
    setEditNote(collection.note || '');
    setEditImageUri(collection.image || null);
    setEditModalVisible(true);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setEditImageUri(result.assets[0].uri);
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

  const updateCollection = async () => {
    if (!editName.trim()) {
      showAlert('Error', 'Collection name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('note', editNote);
      
      if (editImageUri && editImageUri !== collection.image) {
        const imageFile = await getFormDataImage(editImageUri);
        if (Platform.OS === 'web') formData.append('image', imageFile.blob, imageFile.filename);
        else formData.append('image', imageFile);
      }

      await axios.put(`${API_BASE_URL}/api/collections/${collectionId}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setEditModalVisible(false);
      fetchData();
      showAlert('Success', 'Collection updated!', 'success');
    } catch (err) {
      console.log(err);
      showAlert('Error', 'Failed to update collection', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteCollection = () => {
    setEditModalVisible(false);

    setTimeout(() => {
      showConfirm('Delete Collection', 'Are you sure? All saved recipes inside will be unbookmarked.', async () => {
        setDeleting(true);
        try {
          await axios.delete(`${API_BASE_URL}/api/collections/${collectionId}`, { headers: { Authorization: `Bearer ${token}` } });
          setDeleting(false);
          showAlert('Success', 'Collection deleted', 'success');
          navigation.goBack();
        } catch (err) {
          console.log(err);
          setDeleting(false);
          showAlert('Error', 'Failed to delete', 'error');
        }
      });
    }, 250);
  };

  const removeRecipe = async (id) => {
    setDeletingRecipeId(id);
    try {
      await axios.delete(`${API_BASE_URL}/api/saved/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
    } catch (err) {
      console.log(err);
    } finally {
      setDeletingRecipeId(null);
    }
  };

  const renderRecipeItem = ({ item }) => {
    const rc = item.recipeId;
    if (!rc) return null;
    return (
      <View style={styles.card}>
        <TouchableOpacity style={{flexDirection: 'row', flex: 1}} onPress={() => navigation.navigate('RecipeDetail', { recipeId: rc._id })}>
          <Image source={{ uri: rc.photo }} style={styles.image} />
          <View style={styles.info}>
            <Text style={styles.title}>{rc.title}</Text>
            <Text style={styles.meta}>⏱️ {rc.cookTime}</Text>
            {item.personalNote ? <Text style={styles.recipeNote} numberOfLines={2}>Note: {item.personalNote}</Text> : null}
          </View>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => removeRecipe(item._id)} disabled={deletingRecipeId !== null}>
            {deletingRecipeId === item._id ? (
              <ActivityIndicator size="small" color="#e74c3c" />
            ) : (
              <Ionicons name="trash" size={20} color="#e74c3c" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#e67e22" /></View>;
  if (!collection) return <View style={styles.centered}><Text style={styles.emptyText}>Collection not found.</Text></View>;

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <View style={styles.headerContainer}>
        {collection.image ? (
           <Image source={{ uri: collection.image }} style={styles.headerImage} />
        ) : (
           <View style={[styles.headerImage, {backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center'}]}>
             <Ionicons name="folder" size={60} color="#fff" />
           </View>
        )}
        <View style={styles.overlay} pointerEvents="none" />
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{collection.name}</Text>
          {collection.note ? <Text style={styles.headerNote}>{collection.note}</Text> : null}
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
        <Ionicons name="pencil" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Recipes List */}
      <View style={{flex: 1}}>
        <Text style={styles.sectionTitle}>Recipes ({recipes.length})</Text>
        <FlatList
          data={recipes}
          keyExtractor={item => item._id}
          renderItem={renderRecipeItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No recipes saved yet.</Text>}
        />
      </View>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Text style={styles.modalTitle}>Edit Collection</Text>
            
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} />
            
            <Text style={styles.label}>Note</Text>
            <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} value={editNote} onChangeText={setEditNote} multiline />

            <Text style={styles.label}>Cover Photo</Text>
            <TouchableOpacity onPress={pickImage} style={styles.imageBtn}>
              <Text style={styles.imageBtnText}>{editImageUri ? 'Change Photo' : '📷 Add Cover Photo'}</Text>
            </TouchableOpacity>
            {editImageUri && <Image source={{ uri: editImageUri }} style={styles.previewImage} />}

            <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 20}} onPress={deleteCollection} disabled={deleting}>
              {deleting ? <ActivityIndicator size="small" color="#e74c3c" /> : <Ionicons name="trash-outline" size={20} color="#e74c3c" />}
              <Text style={{color: '#e74c3c', marginLeft: 5, fontWeight: 'bold'}}>{deleting ? 'Deleting...' : 'Delete Collection'}</Text>
            </TouchableOpacity>

            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <TouchableOpacity style={[styles.btn, {backgroundColor: '#ccc', flex: 1, marginRight: 10}]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, {flex: 1}]} onPress={updateCollection} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { width: '100%', height: 250, position: 'relative' },
  headerImage: { width: '100%', height: 250, resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, elevation: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 25 },
  editButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, elevation: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 25 },
  headerTextContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  headerNote: { color: '#eee', fontSize: 14, marginTop: 5, fontStyle: 'italic' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 20, marginVertical: 15, color: '#444' },
  emptyText: { fontSize: 16, color: '#999', paddingHorizontal: 20, fontStyle: 'italic' },
  
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' },
  image: { width: 100, height: 100 },
  info: { flex: 1, padding: 15, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 5 },
  meta: { fontSize: 12, color: '#666', marginTop: 5 },
  recipeNote: { marginTop: 8, fontSize: 12, color: '#e67e22', fontStyle: 'italic' },
  actions: { justifyContent: 'center', paddingRight: 15 },
  actionBtn: { padding: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15 },
  imageBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  imageBtnText: { color: '#666', fontWeight: 'bold' },
  previewImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 20, resizeMode: 'cover' },
  btn: { backgroundColor: '#e67e22', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
