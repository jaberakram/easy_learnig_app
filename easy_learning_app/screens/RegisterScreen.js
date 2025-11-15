// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ----------------------------------------

export default function RegisterScreen({ navigation }) {
  // --- পরিবর্তন: 'username' স্টেট সরানো হয়েছে ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState(''); // কনফার্ম পাসওয়ার্ড
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth(); // AuthContext থেকে 'register'

  const handleRegister = async () => {
    // --- পরিবর্তন: 'username' ভ্যালিডেশন সরানো হয়েছে ---
    if (!email || !password || !password2) {
      Alert.alert('ত্রুটি', 'অনুগ্রহ করে সব ফিল্ড পূরণ করুন।');
      return;
    }
    if (password !== password2) {
      Alert.alert('ত্রুটি', 'দুটি পাসওয়ার্ড মেলেনি।');
      return;
    }
    
    setLoading(true);
    // --- পরিবর্তন: 'username' পাঠানো বন্ধ করা হয়েছে ---
    await register(email, password, password2); 
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>নতুন একাউন্ট</Text>
      <Text style={styles.subtitle}>শিখতে শুরু করুন আজই!</Text>
      
      {/* --- ইউজারনেম ইনপুট ফিল্ড মুছে ফেলা হয়েছে --- */}
      
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
      <TextInput
        style={styles.input}
        placeholder="Confirm Password (পুনরায় পাসওয়ার্ড)"
        value={password2}
        onChangeText={setPassword2}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>রেজিস্ট্রেশন করুন</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>একাউন্ট আছে? লগইন করুন</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- স্টাইল (থিম কালার ব্যবহার করে আপডেট) ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: COLORS.white // পরিবর্তন
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 10,
    color: COLORS.accent // পরিবর্তন
  },
  subtitle: { 
    fontSize: 18, 
    color: COLORS.textLight, // পরিবর্তন
    textAlign: 'center', 
    marginBottom: 30 
  },
  input: { 
    backgroundColor: COLORS.white, // পরিবর্তন
    paddingVertical: 15, 
    paddingHorizontal: 15, 
    borderRadius: 8, 
    marginBottom: 15, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: COLORS.border // পরিবর্তন
  },
  button: { 
    backgroundColor: COLORS.primary, // পরিবর্তন
    padding: 18, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10,
    minHeight: 58, 
    justifyContent: 'center' 
  },
  buttonText: { 
    color: COLORS.white, // পরিবর্তন
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  linkText: { 
    color: COLORS.primary, // পরিবর্তন
    textAlign: 'center', 
    marginTop: 20, 
    fontSize: 16 
  },
});