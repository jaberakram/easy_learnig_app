// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';

import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState(''); // পাসওয়ার্ড কনফার্ম
  const [loading, setLoading] = useState(false);
  const { register } = useAuth(); // register ফাংশনটি নিন

  const handleRegister = async () => {
    if (!username || !password || !password2) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে সব ফিল্ড পূরণ করুন।');
      return;
    }
    if (password !== password2) {
      Alert.alert('ত্রুটি', 'দুটি পাসওয়ার্ড মেলেনি।');
      return;
    }

    setLoading(true);
    // --- (এই লাইনটি ঠিক করা হয়েছে) ---
    // --- এখন আমরা দুটি পাসওয়ার্ডই পাঠাচ্ছি ---
    await register(username, password, password2);
    // ---------------------------------
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>একাউন্ট তৈরি করুন</Text>
      
      <TextInput style={styles.input} placeholder="Username (ইউজারনেম)" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password (পাসওয়ার্ড)" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirm Password (পাসওয়ার্ড নিশ্চিত করুন)" value={password2} onChangeText={setPassword2} secureTextEntry />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>রেজিস্টার করুন</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>already have an account? লগইন করুন</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
    
// --- স্টাইল (অপরিবর্তিত) ---
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#ffffff' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#f0f0f0', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 8, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#007bff', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10, minHeight: 58, justifyContent: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#007bff', textAlign: 'center', marginTop: 20, fontSize: 16 },
});