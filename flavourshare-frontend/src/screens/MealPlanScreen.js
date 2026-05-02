import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../constants/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function MealPlanScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPlan();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/mealplans`, { headers: { Authorization: `Bearer ${token}` } });
      setPlan(res.data);
    } catch (err) {
      console.log('Error fetching meal plan', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadBanner = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      if (Platform.OS === 'web') {
        const resFlow = await fetch(uri);
        const blob = await resFlow.blob();
        formData.append('banner', blob, filename || 'banner.jpg');
      } else {
        formData.append('banner', { uri, name: filename, type });
      }

      setLoading(true);
      try {
        const res = await axios.post(`${API_BASE_URL}/api/mealplans/upload-banner`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setPlan(res.data);
      } catch (err) {
        console.log('Error uploading banner', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getSlotRecord = (day, slot) => {
    if (!plan || !plan.slots) return null;
    return plan.slots.find(s => s.day === day && s.mealType === slot);
  };

  if (loading && !plan) return <View style={styles.centered}><ActivityIndicator size="large" color="#e67e22" /></View>;

  return (
    <View style={styles.container}>
      {/* Banner Header */}
      <View style={styles.bannerContainer}>
        {plan?.bannerImage ? (
          <Image source={{ uri: plan.bannerImage }} style={styles.bannerImage} />
        ) : (
          <View style={[styles.bannerImage, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={40} color="#999" />
            <Text style={{color: '#999', marginTop: 5}}>No Banner Uploaded</Text>
          </View>
        )}
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>This Week's Plan</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={uploadBanner}>
            <Ionicons name="camera-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {DAYS.map(day => (
          <View key={day} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day}</Text>
            {SLOTS.map(slot => {
              const slotRecord = getSlotRecord(day, slot);
              return (
                <View key={slot} style={styles.slotRow}>
                  <Text style={styles.slotTitle}>{slot}</Text>
                  {slotRecord && slotRecord.recipe ? (
                    <TouchableOpacity 
                      style={styles.planItem} 
                      onPress={() => navigation.navigate('PlanDetail', { slotRecord, day, slot })}>
                      <Image source={{ uri: slotRecord.recipe.photo }} style={styles.slotThumb} />
                      <View style={{flex: 1}}>
                        <Text style={styles.planRecipe} numberOfLines={1}>{slotRecord.recipe.title}</Text>
                        {slotRecord.personalNote ? <Text style={styles.planNote} numberOfLines={1}>{slotRecord.personalNote}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.emptySlot} 
                      onPress={() => navigation.navigate('AssignRecipe', { day, slot })}>
                      <Ionicons name="add" size={20} color="#e67e22" />
                      <Text style={styles.emptyText}>Add Recipe</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ))}
        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bannerContainer: { width: '100%', height: 200, position: 'relative' },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  bannerBtn: { backgroundColor: 'rgba(255,255,255,0.3)', padding: 10, borderRadius: 20 },
  scroll: { padding: 20 },
  dayCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  dayTitle: { fontSize: 20, fontWeight: 'bold', color: '#e67e22', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  slotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  slotTitle: { width: 80, fontSize: 14, fontWeight: 'bold', color: '#666' },
  planItem: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2f5', padding: 8, borderRadius: 8 },
  slotThumb: { width: 40, height: 40, borderRadius: 6, marginRight: 10 },
  planRecipe: { fontWeight: 'bold', color: '#333', fontSize: 14 },
  planNote: { fontSize: 12, color: '#666', marginTop: 2, fontStyle: 'italic' },
  emptySlot: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf3ea', borderWidth: 1, borderColor: '#f7dcc1', borderStyle: 'dashed', padding: 10, borderRadius: 8 },
  emptyText: { color: '#e67e22', fontWeight: 'bold', marginLeft: 5 }
});


