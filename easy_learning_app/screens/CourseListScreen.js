// screens/CourseListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // <-- নেভিগেশনের জন্য ইম্পোর্ট

// --- আপনার আইপি অ্যাড্রেসটি এখানে বসান ---
const API_URL = 'http://192.168.0.200:8000/api';

export default function CourseListScreen({ route }) {
  const { categoryId } = route.params;
  const navigation = useNavigation(); // <-- নেভিগেশন হুক

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${API_URL}/courses/?category=${categoryId}`);
        const json = await response.json();
        setCourses(json);
      } catch (e) {
        console.error(e);
        setError('কোর্স আনতে সমস্যা হয়েছে।');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [categoryId]);

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

  return (
    <View style={styles.container}>
      {courses.length === 0 && (
        <Text style={styles.errorText}>এই ক্যাটাগরিতে এখনো কোনো কোর্স যোগ করা হয়নি।</Text>
      )}

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          // --- এই TouchableOpacity আপডেট করা হয়েছে ---
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('CourseDetail', {
              courseId: item.id,
              courseTitle: item.title
            })}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// --- স্টাইল ---
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
});