// screens/GroupJoinScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext'; 

export default function GroupJoinScreen({ navigation }) {
    const { userToken, API_URL_BASE } = useAuth();
    
    const [groupId, setGroupId] = useState('');
    const [loading, setLoading] = useState(false);

    // --- গ্রুপে যুক্ত হওয়ার হ্যান্ডলার (API Call) ---
    const handleJoinGroup = async () => {
        const trimmedGroupId = groupId.trim();
        if (trimmedGroupId === '') {
            Alert.alert('ত্রুটি', 'অনুগ্রহ করে গ্রুপের আইডি লিখুন।');
            return;
        }

        setLoading(true);

        try {
            // ব্যাকএন্ড API endpoint: /api/groups/<group_id>/join/
            const response = await fetch(`${API_URL_BASE}/api/groups/${trimmedGroupId}/join/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${userToken}`,
                },
                // POST রিকোয়েস্টে কোনো body দরকার নেই, কারণ group_id URL-এ আছে
            });
            
            const jsonResponse = await response.json();
            
            if (response.ok || response.status === 200) {
                // সফলভাবে যুক্ত হলে বা অলরেডি মেম্বার হলে
                Alert.alert('সফল', jsonResponse.detail);
                // গ্রুপ লিস্ট স্ক্রিনে ফিরে যান
                navigation.navigate('GroupListMain'); 
            } else if (response.status === 404) {
                Alert.alert('ব্যর্থ', 'এই আইডি-তে কোনো গ্রুপ খুঁজে পাওয়া যায়নি।');
            } else if (response.status === 403) {
                 Alert.alert('ব্যর্থ', 'আপনার এই অ্যাকশন করার অনুমতি নেই।');
            } else {
                Alert.alert('ব্যর্থ', jsonResponse.detail || 'গ্রুপে যুক্ত হওয়া যায়নি।');
            }

        } catch (e) {
            console.error("Join group error:", e);
            Alert.alert('ত্রুটি', 'নেটওয়ার্ক সমস্যা বা সার্ভার ত্রুটি।');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>একটি গ্রুপে যুক্ত হন</Text>
                <Text style={styles.subtitle}>গ্রুপের অ্যাডমিনের কাছ থেকে পাওয়া কোডটি এখানে দিন।</Text>
                
                {/* ১. গ্রুপের আইডি ইনপুট */}
                <Text style={styles.label}>গ্রুপ আইডি (Group ID)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="উদাহরণ: 42 (বা যে কোনো সংখ্যা)"
                    value={groupId}
                    onChangeText={setGroupId}
                    keyboardType="numeric"
                />
                
                {/* ২. জয়েন বাটন */}
                <TouchableOpacity
                    style={[styles.button, loading ? styles.buttonDisabled : null]}
                    onPress={handleJoinGroup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>গ্রুপে যুক্ত হন</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={{ marginTop: 20 }}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.goBackText}>ফিরে যান</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// --- স্টাইল ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: 'gray',
        marginBottom: 30,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginTop: 15,
        marginBottom: 8,
        width: '100%',
    },
    input: {
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 20,
        width: '100%',
    },
    button: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        minHeight: 50,
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#aaa',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    goBackText: {
        color: '#007bff',
        fontSize: 16,
    }
});