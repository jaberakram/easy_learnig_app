// screens/CourseListScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useNavigation, useFocusEffect } from '@react-navigation/native'; 
import { useAuth } from '../context/AuthContext'; 
import { Ionicons } from '@expo/vector-icons'; 

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ------------------------------------------

// --- কালার প্যালেট (এই অংশটি মুছে ফেলা হয়েছে) ---
// const COLORS = { ... };
// ------------------------------------------


export default function CourseListScreen({ route }) {
  const { categoryId, searchTerm, categoryName, searchTitle } = route.params || {};
  const navigation = useNavigation();
  const { userToken, API_URL_BASE } = useAuth(); 

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  // --- fetchCourses কে useCallback এ মোড়ানো হয়েছে ---
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCourses([]); 

      let url = `${API_URL_BASE}/api/courses/`;

      if (categoryId) {
        url += `?category=${categoryId}`;
      } else if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${userToken}`, 
        },
      });
      if (!response.ok) {
        throw new Error('কোর্স আনতে সমস্যা হয়েছে।');
      }
      const json = await response.json();
      setCourses(json);
    } catch (e) {
      console.error(e);
      setError('কোর্স আনতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  }, [categoryId, searchTerm, userToken, API_URL_BASE]); // <-- ডিপেন্ডেন্সি ঠিক করা হয়েছে

  useFocusEffect(
    useCallback(() => {
      // হেডার টাইটেল সেট করা
      navigation.setOptions({ 
        title: categoryName || searchTitle || 'Courses' 
      });
      fetchCourses();
    }, [fetchCourses, navigation, categoryName, searchTitle])
  );

  if (loading && courses.length === 0) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  // --- কার্ড রেন্ডার করার ফাংশন (UI/UX রি-ডিজাইন) ---
  const renderCourseCard = ({ item }) => {
    const earned = item.user_earned_points || 0;
    const total = item.total_possible_points || 0;
    let percentage = 0;
    if (total > 0) {
      percentage = (earned / total) * 100;
    }

    const isEnrolled = item.is_enrolled;
    const isLocked = item.is_premium && !isEnrolled;

    // --- নতুন স্ট্যাটাস লজিক ---
    let statusText;
    let isCompleted;
    if (isEnrolled && percentage >= 100) {
        statusText = "Completed";
        isCompleted = true;
    } else if (isEnrolled && percentage > 0) {
        statusText = "In Progress";
        isCompleted = false;
    } else {
        // ফ্রি কোর্স বা এনরোল না করা কোর্সের জন্য
        statusText = "Not Started"; 
        isCompleted = false;
    }
    // --- নতুন লজিক শেষ ---


    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => {
          if (isLocked) {
            // প্রিমিয়াম ও লকড? Paywall এ যান
            navigation.navigate('Paywall', { 
              courseId: item.id, 
              courseTitle: item.title 
            });
          } else {
            // ফ্রি অথবা এনরোল করা? CourseDetail এ যান
            navigation.navigate('CourseDetail', {
              courseId: item.id,
              courseTitle: item.title
            });
          }
        }}
      >
        {/* প্রিমিয়াম ট্যাগ (এই লজিকটি ঠিক আছে) */}
        {item.is_premium && (
            <View style={[styles.premiumTag, isLocked && styles.lockedTag]}>
                <Ionicons name={isLocked ? "lock-closed" : "shield-checkmark"} size={12} color={isLocked ? COLORS.white : COLORS.accent} />
                <Text style={[styles.premiumText, isLocked && styles.lockedText]}>
                    {isLocked ? "Premium" : "Enrolled"}
                </Text>
            </View>
        )}
        
        <View style={styles.contentWrapper}>
            <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
            </View>

            {/* --- পরিবর্তিত স্ট্যাটাস/প্রোগ্রেস সেকশন --- */}
            {/* কন্ডিশনাল (isEnrolled ? ... : ...) সরিয়ে ফেলা হয়েছে */}
            <View style={styles.statusContainer}>
                <>
                    <Text style={[
                        styles.statusText, 
                        isCompleted && styles.completedText,
                        !isEnrolled && !isCompleted && styles.notStartedText // "Not Started" এর জন্য স্টাইল
                    ]}>
                        {statusText}
                    </Text>
                    <View style={styles.progressOuter}>
                        <View style={[styles.progressInner, { width: `${percentage}%` }, isCompleted && styles.progressCompleted]} />
                    </View>
                    <Text style={styles.pointsText}>{earned} / {total} Points</Text>
                </>
            </View>
            {/* --- পরিবর্তন শেষ --- */}

        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCourseCard} 
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
            <Text style={styles.errorText}>
                {searchTerm ? 'আপনার সার্চের সাথে কোনো কোর্স পাওয়া যায়নি।' : 'এই ক্যাটাগরিতে এখনো কোনো কোর্স যোগ করা হয়নি।'}
            </Text>
        }
        refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchCourses} colors={[COLORS.primary]} />
        }
      />
    </SafeAreaView>
  );
}

// --- স্টাইল (নতুন প্যালেট এবং UI) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  contentWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5, // প্রিমিয়াম ট্যাগের জন্য জায়গা
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent, // Dark Navy
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 5,
  },
  // --- প্রিমিয়াম ট্যাগ ---
  premiumTag: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: COLORS.promoBg, // Muted Gold
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  premiumText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  lockedTag: {
    backgroundColor: COLORS.primary, // Coral
  },
  lockedText: {
    color: COLORS.white,
  },
  // --- স্ট্যাটাস সেকশন ---
  statusContainer: {
    width: 90, // একটি নির্দিষ্ট প্রস্থ
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textLight, // ডিফল্ট কালার
    marginBottom: 4,
  },
  completedText: {
    color: COLORS.progress, // Muted Green
  },
  // --- নতুন: "Not Started" স্টাইল ---
  notStartedText: {
    color: COLORS.textLight, // Gray
  },
  // --------------------------
  progressOuter: { 
    height: 6, 
    width: '100%',
    backgroundColor: COLORS.border, 
    borderRadius: 3 
  },
  progressInner: { 
    height: '100%', 
    backgroundColor: COLORS.progress, // Muted Green
    borderRadius: 3 
  },
  progressCompleted: {
      backgroundColor: COLORS.progress, // Muted Green
  },
  pointsText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  // --- এনরোল বাটন (এই স্টাইলগুলো এখন আর ব্যবহৃত হচ্ছে না) ---
  enrollButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: COLORS.primary + '30', // হালকা Coral
    borderWidth: 1,
    borderColor: COLORS.primary, // Coral Border
  },
  enrollButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  enrollButtonPremium: {
    backgroundColor: COLORS.promoBg,
    borderColor: COLORS.promoBg,
  },
  enrollButtonPremiumText: {
    color: COLORS.accent,
  },
});