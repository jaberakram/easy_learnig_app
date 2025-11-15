// screens/GroupDetailScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ----------------------------------------

// --- গ্রুপ ডিটেইলস এর হেডার কম্পোনেন্ট ---
const GroupHeader = ({ group, onLeaveGroup }) => {
    const navigation = useNavigation();
    
    return (
        <View style={styles.headerContainer}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <Text style={styles.adminText}>
                Admin: <Text style={styles.adminName}>{group.admin.username}</Text>
            </Text>
            
            {/* --- গ্রুপে লিংক করা কোর্স --- */}
            {group.courses_detail && group.courses_detail.length > 0 && (
                <View style={styles.courseSection}>
                    <Text style={styles.listHeader}>Linked Courses</Text>
                    {group.courses_detail.map(course => (
                        <TouchableOpacity 
                            key={course.id} 
                            style={styles.courseCard}
                            onPress={() => navigation.navigate('ExploreStack', { 
                                screen: 'CourseDetail', 
                                params: { courseId: course.id, courseTitle: course.title } 
                            })}
                        >
                            <Ionicons name="school-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.courseTitle}>{course.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* --- গ্রুপ লিভ বাটন --- */}
            <TouchableOpacity style={styles.leaveButton} onPress={onLeaveGroup}>
                <Ionicons name="exit-outline" size={18} color={COLORS.error} />
                <Text style={styles.leaveButtonText}>Leave Group</Text>
            </TouchableOpacity>

            <Text style={styles.listHeader}>Leaderboard</Text>
        </View>
    );
};

export default function GroupDetailScreen({ route }) {
    const { groupId } = route.params;
    const { userToken, API_URL_BASE } = useAuth();
    const navigation = useNavigation();

    const [groupData, setGroupData] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- গ্রুপ ডিটেইলস ও লিডারবোর্ড লোড করা ---
    const fetchGroupDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // গ্রুপের তথ্য
            const groupResponse = await fetch(`${API_URL_BASE}/api/groups/${groupId}/`, {
                headers: { 'Authorization': `Token ${userToken}` },
            });
            if (!groupResponse.ok) throw new Error('গ্রুপের তথ্য আনতে সমস্যা হয়েছে।');
            const groupJson = await groupResponse.json();
            setGroupData(groupJson);

            // লিডারবোর্ডের তথ্য
            const leaderboardResponse = await fetch(`${API_URL_BASE}/api/groups/${groupId}/leaderboard/`, {
                headers: { 'Authorization': `Token ${userToken}` },
            });
            if (!leaderboardResponse.ok) throw new Error('লিডারবোর্ড আনতে সমস্যা হয়েছে।');
            const leaderboardJson = await leaderboardResponse.json();
            setLeaderboard(leaderboardJson);

        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [userToken, API_URL_BASE, groupId]);

    useFocusEffect(
        useCallback(() => {
            fetchGroupDetails();
        }, [fetchGroupDetails])
    );

    // --- গ্রুপ লিভ করার ফাংশন ---
    const handleLeaveGroup = async () => {
        Alert.alert(
            "গ্রুপ ত্যাগ",
            "আপনি কি নিশ্চিতভাবে এই গ্রুপটি ত্যাগ করতে চান?",
            [
                { text: "না", style: "cancel" },
                {
                    text: "হ্যাঁ",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_URL_BASE}/api/groups/${groupId}/leave/`, {
                                method: 'POST',
                                headers: { 'Authorization': `Token ${userToken}` },
                            });
                            if (!response.ok) {
                                const err = await response.json();
                                throw new Error(err.detail || 'গ্রুপ ত্যাগ করা যায়নি।');
                            }
                            navigation.goBack();
                        } catch (e) {
                            Alert.alert("Error", e.message);
                        }
                    }
                }
            ]
        );
    };

    // --- লিডারবোর্ড আইটেম রেন্ডার ---
    const renderLeaderboardItem = ({ item }) => (
        <View style={styles.memberCard}>
            <Text style={styles.rank}>{item.rank}.</Text>
            <Ionicons name="person-circle" size={30} color={COLORS.textLight} />
            <Text style={styles.memberName}>{item.username}</Text>
            <View style={styles.scoreContainer}>
                <Ionicons name="trophy" size={16} color={COLORS.promoBg} />
                <Text style={styles.scoreText}>{item.total_score}</Text>
            </View>
        </View>
    );

    if (loading && !groupData) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={leaderboard}
                keyExtractor={(item) => item.username}
                renderItem={renderLeaderboardItem}
                ListHeaderComponent={
                    <GroupHeader group={groupData} onLeaveGroup={handleLeaveGroup} />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>এই গ্রুপে এখনো কোনো লিডারবোর্ড ডেটা নেই।</Text>
                }
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchGroupDetails} colors={[COLORS.primary]} />
                }
                contentContainerStyle={styles.listContainer}
            />
        </SafeAreaView>
    );
}

// --- স্টাইল (থিম কালার ব্যবহার করে আপডেট) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background, // পরিবর্তন
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background, // পরিবর্তন
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    headerContainer: {
        paddingBottom: 20,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border, // পরিবর্তন
    },
    groupTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
        marginBottom: 5,
    },
    adminText: {
        fontSize: 14,
        color: COLORS.textLight, // পরিবর্তন
    },
    adminName: {
        fontWeight: '600',
        color: COLORS.text, // পরিবর্তন
    },
    courseSection: {
        marginTop: 20,
    },
    courseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white, // পরিবর্তন
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border, // পরিবর্তন
        marginBottom: 8,
    },
    courseTitle: {
        fontSize: 14,
        color: COLORS.primary, // পরিবর্তন
        fontWeight: '500',
        marginLeft: 10,
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginTop: 20,
        backgroundColor: COLORS.error + '20', // পরিবর্তন
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.error + '50', // পরিবর্তন
    },
    leaveButtonText: {
        color: COLORS.error, // পরিবর্তন
        fontWeight: 'bold',
        marginLeft: 8,
    },
    listHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
        marginTop: 25,
        marginBottom: 10,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white, // পরিবর্তন
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    rank: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textLight, // পরিবর্তন
        marginRight: 10,
        minWidth: 25,
    },
    memberName: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text, // পরিবর্তন
        marginLeft: 10,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
        marginLeft: 5,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 30,
        color: COLORS.textLight, // পরিবর্তন
    },
    errorText: {
        color: COLORS.error, // পরিবর্তন
        textAlign: 'center',
        margin: 20,
    },
});