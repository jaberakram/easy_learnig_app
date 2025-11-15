// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_URL_BASE = 'http://192.168.0.198:8000'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL_BASE}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }), 
      });
      const json = await response.json();
      if (response.ok) {
        const token = json.key;
        setUserToken(token);
        await AsyncStorage.setItem('userToken', token);
      } else {
        Alert.alert('লগইন ব্যর্থ', json.non_field_errors?.[0] || json.email?.[0] || 'ইমেইল বা পাসওয়ার্ড ভুল।');
      }
    } catch (e) {
      console.error('Login error', e);
      Alert.alert('লগইন ব্যর্থ', 'নেটওয়ার্ক সমস্যা। সার্ভার কি চালু আছে?');
    }
  };

  const register = async (email, password, password2) => {
    try {
      const response = await fetch(`${API_URL_BASE}/api/register/`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password, password2: password2 }), 
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

  // --- পরিবর্তন: 'googleLogin' ফাংশনটি মুছে ফেলা হয়েছে ---

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
      // --- 'googleLogin' মুছে ফেলা হয়েছে ---
      userToken,
      isLoading,
      API_URL_BASE
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};