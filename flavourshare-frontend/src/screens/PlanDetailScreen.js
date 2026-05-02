import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';

export default function PlanDetailScreen({ route, navigation }) {
  const { slotRecord, day, slot } = route.params;
  const { token } = useContext(AuthContext);
  const { showAlert, showConfirm } = useContext(ModalContext);

  const clearSlot = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/mealplans/clear/${day}/${slot}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showAlert('Success', 'Slot cleared', 'success');
      navigation.goBack();
    } catch(err) {
      console.log('Error clearing slot', err);
      showAlert('Error', 'Failed to clear slot', 'error');
    }
  };

  const confirmClear = () => {
    showConfirm('Clear', 'Remove this recipe from your plan?', clearSlot);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{day} - {slot}</Text>
      </View>

      <Image source={{ uri: slotRecord.recipe.photo }} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.title}>{slotRecord.recipe.title}</Text>
        <Text style={styles.meta}>⏱️ {slotRecord.recipe.cookTime} • ⭐ {slotRecord.recipe.rating}</Text>
        
        {slotRecord.personalNote ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Personal Note:</Text>
            <Text style={styles.noteText}>{slotRecord.personalNote}</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          style={[styles.btn, styles.viewBtn]} 
          onPress={() => navigation.navigate('RecipeDetail', { recipeId: slotRecord.recipe._id })}
        >
          <Ionicons name="book-outline" size={20} color="#fff" style={{marginRight: 10}}/>
          <Text style={styles.btnText}>View Full Recipe</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.swapBtn]} 
          onPress={() => navigation.navigate('AssignRecipe', { day, slot })}
        >
          <Ionicons name="swap-horizontal" size={20} color="#fff" style={{marginRight: 10}}/>
          <Text style={styles.btnText}>Swap Recipe</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.clearBtn]} 
          onPress={confirmClear}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" style={{marginRight: 10}}/>
          <Text style={styles.btnText}>Clear Slot</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  image: { width: '100%', height: 250, resizeMode: 'cover' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 10 },
  meta: { fontSize: 14, color: '#666', marginBottom: 20 },
  noteBox: { backgroundColor: '#fdf3ea', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#f7dcc1' },
  noteLabel: { fontSize: 12, fontWeight: 'bold', color: '#e67e22', marginBottom: 5 },
  noteText: { fontSize: 14, color: '#555', fontStyle: 'italic' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10, marginBottom: 12 },
  viewBtn: { backgroundColor: '#3498db' },
  swapBtn: { backgroundColor: '#e67e22' },
  clearBtn: { backgroundColor: '#e74c3c' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
