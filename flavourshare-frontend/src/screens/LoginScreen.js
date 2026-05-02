import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';

const RequiredLabel = ({ label }) => (
  <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
);

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { showAlert } = useContext(ModalContext);

  const handleLogin = async () => {
    let isValid = true;
    if (!email) { setEmailError('This field is required *'); isValid = false; } else setEmailError('');
    if (!password) { setPasswordError('This field is required *'); isValid = false; } else setPasswordError('');
    
    if (!isValid) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🍽️ FlavourShare</Text>
          <Text style={styles.subtitle}>Welcome Back!</Text>
        </View>

        <View style={styles.form}>
          <RequiredLabel label="Email Address" />
          <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#999" value={email} onChangeText={(text) => { setEmail(text); setEmailError(''); }} keyboardType="email-address" autoCapitalize="none" />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          
          <RequiredLabel label="Password" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" value={password} onChangeText={(text) => { setPassword(text); setPasswordError(''); }} secureTextEntry />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footer}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Register</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 36, fontWeight: '800', color: '#e67e22', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#666', fontWeight: '500' },
  form: { backgroundColor: '#fff', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, marginBottom: 24 },
  label: { fontSize: 13, color: '#444', marginBottom: 6, fontWeight: '600', marginLeft: 4 },
  required: { color: '#e74c3c' },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: -12, marginBottom: 12, marginLeft: 8 },
  input: { backgroundColor: '#f5f6f8', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, color: '#333' },
  button: { backgroundColor: '#e67e22', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: '#e67e22', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  footer: { alignItems: 'center' },
  linkText: { color: '#666', fontSize: 15 },
  linkHighlight: { color: '#e67e22', fontWeight: '600' }
});