// screens/ProfileScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen() {
  // AuthContext থেকে logout ফাংশন, টোকেন এবং URL নিন
  const { logout, userToken, API_URL_BASE } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);

  // --- প্রোফাইল ডেটা আনার ফাংশন ---
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL_BASE}/api/profile/`, { // <-- নতুন API URL
        headers: {
          'Authorization': `Token ${userToken}`, // <-- টোকেন পাঠানো হচ্ছে
        },
      });

      if (!response.ok) {
        throw new Error('প্রোফাইলের তথ্য আনতে সমস্যা হয়েছে।');
      }

      const json = await response.json();
      setProfileData(json); // <-- ডেটা state-এ সেভ করুন

    } catch (e) {
      console.error('Profile fetch error', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userToken, API_URL_BASE]); // <-- ডিপেন্ডেন্সি

  // --- useFocusEffect ---
  // এই স্ক্রিনে এলেই ডেটা রিফ্রেশ হবে
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]) // <-- ডিপেন্ডেন্সি
  );

  // --- রেন্ডারিং ---

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.buttonText}>লগআউট করুন</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- সফলভাবে লোড হলে প্রোফাইল দেখান ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchProfile} />
        }
      >
        {/* --- ইউজার ইনফো কার্ড --- */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>ইমেইল</Text>
          <Text style={styles.infoValue}>{profileData?.email}</Text>
          
          <Text style={styles.infoLabel}>ইউজারনেম</Text>
          <Text style={styles.infoValue}>{profileData?.username}</Text>
        </View>

        {/* --- মোট পয়েন্ট কার্ড --- */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>আপনার মোট পয়েন্ট</Text>
          <Text style={styles.pointsValue}>
            {profileData?.total_points || 0}
          </Text>
        </View>

        {/* --- লগআউট বাটন --- */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.buttonText}>লগআউট করুন</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- স্টাইল ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 16,
    color: 'gray',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pointsCard: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  pointsLabel: {
    fontSize: 18,
    color: '#e0e0e0',
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10, 
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});