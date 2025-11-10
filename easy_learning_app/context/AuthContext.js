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

  // --- (লগইন ফাংশন - অপরিবর্তিত) ---
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL_BASE}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password }),
      });
      const json = await response.json();
      if (response.ok) {
        const token = json.key;
        setUserToken(token);
        await AsyncStorage.setItem('userToken', token);
      } else {
        // (পরিবর্তিত) ইমেইল দিয়ে লগইনের জন্য এরর মেসেজ আপডেট
        Alert.alert('লগইন ব্যর্থ', json.non_field_errors?.[0] || json.email?.[0] || 'একটি সমস্যা হয়েছে।');
      }
    } catch (e) {
      console.error('Login error', e);
      Alert.alert('লগইন ব্যর্থ', 'নেটওয়ার্ক সমস্যা। সার্ভার কি চালু আছে?');
    }
  };

  // --- (রেজিস্ট্রেশন ফাংশন - অপরিবর্তিত) ---
  const register = async (username, password, password2) => {
    try {
      const response = await fetch(`${API_URL_BASE}/api/register/`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password, password2: password2 }),
      });
      const json = await response.json();
      if (response.ok) {
        const token = json.key; 
        setUserToken(token);
        await AsyncStorage.setItem('userToken', token);
      } else {
        const errorKey = Object.keys(json)[0];
        const errorMsg = json[errorKey][0] || 'একটি অজানা ত্রুটি ঘটেছে।';
        Alert.alert('রেজিস্ট্রেশন ব্যর্থ', errorMsg);
      }
    } catch (e) {
      console.error('Register error', e);
      Alert.alert('রেজিস্ট্রেশন ব্যর্থ', 'নেটওয়ার্ক সমস্যা।');
    }
  };

  // --- (পরিবর্তিত) গুগল লগইন ফাংশন ---
  // এটি এখন accessToken দিয়ে কল করা হবে
  const googleLogin = async (accessToken) => {
    try {
      const response = await fetch(`${API_URL_BASE}/api/auth/google/`, { // <-- আমাদের ব্যাকএন্ড API URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken, // <-- আমরা এখন accessToken পাঠাচ্ছি
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
  // --------------------------------

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
      googleLogin, // <-- (পরিবর্তিত)
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