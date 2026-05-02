import React, { useContext } from 'react';
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
  const { user } = useContext(AuthContext);
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