import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';
import { API_BASE_URL } from '../constants/api';

export default function EditProfileScreen({ navigation }) {
  const { user, token, login, updateUserContext } = useContext(AuthContext);
  const { showAlert } = useContext(ModalContext);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!firstName || !lastName || !contactNumber) {
      return showAlert('Error', 'Please fill all fields', 'error');
    }
    if (password && password !== confirmPassword) {
      return showAlert('Error', 'Passwords do not match', 'error');
    }
    setLoading(true);
    try {
      const body = { firstName, lastName, contactNumber };
      if (password) body.password = password;

      const res = await axios.put(`${API_BASE_URL}/api/auth/profile`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await updateUserContext(res.data);

      showAlert('Success', 'Profile updated successfully!', 'success');
      navigation.goBack();
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <Text style={styles.title}>🍽️ FlavourShare</Text>
      <Text style={styles.subtitle}>Edit Profile</Text>

      <Text style={styles.label}>First Name</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Enter your first name"
      />

      <Text style={styles.label}>Last Name</Text>
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Enter your last name"
      />

      <Text style={styles.label}>Contact Number</Text>
      <TextInput
        style={styles.input}
        value={contactNumber}
        onChangeText={setContactNumber}
        placeholder="Enter your contact number"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>New Password (optional)</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Leave blank to keep current"
        secureTextEntry
      />

      <Text style={styles.label}>Confirm New Password</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm new password"
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Profile</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#e67e22', marginBottom: 8 },
  subtitle: { fontSize: 20, textAlign: 'center', marginBottom: 24, color: '#333' },
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 4, fontSize: 16 },
  button: { backgroundColor: '#e67e22', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { padding: 16, alignItems: 'center', marginTop: 8 },
  cancelText: { color: '#999', fontSize: 14 }
});
