import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { createContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../constants/api';

export const AuthContext = createContext();

const API_URL = `${API_BASE_URL}/api/auth`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const register = async (firstName, lastName, contactNumber, email, password) => {
    const res = await axios.post(`${API_URL}/register`, { firstName, lastName, contactNumber, email, password });
    return res.data;
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    setUser(res.data);
    setToken(res.data.token);
    await AsyncStorage.setItem('token', res.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(res.data));
    return res.data;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  const updateUserContext = async (userData) => {
    setUser(userData);
    setToken(userData.token);
    await AsyncStorage.setItem('token', userData.token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
};