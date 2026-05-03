import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, TextInput, Alert, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { useIsFocused } from '@react-navigation/native';
import { API_BASE_URL } from '../constants/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const RequiredLabel = ({ label }) => (
  <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
);

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipeId } = route.params;
  const { token, user } = useContext(AuthContext);
  const { showAlert, showConfirm } = useContext(ModalContext);
  const [recipe, setRecipe] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [commentError, setCommentError] = useState('');
  const [ratingError, setRatingError] = useState('');

  // Meal plan modal state
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dayError, setDayError] = useState('');
  const [slotError, setSlotError] = useState('');
  const [mealNote, setMealNote] = useState('');

  // Edit review state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editPhotoUri, setEditPhotoUri] = useState(null);
  const [editCommentError, setEditCommentError] = useState('');
  const [editRatingError, setEditRatingError] = useState('');

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [recipeId, isFocused]);

  const fetchData = async () => {
    try {
      // Parallel requests
      const [recRes, revRes, saveRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/recipes/${recipeId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/reviews/recipe/${recipeId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/saved`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRecipe(recRes.data);
      setReviews(revRes.data);
      
      const savedRecord = saveRes.data.find(s => s.recipeId && s.recipeId._id === recipeId);
      if (savedRecord) {
        setIsSaved(true);
        setSavedRecordId(savedRecord._id);
      } else {
        setIsSaved(false);
        setSavedRecordId(null);
      }
    } catch (err) {
      console.log('Error fetching detail data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async () => {
    try {
      if (isSaved && savedRecordId) {
        await axios.delete(`${API_BASE_URL}/api/saved/${savedRecordId}`, { headers: { Authorization: `Bearer ${token}` } });
        setIsSaved(false);
        setSavedRecordId(null);
        showAlert('Success', 'Removed from Favourites', 'success');
      } else {
        navigation.navigate('SaveRecipe', { recipeId });
      }
    } catch (err) {
      console.log('Error toggling save', err);
    }
  };

  const pickReviewPhoto = async (isEdit = false) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      if (isEdit) setEditPhotoUri(result.assets[0].uri);
      else setPhotoUri(result.assets[0].uri);
    }
  };

  const getFormDataImage = async (uri) => {
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;
    
    if (Platform.OS === 'web') {
      const res = await fetch(uri);
      const blob = await res.blob();
      return { blob, filename: filename || 'upload.jpg' };
    }
    return { uri, name: filename, type };
  };

  const postReview = async () => {
    let isValid = true;
    if (!rating) {
      setRatingError('This field is required *');
      isValid = false;
    } else {
      setRatingError('');
    }
    if (!comment.trim()) {
      setCommentError('This field is required *');
      isValid = false;
    } else {
      setCommentError('');
    }
    if (!isValid) return;

    try {
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('comment', comment);
      
      if (photoUri && !photoUri.startsWith(API_BASE_URL)) {
        const imageFile = await getFormDataImage(photoUri);
        if (Platform.OS === 'web') formData.append('photo', imageFile.blob, imageFile.filename);
        else formData.append('photo', imageFile);
      }

      await axios.post(`${API_BASE_URL}/api/reviews/recipe/${recipeId}`, formData, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } 
      });
      setComment('');
      setRating(5);
      setPhotoUri(null);
      // Refresh
      fetchData();
      showAlert('Success', 'Review posted!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error posting review';
      showAlert('Error', msg, 'error');
    }
  };

  const addToMealPlan = async () => {
    let isValid = true;
    if (!selectedDay) { setDayError('This field is required *'); isValid = false; } else { setDayError(''); }
    if (!selectedSlot) { setSlotError('This field is required *'); isValid = false; } else { setSlotError(''); }
    if (!isValid) return;

    try {
      await axios.post(`${API_BASE_URL}/api/mealplans/assign`, {
        recipeId,
        day: selectedDay,
        mealType: selectedSlot,
        personalNote: mealNote
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMealModalVisible(false);
      setMealNote('');
      showAlert('Success', 'Added to Meal Plan!', 'success');
    } catch(err) {
      console.log(err);
      showAlert('Error', 'Failed to add to meal plan', 'error');
    }
  };

  const openEditModal = (rev) => {
    setEditingReviewId(rev._id);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
    setEditPhotoUri(rev.photo || null);
    setEditCommentError('');
    setEditRatingError('');
    setEditModalVisible(true);
  };

  const updateReview = async () => {
    let isValid = true;
    if (!editRating) {
      setEditRatingError('This field is required *');
      isValid = false;
    } else {
      setEditRatingError('');
    }
    if (!editComment.trim()) {
      setEditCommentError('This field is required *');
      isValid = false;
    } else {
      setEditCommentError('');
    }
    if (!isValid) return;

    try {
      const formData = new FormData();
      formData.append('rating', editRating);
      formData.append('comment', editComment);
      
      if (editPhotoUri && !editPhotoUri.startsWith(API_BASE_URL)) {
        const imageFile = await getFormDataImage(editPhotoUri);
        if (Platform.OS === 'web') formData.append('photo', imageFile.blob, imageFile.filename);
        else formData.append('photo', imageFile);
      }

      await axios.put(`${API_BASE_URL}/api/reviews/${editingReviewId}`, formData, 
        { headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      setEditModalVisible(false);
      fetchData();
      showAlert('Success', 'Review updated!', 'success');
    } catch (err) {
      showAlert('Error', 'Failed to update review', 'error');
    }
  };

  const deleteReview = async (revId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/reviews/${revId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
      showAlert('Success', 'Review deleted!', 'success');
    } catch (err) {
      showAlert('Error', 'Failed to delete review', 'error');
    }
  };

  const handleDeleteRecipe = () => {
    showConfirm("Delete Recipe", "Are you sure you want to delete this recipe?", confirmDeleteRecipe);
  };

  const confirmDeleteRecipe = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/recipes/${recipeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert("Success", "Recipe deleted!", "success");
      navigation.navigate('HomeScreen');
    } catch(err) {
      showAlert("Error", "Could not delete recipe", "error");
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#e67e22" /></View>;
  if (!recipe) return <View style={styles.centered}><Text>Recipe not found</Text></View>;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <Modal visible={mealModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Text style={styles.modalTitle}>Add to Meal Plan</Text>
            
            <RequiredLabel label="Day" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 5, maxHeight: 40}}>
              {DAYS.map(d => (
                <TouchableOpacity key={d} style={[styles.pill, selectedDay === d && styles.pillActive]} onPress={() => { setSelectedDay(selectedDay === d ? null : d); setDayError(''); }}>
                  <Text style={[styles.pillText, selectedDay === d && styles.pillTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {dayError ? <Text style={styles.errorText}>{dayError}</Text> : null}

            <RequiredLabel label="Slot" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 5, maxHeight: 40}}>
              {SLOTS.map(s => (
                <TouchableOpacity key={s} style={[styles.pill, selectedSlot === s && styles.pillActive]} onPress={() => { setSelectedSlot(selectedSlot === s ? null : s); setSlotError(''); }}>
                  <Text style={[styles.pillText, selectedSlot === s && styles.pillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {slotError ? <Text style={styles.errorText}>{slotError}</Text> : null}

            <Text style={styles.label}>Note (Optional)</Text>
            <TextInput style={styles.input} value={mealNote} onChangeText={setMealNote} placeholder="e.g. Needs extra salt" />

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
              <TouchableOpacity style={[styles.btn, {backgroundColor: '#ccc', flex: 1, marginRight: 10}]} onPress={() => setMealModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, {flex: 1}]} onPress={addToMealPlan}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Text style={styles.modalTitle}>Edit Review</Text>
            
            <RequiredLabel label="Your Rating (1-5)" />
            <View style={styles.ratingRow}>
              {[1,2,3,4,5].map(v => (
                <TouchableOpacity key={v} onPress={() => { setEditRating(editRating === v ? 0 : v); setEditRatingError(''); }} style={[styles.starBtn, editRating === v && styles.starBtnActive]}>
                  <Text style={[styles.starText, editRating === v && styles.starTextActive]}>{v} ⭐</Text>
                </TouchableOpacity>
              ))}
            </View>
            {editRatingError ? <Text style={styles.errorText}>{editRatingError}</Text> : null}
            <RequiredLabel label="Review Comment" />
            <TextInput style={styles.input} value={editComment} onChangeText={(txt) => { setEditComment(txt); setEditCommentError(''); }} multiline />
            {editCommentError ? <Text style={styles.errorText}>{editCommentError}</Text> : null}
            
            <TouchableOpacity onPress={() => pickReviewPhoto(true)} style={[styles.btn, { backgroundColor: '#eef2f5', marginBottom: 15 }]}>
              <Text style={{color: '#e67e22', fontWeight: 'bold'}}>{editPhotoUri ? 'Change Photo' : 'Add Photo (Optional)'}</Text>
            </TouchableOpacity>
            {editPhotoUri && <Image source={{ uri: editPhotoUri }} style={{ width: '100%', height: 100, borderRadius: 8, marginBottom: 15, resizeMode: 'cover' }} />}

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
              <TouchableOpacity style={[styles.btn, {backgroundColor: '#ccc', flex: 1, marginRight: 10}]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, {flex: 1}]} onPress={updateReview}>
                <Text style={styles.btnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Image source={{ uri: recipe.photo }} style={styles.image} />
        
        <View style={styles.headerRow}>
          <Text style={styles.title}>{recipe.title}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity onPress={() => setMealModalVisible(true)} style={{marginRight: 15}}>
              <Ionicons name="calendar-outline" size={28} color="#e67e22" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleSave}>
              <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={28} color="#e67e22" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>👤 {recipe.author?.firstName || 'Unknown User'}</Text>
          <Text style={styles.metaText}>⏱️ {recipe.cookTime}</Text>
          <Text style={styles.metaText}>⭐ {recipe.rating}</Text>
          <Text style={styles.metaText}>🍲 {recipe.servings} Servings</Text>
        </View>

        {user && recipe.author && user._id === recipe.author._id && (
          <View style={{flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, justifyContent: 'flex-start'}}>
            <TouchableOpacity style={[styles.btn, {paddingVertical: 8, paddingHorizontal: 15, marginRight: 10, borderRadius: 20}]} onPress={() => navigation.navigate('EditRecipe', { recipe })}>
               <Text style={[styles.btnText, {fontSize: 14}]}>Edit Recipe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, {paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#e74c3c', borderRadius: 20}]} onPress={handleDeleteRecipe}>
               <Text style={[styles.btnText, {fontSize: 14}]}>Delete Recipe</Text>
            </TouchableOpacity>
          </View>
        )}

        {recipe.description && <Text style={styles.description}>{recipe.description}</Text>}

        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients && recipe.ingredients.map((ing, idx) => (
          <Text key={idx} style={styles.listItem}>• {ing}</Text>
        ))}

        <Text style={styles.sectionTitle}>Steps</Text>
        {recipe.steps && recipe.steps.map((step, idx) => (
          <Text key={idx} style={styles.listItem}>{idx + 1}. {step}</Text>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
        
        <View style={styles.reviewForm}>
          <RequiredLabel label="Your Rating (1-5)" />
          <View style={styles.ratingRow}>
            {[1,2,3,4,5].map(v => (
              <TouchableOpacity key={v} onPress={() => { setRating(rating === v ? 0 : v); setRatingError(''); }} style={[styles.starBtn, rating === v && styles.starBtnActive]}>
                <Text style={[styles.starText, rating === v && styles.starTextActive]}>{v} ⭐</Text>
              </TouchableOpacity>
            ))}
          </View>
          {ratingError ? <Text style={styles.errorText}>{ratingError}</Text> : null}
          
          <RequiredLabel label="Review Comment" />
          <TextInput style={styles.input} placeholder="Share your experience..." value={comment} onChangeText={(txt) => { setComment(txt); setCommentError(''); }} multiline />
          {commentError ? <Text style={styles.errorText}>{commentError}</Text> : null}
          
          <TouchableOpacity onPress={() => pickReviewPhoto(false)} style={[styles.btn, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', marginBottom: 15 }]}>
            <Text style={{color: '#666', fontWeight: 'bold'}}>{photoUri ? 'Change Photo' : '📷 Add a Photo'}</Text>
          </TouchableOpacity>
          {photoUri && <Image source={{ uri: photoUri }} style={{ width: '100%', height: 100, borderRadius: 8, marginBottom: 15, resizeMode: 'cover' }} />}

          <TouchableOpacity style={styles.btn} onPress={postReview}>
            <Text style={styles.btnText}>Post Review</Text>
          </TouchableOpacity>
        </View>

        {reviews.map(rev => (
          <View key={rev._id} style={styles.reviewCard}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={styles.reviewAuthor}>{rev.user?.firstName || 'User'}</Text>
              {user && rev.user?._id === user._id && (
                <View style={{flexDirection: 'row'}}>
                  <TouchableOpacity onPress={() => openEditModal(rev)} style={{marginRight: 15}}>
                    <Ionicons name="pencil-outline" size={20} color="#555" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteReview(rev._id)}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={styles.reviewRating}>{"⭐".repeat(rev.rating)}</Text>
            <Text style={styles.reviewComment}>{rev.comment}</Text>
            {rev.photo && <Image source={{ uri: rev.photo }} style={{ width: 120, height: 120, borderRadius: 8, marginTop: 10, resizeMode: 'cover' }} />}
          </View>
        ))}
        
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 300, resizeMode: 'cover' },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 25, zIndex: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold',flex: 1, color: '#222' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginBottom: 15 },
  metaText: { backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginRight: 10, marginBottom: 10, color: '#555', fontWeight: 'bold' },
  description: { paddingHorizontal: 20, fontSize: 16, color: '#444', marginBottom: 20, lineHeight: 24 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', paddingHorizontal: 20, marginTop: 10, marginBottom: 15, color: '#333' },
  listItem: { paddingHorizontal: 20, fontSize: 16, color: '#444', marginBottom: 8, lineHeight: 24 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20, marginHorizontal: 20 },
  reviewForm: { padding: 20, backgroundColor: '#f9f9f9', margin: 20, borderRadius: 12 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 10 },
  required: { color: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: -10, marginBottom: 15, marginLeft: 5 },
  ratingRow: { flexDirection: 'row', marginBottom: 15, justifyContent: 'space-between' },
  starBtn: { padding: 8, borderRadius: 8, backgroundColor: '#eee', flex: 1, alignItems: 'center', marginHorizontal: 2 },
  starBtnActive: { backgroundColor: '#e67e22' },
  starText: { fontSize: 14, color: '#555', fontWeight: 'bold' },
  starTextActive: { color: '#fff' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, height: 80, textAlignVertical: 'top', marginBottom: 15 },
  btn: { backgroundColor: '#e67e22', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  reviewCard: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  reviewAuthor: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  reviewRating: { marginVertical: 4 },
  reviewComment: { color: '#555', fontSize: 15, lineHeight: 22, marginTop: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  pill: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#eee', borderRadius: 20, marginRight: 10 },
  pillActive: { backgroundColor: '#e67e22' },
  pillText: { color: '#555', fontWeight: 'bold' },
  pillTextActive: { color: '#fff' }
});


