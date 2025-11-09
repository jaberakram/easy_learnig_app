// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext'; // <-- AuthContext ইম্পোর্ট করুন

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // <-- লোডিং স্টেট
  const { login } = useAuth(); // <-- login ফাংশনটি নিন

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে সব ফিল্ড পূরণ করুন।');
      return;
    }
    
    setLoading(true); // লোডিং শুরু
    await login(username, password); // <-- আসল login ফাংশন কল করুন
    setLoading(false); // লোডিং শেষ
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>স্বাগতম!</Text>
      <Text style={styles.subtitle}>অনুগ্রহ করে লগইন করুন</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username (ইউজারনেম)"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        keyboardType="default"
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
        disabled={loading} // লোডিং চলাকালীন বাটনটি নিষ্ক্রিয় করুন
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" /> // লোডিং হলে স্পিনার দেখান
        ) : (
          <Text style={styles.buttonText}>লগইন করুন</Text>
        )}
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
  button: { backgroundColor: '#007bff', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10, minHeight: 58, justifyContent: 'center' }, // minHeight যোগ করা হয়েছে
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#007bff', textAlign: 'center', marginTop: 20, fontSize: 16 },
});