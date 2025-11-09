// screens/HomeScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, FlatList, RefreshControl } from 'react-native';

import { useAuth } from '../context/AuthContext'; // <-- আমাদের AuthContext ইম্পোর্ট করুন
import { useFocusEffect } from '@react-navigation/native'; // <-- (নতুন) ট্যাব ফোকাস হুক


export default function HomeScreen() {
  // AuthContext থেকে logout ফাংশন, টোকেন এবং URL নিন
  const { logout, userToken, API_URL_BASE } = useAuth();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null); // <-- ড্যাশবোর্ডের ডেটা
  const [error, setError] = useState(null);

  // --- (নতুন) ড্যাশবোর্ড ডেটা আনার ফাংশন ---
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL_BASE}/api/dashboard/`, {
        headers: {
          'Authorization': `Token ${userToken}`, // <-- টোকেন পাঠানো হচ্ছে
        },
      });

      if (!response.ok) {
        throw new Error('ড্যাশবোর্ডের তথ্য আনতে সমস্যা হয়েছে।');
      }

      const json = await response.json();
      setDashboardData(json); // <-- ডেটা state-এ সেভ করুন

    } catch (e) {
      console.error('Dashboard fetch error', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- (নতুন) useFocusEffect ---
  // এই হুক-টি ব্যবহারকারী যতবার "Home" ট্যাবে ফিরে আসবে, ততবার ডেটা রিফ্রেশ করবে।
  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [userToken]) // userToken পরিবর্তন হলেও রিফ্রেশ হবে
  );

  // --- রেন্ডারিং ---

  // লোডিং অবস্থা
  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  // এরর (Error) অবস্থা
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

  // --- সফলভাবে লোড হলে ড্যাশবোর্ড দেখান ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* --- মোট পয়েন্ট কার্ড --- */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>আপনার মোট পয়েন্ট</Text>
          <Text style={styles.pointsValue}>
            {dashboardData?.total_points || 0}
          </Text>
        </View>

        {/* --- "My Courses" তালিকা --- */}
        <Text style={styles.header}>My Courses (আমার কোর্সসমূহ)</Text>
        <FlatList
          data={dashboardData?.my_courses || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.courseCard}>
              <Text style={styles.courseTitle}>{item.title}</Text>
              <Text style={styles.courseDescription}>{item.description}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>আপনি এখনো কোনো কোর্স শুরু করেননি। "Explore" ট্যাব থেকে শুরু করুন!</Text>
          }
          // নিচে টেনে রিফ্রেশ করার সুবিধা
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchDashboard} />
          }
        />

        {/* --- লগআউট বাটন --- */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.buttonText}>লগআউট করুন</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  courseDescription: {
    fontSize: 14,
    color: 'gray',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 30,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10, // তালিকা থেকে একটু স্পেস
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});