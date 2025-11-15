// screens/HomeScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, TextInput, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons'; // আইকন ব্যবহারের জন্য

import { useAuth } from '../context/AuthContext'; 
import { useFocusEffect, useNavigation } from '@react-navigation/native'; 

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme'; 
// ----------------------------------------


// --- নেভিগেশন হেল্পার ফাংশন (ইউনিট ডিটেইলসে নেভিগেট করার জন্য) ---
const getNavigationTarget = (course) => {
    const unitId = course.first_unit_id;

    if (!unitId) {
        return { 
            screen: 'CourseDetail', 
            params: { courseId: course.id, courseTitle: course.title } 
        };
    }
    
    return { 
        screen: 'UnitDetail', 
        params: { unitId: unitId, unitTitle: course.title }
    };
};
// ------------------------------------------

// --- কালার প্যালেট (এই অংশটি মুছে ফেলা হয়েছে) ---
// const COLORS = { ... };
// -------------------------


export default function HomeScreen() {
  const { logout, userToken, API_URL_BASE } = useAuth();
  const navigation = useNavigation(); 

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null); 
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  // --- ড্যাশবোর্ড ডেটা লোড করা (অপরিবর্তিত) ---
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
        if (response.status === 401 || response.status === 403) {
             throw new Error('Unauthorized. প্লিজ আবার লগইন করুন।');
        }
        throw new Error('ড্যাশবোর্ডের তথ্য আনতে সমস্যা হয়েছে।');
      }
      
      const json = await response.json();
      setDashboardData(json); 
    } catch (e) {
      console.error('Dashboard fetch error', e);
      setError(e.message || 'ডেটা লোড করতে ব্যর্থ।');
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

  // --- কোর্স কার্ডে কন্টিনিউ বাটন হ্যান্ডলার (ইউনিট ডিটেইলসে নেভিগেট) ---
  const handleContinuePress = (course) => {
    const target = getNavigationTarget(course);
    
    navigation.navigate('ExploreStack', {
      screen: target.screen,
      params: target.params,
    });
  };

  // --- কোর্সের জন্য রেন্ডার ফাংশন (UI/UX রি-ডিজাইন) ---
  const renderCourseCard = ({ item: course }) => {
    const earned = course.user_earned_points || 0;
    const total = course.total_possible_points || 0;
    let percentage = 0;
    if (total > 0) {
      percentage = (earned / total) * 100;
    }
    
    const isCompletedByPoints = course.is_100_percent_completed;
    const buttonLabel = isCompletedByPoints ? 'View Course' : 'Continue Learning';
    
    return (
      <View style={styles.courseCard}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        
        {/* প্রোগ্রেস বার এবং পার্সেন্টেজ */}
        <View style={styles.progressContainer}>
            <View style={styles.progressBarWrapper}>
              <View style={[styles.progressInner, { width: `${percentage}%` }]} />
            </View>
            <Text style={styles.progressText}>{percentage.toFixed(0)}% Complete</Text>
        </View>
        
        {/* পয়েন্ট ও স্ট্যাটাস */}
        <View style={styles.statusRow}>
             <Text style={styles.statusLabel}>
                <Ionicons name="trophy" size={14} color={COLORS.primary} /> Points: 
             </Text>
             <Text style={styles.statusValue}>
                 {earned} / {total}
             </Text>
        </View>

        {/* কন্টিনিউ/ভিউ বাটন */}
        <TouchableOpacity 
            style={[styles.continueButton, isCompletedByPoints ? styles.buttonDisabled : null]}
            onPress={() => handleContinuePress(course)}
        >
            <Text style={styles.buttonText}>
                <Ionicons name={isCompletedByPoints ? "eye" : "arrow-forward-circle"} size={16} color={COLORS.white} /> {buttonLabel}
            </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // --- হেডার রেন্ডার ফাংশন (UI/UX রি-ডিজাইন) ---
  const renderHeader = useCallback(() => (
    <>
      <Text style={styles.callToActionText}>আজ নতুন কিছু শিখুন! 💡</Text>
        
      {/* ১. নোটিশ বোর্ড (হালকা থিম) */}
      {dashboardData?.notice && (
        <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}><Ionicons name="notifications-outline" size={18} color={COLORS.noticeText} /> {dashboardData.notice.title}</Text>
            <Text style={styles.noticeBody}>{dashboardData.notice.body}</Text>
        </View>
      )}

      {/* ২. প্রমোশন ব্যানার (YouTube থাম্বনেইল সাইজ) */}
      {dashboardData?.promotion && (
        <View style={styles.promotionCard}>
            <View style={styles.promotionContent}>
                <Text style={styles.promotionTitle}>{dashboardData.promotion.title}</Text>
                <Text style={styles.promotionSubtitle}>{dashboardData.promotion.subtitle}</Text>
            </View>
            {dashboardData.promotion.course && (
                <TouchableOpacity 
                    style={styles.promotionButton}
                    onPress={() => navigation.navigate('ExploreStack', { screen: 'CourseDetail', params: { courseId: dashboardData.promotion.course, courseTitle: dashboardData.promotion.course_title } })}
                >
                    <Text style={styles.promotionButtonText}>
                        <Ionicons name="pricetags" size={14} color={COLORS.promoButtonText} /> View Deal
                    </Text>
                </TouchableOpacity>
            )}
        </View>
      )}

      <Text style={styles.header}>My Courses</Text>
    </>
  ), [dashboardData]); 

  
  // --- রেন্ডারিং লজিক (অপরিবর্তিত) ---
  if (loading && !dashboardData) { 
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

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
        
        {/* --- সার্চ বার (UI/UX রি-ডিজাইন) --- */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="কী শিখতে চান? (যেমন: Python)"
            value={searchText}
            onChangeText={setSearchText} 
            onSubmitEditing={handleSearchSubmit} 
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          contentContainerStyle={styles.listContentContainer}
          data={dashboardData?.my_courses || []}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader} 
          renderItem={renderCourseCard}
          ListEmptyComponent={
            <Text style={styles.emptyText}>আপনি এখনো কোনো কোর্স শুরু করেননি। "Explore" ট্যাব থেকে শুরু করুন!</Text>
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchDashboard} />
          }
        />
    </SafeAreaView>
  );
}

// --- স্টাইল (অপরিবর্তিত, কারণ এটি এখন ইম্পোর্টেড COLORS ব্যবহার করবে) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background, // Light Cream/Beige
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  listContentContainer: { 
    paddingHorizontal: 15, 
    paddingTop: 0,
    paddingBottom: 20,
  },
  errorText: {
    color: COLORS.primary, // Error in Coral
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  // প্রধান শিরোনাম
  callToActionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text, // Dark Navy
    marginTop: 15,
    marginBottom: 20,
  },
  // --- সার্চ কার্ড স্টাইল ---
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white, // সাদা
    paddingHorizontal: 15, 
    paddingVertical: 8,
    marginHorizontal: 15,
    marginTop: 0, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 5,
    fontSize: 16,
    color: COLORS.text,
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: COLORS.accent, // Dark Navy
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  searchButtonText: {
    color: COLORS.white, // সাদা টেক্সট
    fontSize: 14,
    fontWeight: 'bold',
  },
  // --- নোটিশ কার্ড স্টাইল (Light Theme) ---
  noticeCard: {
    backgroundColor: COLORS.noticeBg, // White
    borderColor: COLORS.primary, // Coral Border
    borderWidth: 1,
    padding: 15, 
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 20,
    elevation: 1,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.noticeText, // Dark Navy Text
    marginBottom: 5,
  },
  noticeBody: {
    fontSize: 14,
    color: COLORS.noticeText,
  },
  // --- প্রমোশন কার্ড স্টাইল (YouTube থাম্বনেইল সাইজ) ---
  promotionCard: {
    backgroundColor: COLORS.promoBg, // Muted Gold/Mustard
    borderColor: '#E0C880', // Slightly darker gold
    borderWidth: 1,
    paddingHorizontal: 20, 
    paddingVertical: 35, // বড় সাইজ
    minHeight: 120, // বড় সাইজ
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  promotionContent: {
      flex: 1,
      marginRight: 10,
  },
  promotionTitle: {
    fontSize: 20, 
    fontWeight: 'bold',
    color: COLORS.promoText, // Dark Navy
  },
  promotionSubtitle: {
    fontSize: 14, 
    color: COLORS.promoText,
    marginTop: 2,
  },
  promotionButton: {
    backgroundColor: COLORS.primary, // Coral/Burnt Orange Button
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  promotionButtonText: {
    color: COLORS.promoButtonText, // White Text
    fontSize: 13,
    fontWeight: 'bold',
  },
  // -------------------------
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
    color: COLORS.text,
  },
  // --- কোর্স কার্ড (রি-ডিজাইন) ---
  courseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 18,
    marginBottom: 15,
    // সফট শ্যাডো
    shadowColor: COLORS.accent, // Dark Navy shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  progressContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressBarWrapper: {
    flex: 1,
    height: 8, 
    backgroundColor: COLORS.border, 
    borderRadius: 4,
    marginRight: 10,
  },
  progressInner: { 
    height: '100%', 
    backgroundColor: COLORS.progress, // Muted Teal/Green
    borderRadius: 4 
  },
  progressText: { 
    fontSize: 12, 
    color: COLORS.textLight, 
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: COLORS.primary, // Coral/Burnt Orange Button
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 45,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled, // View Course এর জন্য ধূসর রং
  },
  buttonText: {
    color: COLORS.white, // সাদা টেক্সট
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 30,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: COLORS.accent, // Dark Navy
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10, 
  },
});