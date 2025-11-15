// screens/ProfileScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ----------------------------------------

export default function ProfileScreen() {
    const { logout, userToken, API_URL_BASE } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- প্রোফাইল ডেটা লোড করা ---
    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL_BASE}/api/profile/`, {
                headers: {
                    'Authorization': `Token ${userToken}`,
                },
            });
            if (!response.ok) {
                throw new Error('প্রোফাইলের তথ্য আনতে সমস্যা হয়েছে।');
            }
            const data = await response.json();
            setProfileData(data);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [userToken, API_URL_BASE]);

    useFocusEffect(
        useCallback(() => {
            fetchProfileData();
        }, [fetchProfileData])
    );

    // --- লগআউট কনফার্মেশন ---
    const handleLogout = () => {
        Alert.alert(
            "লগআউট",
            "আপনি কি নিশ্চিতভাবে লগআউট করতে চান?",
            [
                {
                    text: "না",
                    style: "cancel"
                },
                { 
                    text: "হ্যাঁ", 
                    onPress: () => logout(),
                    style: "destructive"
                }
            ]
        );
    };
    
    // --- লোডিং বা এরর অবস্থা ---
    if (loading && !profileData) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (error && !profileData) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchProfileData} colors={[COLORS.primary]} />
                }
            >
                {/* --- প্রোফাইল হেডার --- */}
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={60} color={COLORS.primary} />
                    </View>
                    <Text style={styles.username}>{profileData?.username || 'Username'}</Text>
                    <Text style={styles.email}>{profileData?.email || 'email@example.com'}</Text>
                </View>

                {/* --- স্ট্যাটাস কার্ড (পয়েন্ট) --- */}
                <View style={styles.statsCard}>
                    <Ionicons name="trophy" size={30} color={COLORS.promoBg} />
                    <View style={styles.statContent}>
                        <Text style={styles.statValue}>{profileData?.total_points || 0}</Text>
                        <Text style={styles.statLabel}>Total Points Earned</Text>
                    </View>
                </View>

                {/* --- সেটিংস মেনু (উদাহরণ) --- */}
                <View style={styles.menuContainer}>
                    <Text style={styles.menuHeader}>Settings</Text>
                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Coming Soon", "এই ফিচারটি শীঘ্রই আসছে।")}>
                        <Ionicons name="keypad-outline" size={22} color={COLORS.textLight} />
                        <Text style={styles.menuItemText}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={22} color={COLORS.textLight} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Coming Soon", "এই ফিচারটি শীঘ্রই আসছে।")}>
                        <Ionicons name="notifications-outline" size={22} color={COLORS.textLight} />
                        <Text style={styles.menuItemText}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={22} color={COLORS.textLight} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Contact", "যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন।")}>
                        <Ionicons name="help-buoy-outline" size={22} color={COLORS.textLight} />
                        <Text style={styles.menuItemText}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={22} color={COLORS.textLight} />
                    </TouchableOpacity>
                </View>

                {/* --- লগআউট বাটন --- */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
                    <Text style={styles.logoutButtonText}>লগআউট</Text>
                </TouchableOpacity>

            </ScrollView>
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
    container: {
        padding: 20,
    },
    errorText: {
        color: COLORS.error, // পরিবর্তন
        fontSize: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.white, // পরিবর্তন
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary, // পরিবর্তন
        marginBottom: 15,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
    },
    email: {
        fontSize: 16,
        color: COLORS.textLight, // পরিবর্তন
        marginTop: 4,
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white, // পরিবর্তন
        padding: 20,
        borderRadius: 10,
        marginBottom: 30,
        borderLeftWidth: 5,
        borderLeftColor: COLORS.promoBg, // পরিবর্তন (হলুদ)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statContent: {
        marginLeft: 15,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.textLight, // পরিবর্তন
        marginTop: 2,
    },
    menuContainer: {
        marginBottom: 30,
    },
    menuHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text, // পরিবর্তন
        marginBottom: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white, // পরিবর্তন
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text, // পরিবর্তন
        marginLeft: 15,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white, // পরিবর্তন
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.error + '50', // পরিবর্তন (হালকা লাল বর্ডার)
    },
    logoutButtonText: {
        color: COLORS.error, // পরিবর্তন
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});