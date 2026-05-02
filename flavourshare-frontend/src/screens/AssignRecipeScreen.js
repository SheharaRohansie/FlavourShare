import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';

export default function AssignRecipeScreen({ route, navigation }) {
  const { day, slot } = route.params;
  const { token } = useContext(AuthContext);
  const { showAlert } = useContext(ModalContext);
  
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/recipes`, { headers: { Authorization: `Bearer ${token}` } });
      setRecipes(res.data);
    } catch (err) {
      console.log('Error fetching recipes', err);
    } finally {
      setLoading(false);
    }
  };

  const assignRecipe = async (recipe) => {
    setAssigningId(recipe._id);
    try {
      await axios.post(`${API_BASE_URL}/api/mealplans/assign`, {
        day,
        mealType: slot,
        recipeId: recipe._id,
        personalNote: ''
      }, { headers: { Authorization: `Bearer ${token}` } });
      showAlert('Success', `Assigned to ${day} ${slot}`, 'success');
      
      navigation.navigate('MealPlanMain');
    } catch(err) {
      console.log('Error assigning recipe', err);
      showAlert('Error', 'Failed to assign recipe', 'error');
      setAssigningId(null);
    }
  };

  const filteredRecipes = recipes.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => assignRecipe(item)} disabled={assigningId !== null}>
      <Image source={{ uri: item.photo }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>⏱️ {item.cookTime} • ⭐ {item.rating}</Text>
      </View>
      {assigningId === item._id ? (
        <ActivityIndicator color="#e67e22" style={{marginRight: 15}} />
      ) : (
        <Ionicons name="add-circle" size={28} color="#e67e22" style={{marginRight: 15}}/>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign to {day} {slot}</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#e67e22" /></View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color:'#999'}}>No recipes found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2f5', margin: 20, borderRadius: 10, paddingHorizontal: 15 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 45, fontSize: 16, color: '#333' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' },
  image: { width: 80, height: 100 },
  info: { flex: 1, padding: 15, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 5 },
  meta: { fontSize: 12, color: '#666' }
});
