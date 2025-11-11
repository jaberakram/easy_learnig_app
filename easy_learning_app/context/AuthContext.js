// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// --- গুরুত্বপূর্ণ ---
const API_URL_BASE = 'http://192.168.0.200:8000'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- (লগইন ফাংশন - ইমেইল দিয়ে ঠিক করা) ---
  const login = async (email, password) => { // <-- পরিবর্তন: username এর বদলে email
    try {
      const response = await fetch(`${API_URL_BASE}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }), // <-- পরিবর্তন: username এর বদলে email
      });
      const json = await response.json();
      if (response.ok) {
        const token = json.key;
        setUserToken(token);
        await AsyncStorage.setItem('userToken', token);
      } else {
        Alert.alert('লগইন ব্যর্থ', json.non_field_errors?.[0] || json.email?.[0] || 'একটি সমস্যা হয়েছে।');
      }
    } catch (e) {
      console.error('Login error', e);
      Alert.alert('লগইন ব্যর্থ', 'নেটওয়ার্ক সমস্যা। সার্ভার কি চালু আছে?');
    }
  };

  // --- (রেজিস্ট্রেশন ফাংশন - ইমেইল দিয়ে ঠিক করা) ---
  const register = async (email, password, password2) => { // <-- পরিবর্তন: 'username' এর বদলে 'email'
    try {
      const response = await fetch(`${API_URL_BASE}/api/register/`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 'username' এর বদলে 'email' পাঠান
        body: JSON.stringify({ email: email, password: password, password2: password2 }), // <-- পরিবর্তন
      });
      const json = await response.json();
      
      if (response.ok) {
        const token = json.key; 
        setUserToken(token);
        await AsyncStorage.setItem('userToken', token);
      } else {
        // নতুন এরর হ্যান্ডলিং (ধাপ ১ অনুযায়ী)
        const emailError = json.email?.[0];
        const passwordError = json.password?.[0];
        const errorMsg = emailError || passwordError || 'একটি অজানা ত্রুটি ঘটেছে।';
        Alert.alert('রেজিস্ট্রেশন ব্যর্থ', errorMsg);
      }
    } catch (e) {
      console.error('Register error', e);
      Alert.alert('রেজিস্ট্রেশন ব্যর্থ', 'নেটওয়ার্ক সমস্যা।');
    }
  };

  // --- (গুগল লগইন ফাংশন - অপরিবর্তিত) ---
  const googleLogin = async (accessToken) => {
    try {
      const response = await fetch(`${API_URL_BASE}/api/auth/google/`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken, 
        }),
      });
      const json = await response.json();
      if (response.ok) {
        const token = json.key;
        setUserToken(token);
        await AsyncStorage.setItem('userToken', token);
      } else {
        Alert.alert('গুগল লগইন ব্যর্থ', json.non_field_errors[0] || 'একটি সমস্যা হয়েছে।');
      }
    } catch (e) {
      console.error('Google Login error', e);
      Alert.alert('লগইন ব্যর্থ', 'গুগল সার্ভারের সাথে সংযোগে সমস্যা।');
    }
  };

  // --- (লগআউট ফাংশন - অপরিবর্তিত) ---
  const logout = async () => {
    try {
      await fetch(`${API_URL_BASE}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${userToken}`,
        },
      });
    } catch (e) {
      console.error('Logout API call error', e);
    } finally {
      setUserToken(null);
      await AsyncStorage.removeItem('userToken');
    }
  };

  // --- (isLoggedIn - অপরিবর্তিত) ---
  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
    } catch (e) { console.error('isLoggedIn error', e); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{
      login, 
      logout, 
      register,
      googleLogin, 
      userToken,
      isLoading,
      API_URL_BASE
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// কাস্টম হুক (Hook)
export const useAuth = () => {
  return useContext(AuthContext);
};