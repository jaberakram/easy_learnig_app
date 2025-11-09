// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// --- গুরুত্বপূর্ণ ---
// আপনার আইপি অ্যাড্রেসটি এখানে বসান
const API_URL_BASE = 'http://192.168.0.200:8000';
// (আমরা /api/auth অংশটি মুছে দিয়েছি যাতে API_URL_BASE সব জায়গায় ব্যবহার করা যায়)

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- (লগইন ফাংশন) ---
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL_BASE}/api/auth/login/`, {
        // ... (বাকি কোড অপরিবর্তিত) ...
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
        Alert.alert('লগইন ব্যর্থ', json.non_field_errors[0] || 'একটি সমস্যা হয়েছে।');
      }
    } catch (e) {
      console.error('Login error', e);
      Alert.alert('লগইন ব্যর্থ', 'নেটওয়ার্ক সমস্যা। সার্ভার কি চালু আছে?');
    }
  };

  // --- (রেজিস্ট্রেশন ফাংশন) ---
  const register = async (username, password, password2) => {
    try {
      const response = await fetch(`${API_URL_BASE}/api/register/`, { // <-- কাস্টম URL
        // ... (বাকি কোড অপরিবর্তিত) ...
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

  // --- (লগআউট ফাংশন) ---
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

  // --- অ্যাপ চালু হলে টোকেন চেক করা (অপরিবর্তিত) ---
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
      userToken,  // <-- আমরা টোকেনটি এক্সপোর্ট করছি
      isLoading,
      API_URL_BASE // <-- আমরা বেস URL টি এক্সপোর্ট করছি
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// কাস্টম হুক (Hook)
export const useAuth = () => {
  return useContext(AuthContext);
};