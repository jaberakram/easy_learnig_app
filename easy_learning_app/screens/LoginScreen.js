// screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useAuth } from '../context/AuthContext'; 
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

// ওয়েব ব্রাউজার সেশন হ্যান্ডেল করার জন্য
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, googleLoginBackend } = useAuth();

  // --- Google Login Request Setup ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '704239013112-vrs39v5q4er722m2hahrlc15qsst856t.apps.googleusercontent.com',
    webClientId: '704239013112-7qgsod3v4e1o4pngsihqcvk1i6a47q0f.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      // টোকেন পাওয়ার পর ব্যাকএন্ডে পাঠানো
      handleGoogleLogin(authentication.accessToken);
    }
  }, [response]);

  const handleGoogleLogin = async (token) => {
    setLoading(true);
    try {
      await googleLoginBackend(token);
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) { 
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে সব ফিল্ড পূরণ করুন।');
      return;
    }
    setLoading(true);
    await login(email, password); 
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>স্বাগতম!</Text>
      <Text style={styles.subtitle}>অনুগ্রহ করে লগইন করুন</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email (ইমেইল)" 
        value={email}
        onChangeText={setEmail} 
        autoCapitalize="none"
        keyboardType="email-address" 
      />
      <TextInput
        style={styles.input}
        placeholder="Password (পাসওয়ার্ড)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={loading} 
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" /> 
        ) : (
          <Text style={styles.buttonText}>লগইন করুন</Text>
        )}
      </TouchableOpacity>
      
      {/* --- Google Login Button --- */}
      <TouchableOpacity 
        style={styles.googleButton} 
        disabled={!request || loading}
        onPress={() => promptAsync()}
      >
        <Ionicons name="logo-google" size={20} color="white" style={{ marginRight: 10 }} />
        <Text style={styles.buttonText}>Google দিয়ে লগইন করুন</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>একাউন্ট নেই? রেজিস্ট্রেশন করুন</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#ffffff' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 18, color: 'gray', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#f0f0f0', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 8, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#007bff', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10, minHeight: 58, justifyContent: 'center' },
  googleButton: { 
    backgroundColor: '#DB4437', 
    padding: 18, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 15, 
    minHeight: 58, 
    justifyContent: 'center',
    flexDirection: 'row' 
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#007bff', textAlign: 'center', marginTop: 20, fontSize: 16 },
});