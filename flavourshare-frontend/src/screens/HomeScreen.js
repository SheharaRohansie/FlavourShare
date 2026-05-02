import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, ImageBackground } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../constants/api';

export default function HomeScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryIds, setCategoryIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [search, categoryIds])
  );

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/categories`);
      setCategories(res.data);
    } catch(err) {
      console.log('Error fetching categories');
    }
  };

  const toggleCategory = (id) => {
    setCategoryIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const params = { search };
      if (categoryIds.length > 0) {
        params.categoryIds = categoryIds.join(',');
      }

      const res = await axios.get(`${API_BASE_URL}/api/recipes`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecipes(res.data);
    } catch (err) {
      console.log('Error fetching recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (item) => {
    const ids = item.categoryIds || (item.category ? [item.category] : []);
    const names = ids
      .map((id) => categories.find((c) => c._id === id)?.name)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Uncategorized';
  };

  const renderRecipe = ({ item }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('RecipeDetail', { recipeId: item._id })}>
      <Image source={{ uri: item.photo }} style={styles.image} />
      <View style={styles.cardInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>⏱️ {item.cookTime}</Text>
          <Text style={styles.detailText}>⭐ {item.rating}</Text>
        </View>
        <Text style={styles.categoryBadge}>{getCategoryLabel(item)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Recipes</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search recipes..." 
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          <TouchableOpacity
            key="all"
            style={[styles.categoryPillContainer, categoryIds.length === 0 && styles.categoryPillContainerActive]}
            onPress={() => setCategoryIds([])}
          >
            <View style={[styles.categoryPill, categoryIds.length === 0 && styles.categoryPillActive]}>
              <Text style={[styles.categoryText, categoryIds.length === 0 && styles.categoryTextActive]}>All</Text>
            </View>
          </TouchableOpacity>

          {categories.map(cat => (
            <TouchableOpacity 
              key={cat._id}
              style={[styles.categoryPillContainer, categoryIds.includes(cat._id) && styles.categoryPillContainerActive]}
              onPress={() => toggleCategory(cat._id)}
              onLongPress={() => navigation.navigate('CategoryDetail', { categoryId: cat._id })}
              delayLongPress={400}
            >
              {cat.image ? (
                <ImageBackground 
                  source={{ uri: cat.image }} 
                  style={styles.categoryPillBg} 
                  imageStyle={styles.categoryPillImageStyle}
                >
                  <View style={styles.pillBgOverlay}>
                    <Text style={[styles.categoryText, { color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 3, textShadowOffset: {width: 1, height: 1} }]}>{cat.name}</Text>
                  </View>
                </ImageBackground>
              ) : (
                <View style={[styles.categoryPill, categoryIds.includes(cat._id) && styles.categoryPillActive]}>
                  <Text style={[styles.categoryText, categoryIds.includes(cat._id) && styles.categoryTextActive]}>{cat.name}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e67e22" />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No recipes found.</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item._id}
          renderItem={renderRecipe}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#333' },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#fff' },
  searchInput: { backgroundColor: '#f5f6f8', borderRadius: 12, padding: 14, fontSize: 16, color: '#333' },
  categoriesContainer: { backgroundColor: '#fff', paddingBottom: 10 },
  categoriesScroll: { paddingHorizontal: 15 },
  categoryPillContainer: { marginHorizontal: 5, borderRadius: 20, overflow: 'hidden' },
  categoryPillContainerActive: { borderWidth: 2, borderColor: '#e67e22' },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  categoryPillActive: { backgroundColor: '#e67e22' },
  categoryPillBg: { minWidth: 80, justifyContent: 'center', alignItems: 'center' },
  categoryPillImageStyle: { borderRadius: 20 },
  pillBgOverlay: { backgroundColor: 'rgba(0,0,0,0.3)', width: '100%', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  categoryText: { color: '#666', fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  listContainer: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  image: { width: '100%', height: 200, resizeMode: 'cover' },
  cardInfo: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 8 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailText: { fontSize: 14, color: '#666', fontWeight: '500' },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#eef2f5', color: '#555', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontSize: 12, fontWeight: '600', overflow: 'hidden' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' }
});
