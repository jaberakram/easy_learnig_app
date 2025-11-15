// screens/GroupListScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ----------------------------------------

export default function GroupListScreen() {
    const { userToken, API_URL_BASE } = useAuth();
    const navigation = useNavigation();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- গ্রুপ তালিকা লোড করা ---
    const fetchGroups = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL_BASE}/api/groups/`, {
                headers: {
                    'Authorization': `Token ${userToken}`,
                },
            });
            if (!response.ok) {
                throw new Error('গ্রুপের তালিকা আনতে সমস্যা হয়েছে।');
            }
            const data = await response.json();
            setGroups(data);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [userToken, API_URL_BASE]);

    useFocusEffect(
        useCallback(() => {
            fetchGroups();
        }, [fetchGroups])
    );

    // --- গ্রুপ কার্ড রেন্ডার ---
    const renderGroupItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.groupCard}
            onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, groupTitle: item.title })}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="people-circle-outline" size={30} color={COLORS.primary} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.groupTitle}>{item.title}</Text>
                <Text style={styles.groupAdmin}>Admin: {item.admin.username}</Text>
            </View>
            <View style={styles.memberInfo}>
                <Ionicons name="person" size={16} color={COLORS.textLight} />
                <Text style={styles.groupMembers}>{item.member_count}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && groups.length === 0) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* --- হেডার বাটন --- */}
            <View style={styles.headerButtons}>
                <TouchableOpacity 
                    style={[styles.button, styles.primaryButton]} 
                    onPress={() => navigation.navigate('CreateGroup')}
                >
                    <Ionicons name="add" size={16} color={COLORS.white} />
                    <Text style={styles.buttonText}>Create Group</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.button, styles.secondaryButton]} 
                    onPress={() => navigation.navigate('GroupJoin')}
                >
                    <Ionicons name="enter-outline" size={16} color={COLORS.primary} />
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Join Group</Text>
                </TouchableOpacity>
            </View>
            
            {/* --- গ্রুপের তালিকা --- */}
            <FlatList
                data={groups}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderGroupItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>আপনি এখনো কোনো গ্রুপে যোগ দেননি।</Text>
                }
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchGroups} colors={[COLORS.primary]} />
                }
                ListHeaderComponent={
                    error ? <Text style={styles.errorText}>{error}</Text> : null
                }
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
    headerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border, // পরিবর্তন
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
    },
    primaryButton: {
        backgroundColor: COLORS.primary, // পরিবর্তন
        marginRight: 8,
    },
    secondaryButton: {
        backgroundColor: COLORS.white, // পরিবর্তন
        borderWidth: 1,
        borderColor: COLORS.primary, // পরিবর্তন
        marginLeft: 8,
    },
    buttonText: {
        color: COLORS.white, // পরিবর্তন
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 5,
    },
    secondaryButtonText: {
        color: COLORS.primary, // পরিবর্তন
    },
    listContainer: {
        padding: 15,
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white, // পরিবর্তন
        padding: 15,
        borderRadius: 10,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    iconContainer: {
        padding: 10,
        borderRadius: 25, // বৃত্তাকার
        backgroundColor: COLORS.primary + '20', // পরিবর্তন
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
    },
    groupAdmin: {
        fontSize: 12,
        color: COLORS.textLight, // পরিবর্তন
        marginTop: 2,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupMembers: {
        fontSize: 14,
        color: COLORS.textLight, // পরিবর্তন
        marginLeft: 4,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: COLORS.textLight, // পরিবর্তন
    },
    errorText: {
        color: COLORS.error, // পরিবর্তন
        textAlign: 'center',
        marginBottom: 10,
    },
});