// screens/HomeScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 

import { useAuth } from '../context/AuthContext'; 
import { useFocusEffect, useNavigation } from '@react-navigation/native'; 


export default function HomeScreen() {
  // --- 'logout' বাটনটি এখানে রাখা হয়েছে কারণ Error পেজে এটি এখনো ব্যবহৃত হচ্ছে ---
  const { logout, userToken, API_URL_BASE } = useAuth();
  const navigation = useNavigation(); 

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null); 
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL_BASE}/api/dashboard/`, {
        headers: {
          'Authorization': `Token ${userToken}`, 
        },
      });

      if (!response.ok) {
        throw new Error('ড্যাশবোর্ডের তথ্য আনতে সমস্যা হয়েছে।');
      }
      const json = await response.json();
      setDashboardData(json); 
    } catch (e) {
      console.error('Dashboard fetch error', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userToken, API_URL_BASE]); 

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]) 
  );

  const handleSearchSubmit = useCallback(() => {
    if (searchText.trim()) {
      navigation.navigate('ExploreStack', {
        screen: 'CourseList',
        params: {
          searchTerm: searchText,
          searchTitle: `"${searchText}" এর ফলাফল`
        },
      });
      setSearchText(''); 
    }
  }, [searchText, navigation]); 

  
  const renderHeader = useCallback(() => (
    <>
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>আপনার মোট পয়েন্ট</Text>
        <Text style={styles.pointsValue}>
          {dashboardData?.total_points || 0}
        </Text>
      </View>

      <Text style={styles.header}>My Courses (আমার কোর্সসমূহ)</Text>
    </>
  ), [dashboardData]); 

  // --- রেন্ডারিং লজিক (অপরিবর্তিত) ---
  if (loading && !dashboardData) { 
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  // --- এখানে 'logout' বাটনটি থাকছে ---
  if (error && !dashboardData) { 
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.buttonText}>লগআউট করুন</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
        
        {/* --- সার্চ বার (অপরিবর্তিত) --- */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="কী শিখতে চান? (যেমন: Python)"
            value={searchText}
            onChangeText={setSearchText} 
            onSubmitEditing={handleSearchSubmit} 
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
            <Text style={styles.searchButtonText}>খুঁজুন</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          style={styles.container} 
          data={dashboardData?.my_courses || []}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader} 
          renderItem={({ item }) => (
            <View style={styles.courseCard}>
              <Text style={styles.courseTitle}>{item.title}</Text>
              <Text style={styles.courseDescription}>{item.description}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>আপনি এখনো কোনো কোর্স শুরু করেননি। "Explore" ট্যাব থেকে শুরু করুন!</Text>
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchDashboard} />
          }
          
          // --- পরিবর্তন: ListFooterComponent (লগআউট বাটন) মুছে ফেলা হয়েছে ---
          // ListFooterComponent={...}
          // ListFooterComponentStyle={{...}}
          // -----------------------------------------------------------
        />
    </SafeAreaView>
  );
}

// --- স্টাইল (অপরিবর্তিত) ---
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
    paddingHorizontal: 15, 
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
    // marginTop: 15, // <-- এটি এখন আর দরকার নেই
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15, 
    paddingTop: 15, 
    marginBottom: 10, 
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    marginTop: 10, 
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});