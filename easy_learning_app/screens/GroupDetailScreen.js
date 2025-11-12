// screens/GroupDetailScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; 

export default function GroupDetailScreen({ route }) {
  const { groupId, groupTitle, isAdmin } = route.params;
  const navigation = useNavigation();
  const { userToken, API_URL_BASE } = useAuth(); 

  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);

  // --- API থেকে ডেটা আনার ফাংশন ---
  const fetchGroupDetailsAndLeaderboard = useCallback(async () => {
    if (!groupId || !userToken || !API_URL_BASE) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // ১. গ্রুপ ডেটা আনা
      const groupResponse = await fetch(`${API_URL_BASE}/api/groups/${groupId}/`, {
        headers: { 'Authorization': `Token ${userToken}` },
      });

      // ২. লিডারবোর্ড ডেটা আনা
      const leaderboardResponse = await fetch(`${API_URL_BASE}/api/groups/${groupId}/leaderboard/`, {
        headers: { 'Authorization': `Token ${userToken}` },
      });

      if (!groupResponse.ok) {
        if (groupResponse.status === 403) {
             throw new Error('এই গ্রুপের বিস্তারিত দেখতে আপনাকে অবশ্যই মেম্বার হতে হবে।');
        } else {
            throw new Error('গ্রুপের তথ্য আনতে সমস্যা হয়েছে।');
        }
      }
      if (!leaderboardResponse.ok) {
        if (leaderboardResponse.status === 403) {
             throw new Error('লিডারবোর্ড দেখতে আপনাকে অবশ্যই মেম্বার হতে হবে।');
        } else {
            throw new Error('লিডারবোর্ড ডেটা লোড করা যায়নি।');
        }
      }
      
      const groupJson = await groupResponse.json();
      const leaderboardJson = await leaderboardResponse.json();

      setGroupData(groupJson);
      setLeaderboard(leaderboardJson);

    } catch (e) {
      console.error('Data fetch error:', e);
      setError(e.message || 'ডেটা লোড করতে ব্যর্থ।');
    } finally {
      setLoading(false);
    }
  }, [groupId, userToken, API_URL_BASE]); 

  // যখনই স্ক্রিন ফোকাস হবে, তখনই ডেটা রিফ্রেশ হবে
  useFocusEffect(
    useCallback(() => {
      fetchGroupDetailsAndLeaderboard();
    }, [fetchGroupDetailsAndLeaderboard])
  );

  // --- লিডারবোর্ড কার্ড রেন্ডার ---
  const renderLeaderboardItem = ({ item }) => {
    let rankStyle = styles.rankText;
    if (item.rank === 1) {
        rankStyle = [styles.rankText, styles.rank1];
    } else if (item.rank === 2) {
        rankStyle = [styles.rankText, styles.rank2];
    } else if (item.rank === 3) {
        rankStyle = [styles.rankText, styles.rank3];
    }
    
    const isCurrentUser = item.username === userToken.split('.')[0]; 
    
    const itemStyle = isCurrentUser ? [styles.leaderboardItem, styles.currentUserItem] : styles.leaderboardItem;

    return (
      <View style={itemStyle}>
        <Text style={rankStyle}>{item.rank}</Text>
        <Text style={styles.nameText}>{item.username} {isCurrentUser && "(You)"}</Text>
        <Text style={styles.scoreText}>
            {item.total_score || 0} Points
        </Text>
      </View>
    );
  };
  
  // --- রেন্ডারিং লজিক ---
  if (loading && !groupData) { 
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
        <TouchableOpacity style={styles.button} onPress={fetchGroupDetailsAndLeaderboard}>
            <Text style={styles.buttonText}>Reload</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // FIX: courses_detail ব্যবহার করে কোর্সের নামগুলো কমা দিয়ে সাজানো
  const courseTitles = groupData?.courses_detail?.map(course => course.title).join(', ') || 'No Courses Added';
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchGroupDetailsAndLeaderboard} />
        }
      >
        {/* --- গ্রুপের তথ্য --- */}
        <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Group Info</Text>
            {/* গ্রুপের আইডি দেখান, যাতে অ্যাডমিন সহজেই এটি শেয়ার করতে পারে */}
            {isAdmin && <Text style={[styles.infoDetail, {fontWeight: 'bold', color: '#dc3545'}]}><Ionicons name="key" size={16} color="#dc3545" /> Group ID: {groupData?.id}</Text>}
            <Text style={styles.infoDetail}><Ionicons name="people" size={16} color="#007bff" /> Total Members: {groupData?.member_count || 0}</Text>
            <Text style={styles.infoDetail}><Ionicons name="book" size={16} color="#28a745" /> Courses: {courseTitles}</Text>
            {isAdmin && <Text style={styles.adminNote}>You are the Admin of this group.</Text>}
        </View>

        {/* --- লিডারবোর্ড --- */}
        <Text style={styles.leaderboardHeader}>🏆 Group Leaderboard</Text>
        
        {leaderboard.length === 0 ? (
            <Text style={styles.emptyText}>এই গ্রুপে এখনো কোনো কুইজ অ্যাটেম্পট করা হয়নি।</Text>
        ) : (
            <>
                {/* --- Header Row --- */}
                <View style={[styles.leaderboardItem, styles.headerRow]}>
                    <Text style={[styles.rankText, styles.headerText]}>#</Text>
                    <Text style={[styles.nameText, styles.headerText]}>Member</Text>
                    <Text style={[styles.scoreText, styles.headerText]}>Score</Text>
                </View>
                {/* --------------------------- */}
                <FlatList
                    data={leaderboard}
                    keyExtractor={(item) => item.username}
                    renderItem={renderLeaderboardItem}
                    scrollEnabled={false} 
                />
            </>
        )}
        
      </ScrollView>
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
  container: {
    padding: 15,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  emptyText: {
      color: 'gray',
      textAlign: 'center',
      padding: 20,
      fontSize: 16,
      backgroundColor: 'white',
      borderRadius: 10,
  },
  infoCard: {
      backgroundColor: 'white',
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      elevation: 2,
  },
  infoTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingBottom: 5,
  },
  infoDetail: {
      fontSize: 14,
      color: '#555',
      marginBottom: 5,
  },
  adminNote: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#ffc107',
      marginTop: 10,
  },
  leaderboardHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  // --- লিডারবোর্ড স্টাইল ---
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  headerRow: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  currentUserItem: {
      borderWidth: 2,
      borderColor: '#007bff',
      backgroundColor: '#e6f2ff',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 30, // র‍্যাঙ্কের জন্য নির্দিষ্ট প্রস্থ
    textAlign: 'center',
    color: '#333',
  },
  nameText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
    color: '#333',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  rank1: {
      color: '#FFD700', // Gold
      fontSize: 20,
  },
  rank2: {
      color: '#C0C0C0', // Silver
      fontSize: 19,
  },
  rank3: {
      color: '#CD7F32', // Bronze
      fontSize: 18,
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