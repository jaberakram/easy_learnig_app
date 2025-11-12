// screens/GroupListScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; 

export default function GroupListScreen() {
  const navigation = useNavigation();
  const { userToken, API_URL_BASE } = useAuth(); 

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);

  // --- API থেকে গ্রুপ ডেটা আনার ফাংশন ---
  const fetchGroups = useCallback(async () => {
    if (!userToken || !API_URL_BASE) return;
    try {
      setLoading(true);
      setError(null);
      
      const url = `${API_URL_BASE}/api/groups/`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${userToken}`, 
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized. Please log in.');
      }
      if (!response.ok) {
        throw new Error('গ্রুপের তালিকা আনতে সমস্যা হয়েছে।');
      }
      
      const json = await response.json();
      setGroups(json);

    } catch (e) {
      console.error('Group fetch error', e);
      setError(e.message || 'গ্রুপ লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  }, [userToken, API_URL_BASE]); 

  // যখনই স্ক্রিন ফোকাস হবে, তখনই ডেটা রিফ্রেশ হবে
  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  // --- নেভিগেশন হেডার বাটন সেট করা (আপডেট) ---
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('CreateGroup')} 
          style={{ marginRight: 15 }}
        >
          <Ionicons name="add-circle" size={28} color="#007bff" />
        </TouchableOpacity>
      ),
      // --- জয়েন বাটন যুক্ত করা হলো ---
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => navigation.navigate('GroupJoin')} // GroupJoin স্ক্রিনে নেভিগেট করুন
          style={{ marginLeft: 15 }}
        >
          <Ionicons name="person-add" size={24} color="#28a745" />
        </TouchableOpacity>
      ),
      // -----------------------------
    });
  }, [navigation]);

  // --- কার্ড রেন্ডার ফাংশন ---
  const renderGroupCard = ({ item }) => {
    // এখানে isAdmin চেক করার জন্য GroupMembership-এর is_group_admin ফিল্ডটি ব্যবহার করা উচিত।
    // যেহেতু সিরিয়ালাইজারে admin.username আছে, আমরা আপাতত ইউজারনেম দিয়ে চেক করছি (যদি ইউজারনেম ইমেইলের অংশ হয়)
    const isAdmin = item.admin.username === userToken.split('.')[0]; 
    const cardStyle = isAdmin ? [styles.card, styles.adminCard] : styles.card;

    return (
      <TouchableOpacity 
        style={cardStyle}
        onPress={() => navigation.navigate('GroupDetail', {
          groupId: item.id,
          groupTitle: item.title,
          isAdmin: isAdmin, 
        })}
      >
        <Text style={styles.cardTitle}>{item.title}</Text>
        
        <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
                <Ionicons name="person-circle" size={16} color="#007bff" /> Admin: {item.admin.username} {isAdmin && "(You)"}
            </Text>
            <Text style={styles.infoText}>
                <Ionicons name="people" size={16} color="#28a745" /> Members: {item.member_count}
            </Text>
        </View>

      </TouchableOpacity>
    );
  };

  // --- রেন্ডারিং লজিক ---
  if (loading && groups.length === 0) { 
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={fetchGroups}>
            <Text style={styles.buttonText}>Reload</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.listContainer}
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGroupCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              আপনি কোনো গ্রুপের সদস্য নন। 
            </Text>
            <Text style={styles.emptyText}>
              নতুন গ্রুপ তৈরি করতে উপরের <Text style={{fontWeight: 'bold'}}>+</Text> আইকনে ক্লিক করুন।
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchGroups} />
        }
      />
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
  listContainer: {
    padding: 15,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#007bff',
  },
  adminCard: {
    borderLeftColor: '#ffc107',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 50,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});