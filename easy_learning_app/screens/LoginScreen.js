// screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext'; 

// --- Expo-এর গুগল লগইন ইম্পোর্ট করুন ---
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, googleLogin } = useAuth(); // AuthContext থেকে ফাংশন নিন

  // --- (সঠিক) Expo গুগল লগইন হুক ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    // এটি আপনার "Web application" Client ID (ব্যাকএন্ডের জন্য)
    webClientId: '572157238701-ilop0tp2c5i2e0noorfvidqjk0iltg4h.apps.googleusercontent.com', 
    
    // এটি আপনার নতুন "Android" Client ID (ফ্রন্টএন্ডের জন্য)
    androidClientId: '572157238701-8mghjfgi8qmn8nr9go4131mppfgfsjhl.apps.googleusercontent.com',
  });

  // --- গুগল লগইন সফল হলে এই ইফেক্টটি কাজ করবে ---
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        // আমাদের ব্যাকএন্ডে accessToken পাঠান
        googleLogin(authentication.accessToken);
      }
    }
  }, [response, googleLogin]);

  // --- ইমেইল/পাসওয়ার্ড দিয়ে লগইন ---
  const handleLogin = async () => {
    if (!email || !password) { 
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে সব ফিল্ড পূরণ করুন।');
      return;
    }
    setLoading(true);
    await login(email, password); // AuthContext-এর login ফাংশন
    setLoading(false);
  };

  // --- গুগল বাটন ক্লিক ---
  const handleGoogleLogin = () => {
    promptAsync(); // এটি গুগলের লগইন পপআপ দেখাবে
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
      
      <TouchableOpacity 
        style={[styles.button, styles.googleButton]} 
        onPress={handleGoogleLogin} 
        disabled={!request}
      >
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>একাউন্ট নেই? রেজিস্ট্রেশন করুন</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- স্টাইল (অপরিবর্তিত) ---
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#ffffff' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 18, color: 'gray', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#f0f0f0', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 8, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#007bff', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10, minHeight: 58, justifyContent: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  googleButton: {
    backgroundColor: '#DB4437', 
    marginTop: 15,
  },
  linkText: { color: '#007bff', textAlign: 'center', marginTop: 20, fontSize: 16 },
});