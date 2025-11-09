// screens/ExploreScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // <-- নেভিগেশনের জন্য ইম্পোর্ট

// --- গুরুত্বপূর্ণ ---
// নিচের [আপনার_আইপি_অ্যাড্রেস] লেখাটি পরিবর্তন করে 
// আপনার কম্পিউটারের আসল আইপি অ্যাড্রেসটি লিখুন (যেমন: 192.168.0.200)
const API_URL = 'http://192.168.0.200:8000/api';

export default function ExploreScreen() {
  const navigation = useNavigation(); // <-- নেভিগেশন হুক
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories/`);
      const json = await response.json();
      setCategories(json);
    } catch (e) {
      console.error(e);
      setError('একটি সমস্যা হয়েছে। API চলছে কিনা দেখুন।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#0000ff" />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Categories</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            // --- এই onPress ফাংশনটি নতুন যোগ করা হয়েছে ---
            onPress={() => navigation.navigate('CourseList', { 
              categoryId: item.id,
              categoryName: item.name 
            })}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text>{item.courses.length} Courses</Text>
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
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 5,
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
});