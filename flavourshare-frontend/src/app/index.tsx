import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { ModalProvider } from '../context/ModalContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HomeScreen from '../screens/HomeScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import AddRecipeScreen from '../screens/AddRecipeScreen';
import EditRecipeScreen from '../screens/EditRecipeScreen';
import FavouritesScreen from '../screens/FavouritesScreen';
import MealPlanScreen from '../screens/MealPlanScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import CategoryDetailScreen from '../screens/CategoryDetailScreen';
import AssignRecipeScreen from '../screens/AssignRecipeScreen';
import PlanDetailScreen from '../screens/PlanDetailScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
import CreateEditListScreen from '../screens/CreateEditListScreen';
import CollectionDetailScreen from '../screens/CollectionDetailScreen';
import SaveRecipeScreen from '../screens/SaveRecipeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LandingSplash() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true
      })
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.splashContainer}>
      <Animated.View
        style={[
          styles.splashContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.splashLogo}>
          <Ionicons name="restaurant" size={44} color="#fff" />
        </View>
        <Text style={styles.splashTitle}>FlavourShare</Text>
        <Text style={styles.splashSubtitle}>Plan, cook, save, and share your favourites.</Text>
        <ActivityIndicator color="#e67e22" style={styles.splashLoader} />
      </Animated.View>
    </View>
  );
}

function ProfileStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

function HomeStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="EditRecipe" component={EditRecipeScreen} />
      <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
      <Stack.Screen name="SaveRecipe" component={SaveRecipeScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function MealPlanStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MealPlanMain" component={MealPlanScreen} />
      <Stack.Screen name="AssignRecipe" component={AssignRecipeScreen} />
      <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="SaveRecipe" component={SaveRecipeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditRecipe" component={EditRecipeScreen} />
    </Stack.Navigator>
  );
}

function ShoppingStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ShoppingListMain" component={ShoppingListScreen} />
      <Stack.Screen name="ListDetail" component={ListDetailScreen} />
      <Stack.Screen name="CreateEditList" component={CreateEditListScreen} />
    </Stack.Navigator>
  );
}

function FavouritesStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FavouritesMain" component={FavouritesScreen} />
      <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="SaveRecipe" component={SaveRecipeScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home-outline';
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'MealPlan') iconName = 'calendar-outline';
          else if (route.name === 'Add') iconName = 'add-circle-outline';
          else if (route.name === 'Shopping') iconName = 'cart-outline';
          else if (route.name === 'Favourites') iconName = 'heart-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e67e22',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        tabBarLabelStyle: { fontSize: 12, paddingBottom: 5 }
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen name="MealPlan" component={MealPlanStackScreen} options={{ tabBarLabel: 'Plan' }} />
      <Tab.Screen name="Add" component={AddRecipeScreen} options={{ tabBarLabel: 'Post' }} />
      <Tab.Screen name="Shopping" component={ShoppingStackScreen} options={{ tabBarLabel: 'Lists' }} />
      <Tab.Screen name="Favourites" component={FavouritesStackScreen} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useContext(AuthContext);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash || loading) {
    return <LandingSplash />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ModalProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ModalProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff8f1',
    paddingHorizontal: 32
  },
  splashContent: {
    alignItems: 'center'
  },
  splashLogo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e67e22',
    shadowColor: '#e67e22',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 24
  },
  splashTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#2f2a24',
    textAlign: 'center'
  },
  splashSubtitle: {
    fontSize: 15,
    color: '#6f6257',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 300
  },
  splashLoader: {
    marginTop: 28
  }
});
