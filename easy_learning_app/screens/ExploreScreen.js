// screens/ExploreScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// --- কালার প্যালেট (আপনার দেওয়া নতুন প্যালেট) ---
const COLORS = {
  // নতুন প্যালেট: ["#f4f1de","#e07a5f","#3d405b","#81b29a","#f2cc8f"]
  background: '#F4F1DE', // Light Cream/Beige
  primary: '#E07A5F', // Coral/Burnt Orange (Highlight)
  accent: '#3D405B', // Dark Navy Blue (Text, Headings)
  progress: '#81B29A', // Muted Teal/Green 
  promoBg: '#F2CC8F', // Muted Gold/Mustard
  
  text: '#374151', 
  textLight: '#6B7280', 
  white: '#FFFFFF', 
  border: '#D1C8B4', 
  disabled: '#A5A6A2', 
};
// ------------------------------------------

export default function ExploreScreen() {
  const { userToken, API_URL_BASE } = useAuth();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  // --- ক্যাটাগরি ডেটা লোড করা ---
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL_BASE}/api/categories/`, {
        headers: {
          'Authorization': `Token ${userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('ক্যাটাগরি লোড করতে ব্যর্থ।');
      }

      const json = await response.json();
      setCategories(json);
    } catch (e) {
      console.error('Categories fetch error', e);
      setError(e.message || 'ডেটা লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  }, [userToken, API_URL_BASE]);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories])
  );
  
  // --- ক্যাটাগরি কার্ড রেন্ডার ---
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() =>
        navigation.navigate('CourseList', { 
            categoryId: item.id, 
            categoryName: item.name 
        })
      }
    >
      <View style={styles.iconContainer}>
        <Ionicons name="folder-open-outline" size={30} color={COLORS.primary} />
      </View>
      <Text style={styles.categoryTitle}>{item.name}</Text>
      <Ionicons name="chevron-forward-outline" size={20} color={COLORS.textLight} />
    </TouchableOpacity>
  );

  if (loading && categories.length === 0) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (error && categories.length === 0) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.reloadButton} onPress={fetchCategories}>
          <Text style={styles.reloadText}>Reload Categories</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
            <Text style={styles.headerTitle}>কোর্স ক্যাটাগরি</Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>কোনো ক্যাটাগরি খুঁজে পাওয়া যায়নি।</Text>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchCategories} colors={[COLORS.primary]} />
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
  listContainer: {
    padding: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 20,
    marginTop: 10,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    marginBottom: 12,
    borderRadius: 10,
    // সফট শ্যাডো
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '30', // প্রাইমারি রঙের ৩০% অস্বচ্ছতা
  },
  categoryTitle: {
    flex: 1,
    marginLeft: 15,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 50,
  },
  reloadButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  reloadText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: 30,
    fontSize: 16,
  },
});