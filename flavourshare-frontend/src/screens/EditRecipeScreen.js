import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Modal, KeyboardAvoidingView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { API_BASE_URL } from '../constants/api';

const RequiredLabel = ({ label }) => (
  <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
);

export default function EditRecipeScreen({ route, navigation }) {
  const { recipe } = route.params;
  const { token } = useContext(AuthContext);
  const { showAlert } = useContext(ModalContext);
  const [categories, setCategories] = useState([]);
  
  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description || '');
  const [cookTime, setCookTime] = useState(recipe.cookTime);
  const [servings, setServings] = useState(recipe.servings ? recipe.servings.toString() : '');
  const [categoryIds, setCategoryIds] = useState(recipe.categoryIds || (recipe.category ? [recipe.category] : []));
  const [imageUri, setImageUri] = useState(recipe.photo);
  const [loading, setLoading] = useState(false);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryImageUri, setNewCategoryImageUri] = useState(null);
  const [newCategoryLoading, setNewCategoryLoading] = useState(false);
  
  const [titleError, setTitleError] = useState('');
  const [cookTimeError, setCookTimeError] = useState('');
  const [categoryIdError, setCategoryIdError] = useState('');
  const [newCategoryNameError, setNewCategoryNameError] = useState('');
  const [imageUriError, setImageUriError] = useState('');
  
  const [ingredientsText, setIngredientsText] = useState(recipe.ingredients ? recipe.ingredients.join('\n') : '');
  const [stepsText, setStepsText] = useState(recipe.steps ? recipe.steps.join('\n') : '');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categories`);
      setCategories(res.data);
      if (res.data.length > 0 && categoryIds.length === 0) {
        setCategoryIds([res.data[0]._id]);
      }
    } catch(err) {
      console.log('Error fetching categories');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const toggleCategory = (id) => {
    setCategoryIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
    setCategoryIdError('');
  };

  const resetNewCategoryForm = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryImageUri(null);
    setNewCategoryNameError('');
  };

  const pickNewCategoryImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) {
        setNewCategoryImageUri(result.assets[0].uri);
      }
    } catch (err) {
      showAlert('Image picker error', 'Could not pick image. You can still continue without an image.', 'error');
    }
  };

  const submitNewCategory = async () => {
    let isValid = true;
    if (!newCategoryName.trim()) {
      setNewCategoryNameError('This field is required *');
      isValid = false;
    } else {
      setNewCategoryNameError('');
    }


    if (!isValid) return;

    setNewCategoryLoading(true);
    try {
      const trimmedName = newCategoryName.trim();
      const trimmedDescription = newCategoryDescription.trim();
      let res;

      if (newCategoryImageUri) {
        const formData = new FormData();
        formData.append('name', trimmedName);
        formData.append('description', trimmedDescription);

        const filename = newCategoryImageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        if (Platform.OS === 'web') {
          const imageRes = await fetch(newCategoryImageUri);
          const blob = await imageRes.blob();
          formData.append('image', blob, filename || 'upload.jpg');
        } else {
          formData.append('image', { uri: newCategoryImageUri, name: filename, type });
        }

        res = await axios.post(`${API_BASE_URL}/api/categories`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        });
      } else {
        res = await axios.post(`${API_BASE_URL}/api/categories`, {
          name: trimmedName,
          description: trimmedDescription,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000
        });
      }

      setCategories((prev) => [res.data, ...prev]);
      setCategoryIds((prev) => (prev.includes(res.data._id) ? prev : [...prev, res.data._id]));
      resetNewCategoryForm();
      setCategoryModalVisible(false);
      showAlert('Success', 'Category created!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create category';
      if (msg.toLowerCase().includes('already have a category')) {
        setNewCategoryNameError(msg);
      }
      showAlert('Error', msg, 'error');
    } finally {
      setNewCategoryLoading(false);
    }
  };

  const updateRecipe = async () => {
    let isValid = true;
    if (!title) { setTitleError('This field is required *'); isValid = false; } else setTitleError('');
    if (!cookTime) { setCookTimeError('This field is required *'); isValid = false; } else if (!/^\d+$/.test(cookTime)) { setCookTimeError('Please enter only numbers *'); isValid = false; } else setCookTimeError('');
    if (!categoryIds || categoryIds.length < 1) { setCategoryIdError('Select at least one category *'); isValid = false; } else setCategoryIdError('');
    if (!imageUri) { setImageUriError('This field is required *'); isValid = false; } else setImageUriError('');

    if (!isValid) return;

    setLoading(true);
    try {
      const ingredients = ingredientsText.split('\n').filter(i => i.trim() !== '');
      const steps = stepsText.split('\n').filter(s => s.trim() !== '');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('cookTime', cookTime);
      formData.append('servings', servings || 2);
      formData.append('categoryIds', JSON.stringify(categoryIds));
      formData.append('ingredients', JSON.stringify(ingredients));
      formData.append('steps', JSON.stringify(steps));

      if (imageUri !== recipe.photo) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        if (Platform.OS === 'web') {
          const res = await fetch(imageUri);
          const blob = await res.blob();
          formData.append('image', blob, filename || 'upload.jpg');
        } else {
          formData.append('image', { uri: imageUri, name: filename, type });
        }
      }

      await axios.put(`${API_BASE_URL}/api/recipes/${recipe._id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });

      showAlert('Success', 'Recipe Updated successfully!', 'success');
      
      // Navigate back to the Recipe details
      navigation.goBack();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update recipe';
      showAlert('Error', msg, 'error');
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
      <Modal transparent visible={categoryModalVisible} animationType="slide" onRequestClose={() => setCategoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Text style={styles.modalTitle}>Add Category</Text>

            <RequiredLabel label="Name" />
            <TextInput
              style={styles.input}
              placeholder="e.g. Breakfast"
              value={newCategoryName}
              onChangeText={(text) => { setNewCategoryName(text); setNewCategoryNameError(''); }}
            />
            {newCategoryNameError ? <Text style={styles.errorText}>{newCategoryNameError}</Text> : null}

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Short description"
              value={newCategoryDescription}
              onChangeText={setNewCategoryDescription}
              multiline
            />

            <TouchableOpacity style={styles.imgBtn} onPress={pickNewCategoryImage}>
              <Text style={styles.imgBtnText}>{newCategoryImageUri ? 'Change Image' : 'Pick Image (Optional)'}</Text>
            </TouchableOpacity>
            {newCategoryImageUri ? <Image source={{ uri: newCategoryImageUri }} style={styles.preview} /> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => { resetNewCategoryForm(); setCategoryModalVisible(false); }}
                disabled={newCategoryLoading}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.modalBtn]} onPress={submitNewCategory} disabled={newCategoryLoading}>
                {newCategoryLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={styles.header}>Edit Recipe</Text>
        
        <TouchableOpacity style={styles.imagePicker} onPress={() => { pickImage(); setImageUriError(''); }}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imagePlaceholder}>Tap to select a food photo*</Text>
          )}
        </TouchableOpacity>
        {imageUriError ? <Text style={styles.errorText}>{imageUriError}</Text> : null}

        <RequiredLabel label="Title" />
        <TextInput style={styles.input} value={title} onChangeText={(text) => { setTitle(text); setTitleError(''); }} placeholder="e.g. Grandma's Apple Pie" />
        {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, {height: 80}]} value={description} onChangeText={setDescription} placeholder="Briefly describe your dish" multiline />

        <View style={styles.row}>
          <View style={{flex:1, marginRight: 10}}>
            <RequiredLabel label="Cook Time" />
            <TextInput style={styles.input} value={cookTime} onChangeText={(text) => { setCookTime(text); setCookTimeError(''); }} placeholder="e.g. 45" keyboardType="numeric" />
            {cookTimeError ? <Text style={styles.errorText}>{cookTimeError}</Text> : null}
          </View>
          <View style={{flex:1}}>
            <Text style={styles.label}>Servings</Text>
            <TextInput style={styles.input} value={servings} onChangeText={setServings} placeholder="e.g. 4" keyboardType="numeric" />
          </View>
        </View>

        <RequiredLabel label="Categories" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          {categories.map(c => (
            <TouchableOpacity key={c._id} style={[styles.catPill, categoryIds.includes(c._id) && styles.catPillActive]} onPress={() => toggleCategory(c._id)}>
              <Text style={[styles.catText, categoryIds.includes(c._id) && styles.catTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {categoryIdError ? <Text style={styles.errorText}>{categoryIdError}</Text> : null}

        <TouchableOpacity style={styles.addCategoryBtn} onPress={() => setCategoryModalVisible(true)}>
          <Text style={styles.addCategoryBtnText}>+ Add Category</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Ingredients (one per line)</Text>
        <TextInput style={[styles.input, {height: 120}]} value={ingredientsText} onChangeText={setIngredientsText} placeholder="- 2 cups flour\n- 1 tsp salt" multiline textAlignVertical='top' />

        <Text style={styles.label}>Steps (one per line)</Text>
        <TextInput style={[styles.input, {height: 150}]} value={stepsText} onChangeText={setStepsText} placeholder="Mix ingredients.\nBake at 350F for 30 mins." multiline textAlignVertical='top' />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#ccc', flex: 1, marginRight: 10 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={updateRecipe} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>💾 Update</Text>}
          </TouchableOpacity>
        </View>
        
        <View style={{height: 100}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  scroll: { padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, marginTop: 40, color: '#333' },
  imagePicker: { height: 200, backgroundColor: '#eee', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { color: '#888', fontWeight: 'bold' },
  label: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 8, marginTop: 10 },
  required: { color: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: 4, marginBottom: 4, marginLeft: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 16 },
  row: { flexDirection: 'row' },
  catRow: { flexDirection: 'row', marginBottom: 15 },
  catPill: { backgroundColor: '#eee', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  catPillActive: { backgroundColor: '#e67e22' },
  catText: { color: '#666', fontWeight: 'bold' },
  catTextActive: { color: '#fff' },
  addCategoryBtn: { backgroundColor: '#fff7ee', borderColor: '#f2c9a5', borderWidth: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  addCategoryBtnText: { color: '#e67e22', fontWeight: 'bold' },
  btn: { backgroundColor: '#e67e22', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalBtn: { marginTop: 0, flex: 1 },
  modalCancelBtn: { backgroundColor: '#999' },
  imgBtn: { backgroundColor: '#eef2f5', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  imgBtnText: { color: '#e67e22', fontWeight: 'bold' },
  preview: { width: '100%', height: 100, borderRadius: 8, marginBottom: 10, resizeMode: 'cover' }
});
