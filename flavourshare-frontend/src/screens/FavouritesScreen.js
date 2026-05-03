import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../constants/api';

export default function FavouritesScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [collections, setCollections] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [collRes, savedRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/collections`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/saved`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCollections(collRes.data);
      // Grouping logic or simply render all saved recipes and their collection info
      setSavedRecipes(savedRes.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const removeSaved = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/saved/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
    } catch (err) {
      console.log(err);
    }
  };

  const renderRecipeItem = ({ item }) => {
    const rc = item.recipeId;
    if (!rc) return null;
    const collectionName = item.collectionId ? item.collectionId.name : 'Uncategorized';
    
    return (
      <View style={styles.card}>
        <TouchableOpacity style={{flexDirection: 'row', flex: 1}} onPress={() => navigation.navigate('RecipeDetail', { recipeId: rc._id })}>
          <Image source={{ uri: rc.photo }} style={styles.image} />
          <View style={styles.info}>
            <Text style={styles.title}>{rc.title}</Text>
            <View style={styles.collectionBadge}>
              <Ionicons name="folder-outline" size={14} color="#e67e22" />
              <Text style={styles.collectionBadgeText}>{collectionName}</Text>
            </View>
            <Text style={styles.meta}>⏱️ {rc.cookTime}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => removeSaved(item._id)}>
            <Ionicons name="trash" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCollectionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.collectionCard} 
      onPress={() => navigation.navigate('CollectionDetail', { collectionId: item._id })}
    >
       {item.image ? (
          <Image source={{ uri: item.image }} style={styles.collectionImage} />
       ) : (
          <View style={[styles.collectionImage, {backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center'}]}>
            <Ionicons name="folder" size={32} color="#ccc" />
          </View>
       )}
       <View style={styles.collectionOverlay}>
         <Text style={styles.collectionTitle} numberOfLines={1}>{item.name}</Text>
       </View>
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#e67e22" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Favourites</Text>
      
      <View>
        <Text style={styles.sectionTitle}>Collections</Text>
        {collections.length === 0 ? (
          <Text style={styles.emptyText}>No collections created yet.</Text>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={collections}
            keyExtractor={item => item._id}
            renderItem={renderCollectionItem}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
          />
        )}
      </View>

      <Text style={[styles.sectionTitle, {marginTop: 10}]}>All Saved Recipes</Text>
      {savedRecipes.length === 0 ? (
        <View style={styles.centered}><Text style={styles.emptyText}>No saved recipes!</Text></View>
      ) : (
        <FlatList
          data={savedRecipes}
          keyExtractor={item => item._id}
          renderItem={renderRecipeItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          onRefresh={fetchData}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 28, fontWeight: 'bold', paddingTop: 60, paddingHorizontal: 20, color: '#333' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 20, marginVertical: 15, color: '#444' },
  emptyText: { fontSize: 16, color: '#999', paddingHorizontal: 20, fontStyle: 'italic' },
  
  collectionCard: { width: 140, height: 100, borderRadius: 12, marginRight: 15, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  collectionImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  collectionOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 5, paddingHorizontal: 10 },
  collectionTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' },
  image: { width: 100, height: 100 },
  info: { flex: 1, padding: 15, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 5 },
  meta: { fontSize: 12, color: '#666', marginTop: 5 },
  collectionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3e0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  collectionBadgeText: { color: '#e67e22', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  actions: { justifyContent: 'center', paddingRight: 15 },
  actionBtn: { padding: 5 }
});
