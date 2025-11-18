// screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// --- নতুন ইম্পোর্ট ---
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, googleLoginBackend } = useAuth();

  // --- Google Signin কনফিগারেশন ---
  useEffect(() => {
    GoogleSignin.configure({
      // ওয়েব ক্লায়েন্ট আইডি (Firebase বা Google Cloud Console থেকে পাবেন)
      // দ্রষ্টব্য: নেটিভ অ্যাপ হলেও এখানে অনেক সময় Web Client ID দিতে হয় যদি আপনি idToken পেতে চান।
      // তবে শুধুমাত্র লগইনের জন্য আপনার বর্তমান কনফিগারেশন কাজ করতে পারে।
      // যদি কোনো সমস্যা হয়, Console থেকে 'Web Client ID' টি এখানে দেবেন।
      webClientId: '704239013112-7qgsod3v4e1o4pngsihqcvk1i6a47q0f.apps.googleusercontent.com', 
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // টোকেন নেওয়া (idToken বা accessToken)
      // আপনার ব্যাকএন্ড কি ধরনের টোকেন চায় তার ওপর ভিত্তি করে এটি পাঠাবেন
      const { idToken, user } = userInfo.data || userInfo; // লাইব্রেরির ভার্সন অনুযায়ী ডাটা স্ট্রাকচার ভিন্ন হতে পারে
      
      // যদি ব্যাকএন্ড accessToken চায়:
      const tokens = await GoogleSignin.getTokens();
      
      // ব্যাকএন্ডে পাঠানো (এখানে accessToken পাঠানো হচ্ছে)
      await googleLoginBackend(tokens.accessToken);

    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Play services not available or outdated');
      } else {
        console.error('Google Sign-In Error:', error);
        Alert.alert('Login Failed', error.message || 'Something went wrong');
      }
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
        onPress={handleGoogleLogin}
        disabled={loading}
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