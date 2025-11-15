// screens/CourseDetailScreen.js
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ------------------------------------------

// --- অ্যানিমেশন সক্ষম করা (Android-এর জন্য) ---
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
// ------------------------------------------

// --- এক্সপ্যান্ডেবল ইউনিট কম্পোনেন্ট ---
const ExpandableUnit = ({ unit, courseId, courseTitle, isCourseLocked }) => {
  const [expanded, setExpanded] = useState(false);
  const navigation = useNavigation();
  
  const totalItems = (unit.lessons.length || 0) + (unit.quizzes.length || 0) + (unit.matching_games.length || 0);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };
  
  const handleUnitPress = () => {
    if (isCourseLocked) {
      // এই কোর্সে এনরোল করা নেই, তাই Paywall-এ পাঠানো হচ্ছে
      navigation.navigate('Paywall', { 
        courseId: courseId, 
        courseTitle: courseTitle 
      });
      return;
    }
    // ইউনিট ডিটেইল স্ক্রিনে নেভিগেট করা
    navigation.navigate('UnitDetail', { 
        unitId: unit.id, 
        unitTitle: unit.title,
        courseId: courseId, 
    });
  };

  return (
    <View style={styles.unitCard}>
      <TouchableOpacity onPress={handleUnitPress} style={styles.unitHeader}>
        <View style={styles.headerIconWrapper}>
            <Ionicons name="book-outline" size={24} color={COLORS.accent} />
        </View>
        
        <View style={styles.unitHeaderContent}>
            <Text style={styles.unitTitle}>Unit {unit.order}: {unit.title}</Text>
            <Text style={styles.unitStats}>
                {totalItems} Items | {unit.total_possible_points || 0} Points
            </Text>
        </View>
        
        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
           <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </TouchableOpacity>
      
      {/* --- কন্টেন্টের তালিকা --- */}
      {expanded && (
        <View style={styles.unitContent}>
          <Text style={styles.contentHeader}>Contents:</Text>
          {/* লেসনস */}
          {unit.lessons.map((lesson, index) => (
             <Text key={`L-${lesson.id}`} style={styles.contentItem}>
                <Ionicons name="document-text-outline" size={14} color={COLORS.textLight} /> Lesson {lesson.order}: {lesson.title}
             </Text>
          ))}
          {/* কুইজ ও গেম */}
          {unit.quizzes.map(quiz => (
             <Text key={`Q-${quiz.id}`} style={styles.contentItem}>
                <Ionicons name="help-circle-outline" size={14} color={COLORS.primary} /> {quiz.quiz_type === 'UNIT' ? 'Mastery Quiz' : 'Lesson Quiz'}: {quiz.title}
             </Text>
          ))}
          {unit.matching_games.map(game => (
             <Text key={`G-${game.id}`} style={styles.contentItem}>
                <Ionicons name="game-controller-outline" size={14} color={COLORS.progress} /> Game: {game.title}
             </Text>
          ))}
        </View>
      )}
    </View>
  );
};
// ------------------------------------------


export default function CourseDetailScreen({ route }) {
  const { courseId } = route.params;
  const { userToken, API_URL_BASE } = useAuth();
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState(null);
  const [error, setError] = useState(null);

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL_BASE}/api/courses/${courseId}/`, {
        headers: {
          'Authorization': `Token ${userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('কোর্সের তথ্য আনতে সমস্যা হয়েছে।');
      }

      const json = await response.json();
      setCourseData(json);
      navigation.setOptions({ title: json.title }); // হেডার টাইটেল সেট করা
    } catch (e) {
      console.error('Course detail fetch error', e);
      setError(e.message || 'কোর্সের বিস্তারিত তথ্য লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  }, [userToken, API_URL_BASE, courseId, navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchCourseDetails();
    }, [fetchCourseDetails])
  );
  
  // --- কন্টিনিউ/এনরোল বাটন লজিক (মুছে ফেলা হয়েছে) ---
  // const handleCtaPress = async () => { ... };

  if (loading && !courseData) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (error && !courseData) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.reloadButton} onPress={fetchCourseDetails}>
          <Text style={{ color: COLORS.white }}>Reload</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  const isEnrolled = courseData.is_enrolled;
  const isPremium = courseData.is_premium;
  
  // --- বাটন লেবেল (এখন আর ব্যবহৃত হচ্ছে না) ---
  // const ctaLabel = ...;
  // const ctaColor = ...;

  const totalPoints = courseData.total_possible_points || 0;
  const earnedPoints = courseData.user_earned_points || 0;
  const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

  // --- নতুন স্ট্যাটাস টেক্সট লজিক ---
  const statusText = (isEnrolled || percentage > 0) 
      ? `${percentage.toFixed(0)}% Complete` 
      : 'Not Started';


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchCourseDetails} colors={[COLORS.primary]} />
      }>
        
        {/* --- ১. Hero Section (আপডেটেড) --- */}
        <View style={styles.heroSection}>
            <Text style={styles.courseName}>{courseData.title}</Text>
            
            {/* --- 프리/ফ্রি ব্যাজ কন্ডিশন --- */}
            {isPremium ? (
                <View style={styles.premiumBadge}>
                    <Ionicons name="lock-closed" size={16} color={COLORS.white} />
                    <Text style={styles.premiumText}>PREMIUM</Text>
                </View>
            ) : (
                <View style={styles.freeBadge}>
                    <Ionicons name="leaf-outline" size={16} color={COLORS.white} />
                    <Text style={styles.freeText}>FREE COURSE</Text>
                </View>
            )}
            
            <Text style={styles.courseDescription}>{courseData.description}</Text>
            
            {/* --- প্রোগ্রেস বার (এখন সবার জন্য) --- */}
            <View style={styles.progressSection}>
                <View style={styles.progressBarOuter}>
                    <View style={[styles.progressBarInner, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.progressText}>{statusText}</Text>
            </View>

        </View>

        {/* --- ২. কোর্স স্ট্যাটিস্টিকস (অপরিবর্তিত) --- */}
        <View style={styles.statsGrid}>
            <View style={styles.statItem}>
                <Ionicons name="layers-outline" size={24} color={COLORS.accent} />
                <Text style={styles.statValue}>{courseData.total_units || 0}</Text>
                <Text style={styles.statLabel}>Units</Text>
            </View>
            <View style={styles.statItem}>
                <Ionicons name="document-text-outline" size={24} color={COLORS.accent} />
                <Text style={styles.statValue}>{courseData.total_lessons || 0}</Text>
                <Text style={styles.statLabel}>Lessons</Text>
            </View>
            <View style={styles.statItem}>
                <Ionicons name="help-circle-outline" size={24} color={COLORS.accent} />
                <Text style={styles.statValue}>{courseData.total_quizzes || 0}</Text>
                <Text style={styles.statLabel}>Quizzes</Text>
            </View>
            <View style={styles.statItem}>
                <Ionicons name="trophy-outline" size={24} color={COLORS.accent} />
                <Text style={styles.statValue}>{totalPoints}</Text>
                <Text style={styles.statLabel}>Total Points</Text>
            </View>
        </View>

        {/* --- ৩. ইউনিট তালিকা (এক্সপ্যান্ডেবল) --- */}
        <Text style={styles.unitsHeader}>Course Content ({courseData.total_units} Units)</Text>
        
        {courseData.units.length > 0 ? (
          courseData.units.map((unit) => (
            <ExpandableUnit 
                key={unit.id} 
                unit={unit} 
                courseId={courseData.id}
                courseTitle={courseData.title}
                isCourseLocked={isPremium && !isEnrolled}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>এই কোর্সে এখনো কোনো ইউনিট যোগ করা হয়নি।</Text>
        )}

      </ScrollView>
      
      {/* --- ৪. ফিক্সড ফুটার CTA (মুছে ফেলা হয়েছে) --- */}
      {/* <View style={styles.footer}> ... </View> */}

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
  container: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 20, // --- পরিবর্তন: 100 থেকে 20 করা হলো ---
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  // --- Hero Section ---
  heroSection: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
  },
  courseName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 22,
    marginTop: 10,
  },
  premiumBadge: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary, // Coral/Burnt Orange
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 10,
    alignItems: 'center',
  },
  premiumText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  // --- নতুন: ফ্রি ব্যাজ স্টাইল ---
  freeBadge: {
    flexDirection: 'row',
    backgroundColor: COLORS.progress, // Green
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 10,
    alignItems: 'center',
  },
  freeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  // --- Progress Bar ---
  progressSection: {
    marginTop: 15,
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 5,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: COLORS.progress, // Muted Teal/Green
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.progress,
    fontWeight: 'bold',
  },
  // --- Stats Grid ---
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingTop: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  // --- Unit List & Accordion ---
  unitsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 15,
  },
  unitCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.white,
  },
  headerIconWrapper: {
      padding: 5,
      borderRadius: 5,
      backgroundColor: COLORS.background, // Background color for icon
  },
  unitHeaderContent: {
    flex: 1,
    marginLeft: 15,
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  unitStats: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  expandButton: {
      padding: 5,
  },
  unitContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  contentHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  contentItem: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 5,
    marginLeft: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: 20,
    fontSize: 16,
  },
  // --- Footer CTA (মুছে ফেলা হয়েছে) ---
  // footer: { ... },
  // ctaButton: { ... },
  // ctaText: { ... },
  reloadButton: {
      backgroundColor: COLORS.primary,
      padding: 10,
      borderRadius: 5,
      marginTop: 10,
  },
});