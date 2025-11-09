// screens/CourseDetailScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; 

export default function CourseDetailScreen({ route }) {
  const { courseId } = route.params;
  const navigation = useNavigation();
  const { userToken, API_URL_BASE } = useAuth();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);

  // --- (সংশোধিত) useFocusEffect ---
  // আমরা এখন Error লগের নির্দেশনা অনুযায়ী কোডটি সাজিয়েছি
  useFocusEffect(
    useCallback(() => {
      // async ফাংশনটি এখন useCallback-এর ভেতরে ডিফাইন করা হয়েছে
      async function fetchCourseDetails() {
        if (!courseId || !userToken || !API_URL_BASE) return;

        try {
          // প্রতিবার ফোকাস হলেই লোডিং দেখাবে না, শুধু প্রথমবার বা রিফ্রেশ হলে
          // setLoading(true); // <-- এই লাইনটি কমেন্ট আউট করলে রিফ্রেশ স্মুথ হয়
          setError(null);
          
          const response = await fetch(`${API_URL_BASE}/api/courses/${courseId}/`, {
            headers: {
              'Authorization': `Token ${userToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('কোর্সের বিস্তারিত আনতে সমস্যা হয়েছে।');
          }

          const json = await response.json();
          setCourse(json);
        } catch (e) {
          console.error(e);
          setError(e.message);
        } finally {
          setLoading(false); // লোডিং শুধু সবশেষে বন্ধ হবে
        }
      }

      fetchCourseDetails(); // <-- ভেতরের ফাংশনটিকে কল করা হয়েছে

    }, [courseId, userToken, API_URL_BASE]) // <-- useCallback-এর ডিপেন্ডেন্সি
  );
  // ------------------------------------


  // --- ইউনিট কার্ড রেন্ডার করার ফাংশন (অপরিবর্তিত) ---
  const renderUnitCard = ({ item: unit }) => {
    const earned = unit.user_earned_points || 0;
    const total = unit.total_possible_points || 0;
    let percentage = 0;
    if (total > 0) {
      percentage = (earned / total) * 100;
    }

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('UnitDetail', {
          unitId: unit.id,
          unitTitle: unit.title
        })}
      >
        <Text style={styles.cardTitle}>Unit {unit.order}: {unit.title}</Text>
        
        {total > 0 ? (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{earned} / {total} Points ({percentage.toFixed(0)}%)</Text>
            <View style={styles.progressOuter}>
              <View style={[styles.progressInner, { width: `${percentage}%` }]} />
            </View>
          </View>
        ) : (
          <Text style={styles.progressText}>এই ইউনিটে কোনো পয়েন্ট নেই।</Text>
        )}
      </TouchableOpacity>
    );
  };

  // --- রেন্ডারিং ---
  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#0000ff" />;
  }

  if (error || !course) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>{error || 'কোর্সটি খুঁজে পাওয়া যায়নি।'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.description}>{course.description}</Text>
      
      <Text style={styles.header}>Units (ইউনিটসমূহ)</Text>
      <FlatList
        data={course.units}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUnitCard}
        ListEmptyComponent={<Text style={styles.errorText}>এই কোর্সে এখনো কোনো ইউনিট যোগ করা হয়নি।</Text>}
      />
    </View>
  );
}

// --- স্টাইল (অপরিবর্তিত) ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'gray', textAlign: 'center', marginTop: 20, fontSize: 16 },
  description: { fontSize: 16, color: '#333', padding: 15, backgroundColor: 'white', borderRadius: 10, marginBottom: 20, lineHeight: 24 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, paddingHorizontal: 5 },
  card: { backgroundColor: '#ffffff', padding: 20, marginBottom: 10, borderRadius: 10, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: '500', marginBottom: 10 },
  progressContainer: { marginTop: 5 },
  progressText: { fontSize: 12, color: '#555', marginBottom: 3 },
  progressOuter: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 },
  progressInner: { height: '100%', backgroundColor: '#007bff', borderRadius: 4 },
});