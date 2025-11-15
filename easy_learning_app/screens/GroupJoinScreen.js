// screens/GroupJoinScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ----------------------------------------

export default function GroupJoinScreen() {
    const [groupId, setGroupId] = useState('');
    const [loading, setLoading] = useState(false);
    const { userToken, API_URL_BASE } = useAuth();
    const navigation = useNavigation();

    // --- গ্রুপে জয়েন করার ফাংশন ---
    const handleJoinGroup = async () => {
        if (!groupId.trim()) {
            Alert.alert("ত্রুটি", "অনুগ্রহ করে একটি গ্রুপ আইডি দিন।");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL_BASE}/api/groups/${groupId.trim()}/join/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${userToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                const data = await response.json();
                Alert.alert("সফল!", data.message);
                // গ্রুপ ডিটেইল পেজে নেভিগেট করা
                navigation.replace('GroupDetail', { groupId: data.group.id, groupTitle: data.group.title });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'গ্রুপে যোগ দেওয়া যায়নি।');
            }
        } catch (e) {
            console.error(e);
            Alert.alert("ত্রুটি", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>গ্রুপে যোগ দিন</Text>
                <Text style={styles.subtitle}>গ্রুপ অ্যাডমিনের দেওয়া আইডিটি এখানে লিখুন।</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Group ID"
                    value={groupId}
                    onChangeText={setGroupId}
                    autoCapitalize="none"
                    keyboardType="numeric" // সাধারণত আইডি নিউমেরিক হয়
                />
                
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleJoinGroup} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.buttonText}>Join Group</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// --- স্টাইল (থিম কালার ব্যবহার করে আপডেট) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // পরিবর্তন
    },
    content: {
        flex: 1,
        padding: 20,
        marginTop: 20, // কন্টেন্ট একটু নিচে নামানো
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight, // পরিবর্তন
        marginBottom: 30,
    },
    input: {
        backgroundColor: COLORS.white, // পরিবর্তন
        padding: 15,
        borderRadius: 8,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border, // পরিবর্তন
    },
    button: {
        backgroundColor: COLORS.primary, // পরিবর্তন
        padding: 18,
        borderRadius: 8,
        alignItems: 'center',
        minHeight: 58,
        justifyContent: 'center',
    },
    buttonText: {
        color: COLORS.white, // পরিবর্তন
        fontSize: 16,
        fontWeight: 'bold',
    },
});