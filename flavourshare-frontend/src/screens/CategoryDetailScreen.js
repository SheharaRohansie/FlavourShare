import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';

export default function CategoryDetailScreen({ route, navigation }) {
  const { categoryId } = route.params;
  const { token } = useContext(AuthContext);
  const { showAlert } = useContext(ModalContext);
  const [category, setCategory] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryDetail();
  }, [categoryId]);

  const fetchCategoryDetail = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categories/${categoryId}`);
      setCategory(res.data.category);
      setRecipes(res.data.recipes);
    } catch (err) {
      console.log('Error fetching category detail:', err);
      showAlert('Error', 'Error fetching category details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderRecipe = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('RecipeDetail', { recipeId: item._id })}>
      <Image source={{ uri: item.photo }} style={styles.recipeImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>⏱️ {item.cookTime}</Text>
          <Text style={styles.detailText}>⭐ {item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e67e22" />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.centered}>
        <Text>Category not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item._id}
        renderItem={renderRecipe}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            {category.image ? (
              <Image source={{ uri: category.image }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Text style={styles.placeholderText}>{category.name}</Text>
              </View>
            )}
            <View style={styles.headerContent}>
              <Text style={styles.title}>{category.name}</Text>
              {category.description ? <Text style={styles.description}>{category.description}</Text> : null}
              <Text style={styles.recipeCount}>{recipes.length} Recipes</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes under this category yet.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20 },
  header: { marginBottom: 20 },
  heroImage: { width: '100%', height: 250, resizeMode: 'cover' },
  heroPlaceholder: { width: '100%', height: 250, backgroundColor: '#eef2f5', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 32, fontWeight: 'bold', color: '#999' },
  headerContent: { padding: 20, backgroundColor: '#fff', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  description: { fontSize: 16, color: '#666', marginBottom: 10, lineHeight: 22 },
  recipeCount: { fontSize: 14, fontWeight: '600', color: '#e67e22' },
  listContainer: { paddingBottom: 40 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginHorizontal: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  recipeImage: { width: '100%', height: 200, resizeMode: 'cover' },
  cardInfo: { padding: 16 },
  recipeTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 8 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailText: { fontSize: 14, color: '#666', fontWeight: '500' }
});
