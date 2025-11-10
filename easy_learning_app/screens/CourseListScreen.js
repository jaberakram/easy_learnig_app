// screens/CourseListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; 
import { useAuth } from '../context/AuthContext'; 

export default function CourseListScreen({ route }) {
  const { categoryId } = route.params;
  const navigation = useNavigation();
  const { userToken, API_URL_BASE } = useAuth(); 

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  const fetchCourses = async () => {
    try {
      const url = `${API_URL_BASE}/api/courses/?category=${categoryId}`;
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
  };

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [categoryId, userToken, API_URL_BASE]) 
  );

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#0000ff" />;
  }

  if (error) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // --- (এই ফাংশনটি পরিবর্তন করা হয়েছে) ---
  const renderCourseCard = ({ item }) => {
    const earned = item.user_earned_points || 0;
    const total = item.total_possible_points || 0;
    let percentage = 0;
    if (total > 0) {
      percentage = (earned / total) * 100;
    }

    // --- (নতুন) প্রিমিয়াম লজিক ---
    const isLocked = item.is_premium && !item.is_enrolled;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => {
          // যদি কোর্সটি লক করা থাকে, তবে Paywall স্ক্রিনে পাঠান
          if (isLocked) {
            navigation.navigate('Paywall', { 
              courseId: item.id, 
              courseTitle: item.title 
            });
          } else {
            // অন্যথায় কোর্সের বিস্তারিত দেখান (আগের মতোই)
            navigation.navigate('CourseDetail', {
              courseId: item.id,
              courseTitle: item.title
            });
          }
        }}
      >
        <View style={styles.titleContainer}>
          {/* --- (নতুন) লক আইকন --- */}
          {isLocked && <Text style={styles.lockIcon}>🔒 </Text>}
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>

        <Text style={styles.cardDescription}>{item.description}</Text>
        
        {/* --- প্রোগ্রেস বার UI (অপরিবর্তিত) --- */}
        {total > 0 ? (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{earned} / {total} Points ({percentage.toFixed(0)}%)</Text>
            <View style={styles.progressOuter}>
              <View style={[styles.progressInner, { width: `${percentage}%` }]} />
            </View>
          </View>
        ) : (
          <Text style={styles.progressText}>এই কোর্সে কোনো পয়েন্ট নেই।</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {courses.length === 0 && (
        <Text style={styles.errorText}>এই ক্যাটাগরিতে এখনো কোনো কোর্স যোগ করা হয়নি।</Text>
      )}
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCourseCard} 
      />
    </View>
  );
}

// --- স্টাইল (প্রোগ্রেস বারের স্টাইল যোগ করা হয়েছে) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'gray',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 3,
  },
  // --- (নতুন) টাইটেল কনটেইনার ---
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1, // লেখা যেন আইকনের পাশে ঠিকভাবে বসে
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  progressContainer: { 
    marginTop: 15 
  },
  progressText: { 
    fontSize: 12, 
    color: '#555', 
    marginBottom: 3 
  },
  progressOuter: { 
    height: 8, 
    backgroundColor: '#e0e0e0', 
    borderRadius: 4 
  },
  progressInner: { 
    height: '100%', 
    backgroundColor: '#007bff', 
    borderRadius: 4 
  },
});