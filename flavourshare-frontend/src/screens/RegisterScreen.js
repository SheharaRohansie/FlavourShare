import { useContext, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { ModalContext } from '../context/ModalContext';

const RequiredLabel = ({ label }) => (
  <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
);

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [contactNumberError, setContactNumberError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const { register } = useContext(AuthContext);
  const { showAlert } = useContext(ModalContext);

  const validateEmail = () => {
    if (email && !email.includes('@')) {
      setEmailError('Email must include an "@" sign');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validateContactNumber = () => {
    const phoneRegex = /^[0-9]+$/;
    if (contactNumber && !phoneRegex.test(contactNumber)) {
      setContactNumberError('Contact number can only contain numbers');
      return false;
    }
    if (contactNumber && contactNumber.length !== 10) {
      setContactNumberError('Contact number must be exactly 10 digits');
      return false;
    }
    setContactNumberError('');
    return true;
  };

  const validatePassword = () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
    if (password && !passwordRegex.test(password)) {
      setPasswordError('Password must include a capital letter, a simple letter, a number, and a special sign');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleRegister = async () => {
    let isValid = true;
    
    if (!firstName) { setFirstNameError('This field is required *'); isValid = false; } else setFirstNameError('');
    if (!lastName) { setLastNameError('This field is required *'); isValid = false; } else setLastNameError('');
    if (!contactNumber) { setContactNumberError('This field is required *'); isValid = false; }
    if (!email) { setEmailError('This field is required *'); isValid = false; }
    if (!password) { setPasswordError('This field is required *'); isValid = false; }

    const isEmailValid = email ? validateEmail() : false;
    const isContactValid = contactNumber ? validateContactNumber() : false;
    const isPasswordValid = password ? validatePassword() : false;

    if (!isValid || !isEmailValid || !isContactValid || !isPasswordValid) return;

    setLoading(true);
    try {
      await register(firstName, lastName, contactNumber, email, password);
      showAlert('Success', 'Registration successful!', 'success');
      navigation.navigate('Login');
    } catch (err) {
      showAlert('Error', err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🍽️ FlavourShare</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>
        
        <View style={styles.form}>
          <RequiredLabel label="First Name" />
          <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#999" value={firstName} onChangeText={(text) => { setFirstName(text); setFirstNameError(''); }} />
          {firstNameError ? <Text style={styles.errorText}>{firstNameError}</Text> : null}
          
          <RequiredLabel label="Last Name" />
          <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#999" value={lastName} onChangeText={(text) => { setLastName(text); setLastNameError(''); }} />
          {lastNameError ? <Text style={styles.errorText}>{lastNameError}</Text> : null}
          
          <RequiredLabel label="Contact Number" />
          <TextInput style={styles.input} placeholder="Contact Number" placeholderTextColor="#999" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" onBlur={validateContactNumber} />
          {contactNumberError ? <Text style={styles.errorText}>{contactNumberError}</Text> : null}
          
          <RequiredLabel label="Email Address" />
          <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" onBlur={validateEmail} />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          
          <RequiredLabel label="Password" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry onBlur={validatePassword} />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Login</Text></Text>
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
  input: { backgroundColor: '#f5f6f8', borderWidth: 1, borderColor: '#e1e4e8', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, color: '#333' },
  button: { backgroundColor: '#e67e22', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: '#e67e22', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  errorText: { color: '#e74c3c', fontSize: 12, marginTop: -12, marginBottom: 12, marginLeft: 8 },
  footer: { alignItems: 'center' },
  linkText: { color: '#666', fontSize: 15 },
  linkHighlight: { color: '#e67e22', fontWeight: '600' }
});