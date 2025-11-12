// screens/LoginScreen.js
import React, { useState } from 'react';
// --- পরিবর্তন: SafeAreaView ইম্পোর্ট ঠিক করা ---
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useAuth } from '../context/AuthContext'; 

// --- গুগল লগইনের সব ইম্পোর্ট মুছে ফেলা হয়েছে ---

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); // <-- AuthContext থেকে শুধু 'login' নিন

  // --- গুগল লগইনের সব হুক (Hooks) মুছে ফেলা হয়েছে ---

  const handleLogin = async () => {
    if (!email || !password) { 
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে সব ফিল্ড পূরণ করুন।');
      return;
    }
    setLoading(true);
    await login(email, password); // AuthContext-এর login ফাংশন
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
      
      {/* --- গুগল লগইন বাটন মুছে ফেলা হয়েছে --- */}
      
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
  // googleButton স্টাইল মুছে ফেলা হয়েছে
  linkText: { color: '#007bff', textAlign: 'center', marginTop: 20, fontSize: 16 },
});