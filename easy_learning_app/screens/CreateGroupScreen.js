// screens/CreateGroupScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ----------------------------------------

export default function CreateGroupScreen() {
    const [title, setTitle] = useState('');
    const [allCourses, setAllCourses] = useState([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true); // কোর্স লোড করার জন্য
    const { userToken, API_URL_BASE } = useAuth();
    const navigation = useNavigation();

    // --- কোর্স তালিকা লোড করা ---
    const fetchAllCourses = useCallback(async () => {
        setPageLoading(true);
        try {
            const response = await fetch(`${API_URL_BASE}/api/courses/`, {
                headers: { 'Authorization': `Token ${userToken}` },
            });
            if (!response.ok) throw new Error('কোর্স তালিকা আনতে সমস্যা হয়েছে।');
            const data = await response.json();
            setAllCourses(data);
        } catch (e) {
            Alert.alert("ত্রুটি", e.message);
        } finally {
            setPageLoading(false);
        }
    }, [userToken, API_URL_BASE]);

    useFocusEffect(
        useCallback(() => {
            fetchAllCourses();
        }, [fetchAllCourses])
    );

    // --- কোর্স সিলেক্ট/আনসিলেক্ট ---
    const toggleCourseSelection = (courseId) => {
        setSelectedCourseIds(prevIds => {
            if (prevIds.includes(courseId)) {
                return prevIds.filter(id => id !== courseId);
            } else {
                return [...prevIds, courseId];
            }
        });
    };

    // --- গ্রুপ তৈরি করার ফাংশন ---
    const handleCreateGroup = async () => {
        if (!title.trim()) {
            Alert.alert("ত্রুটি", "অনুগ্রহ করে গ্রুপের একটি নাম দিন।");
            return;
        }

        setLoading(true);
        try {
            const body = JSON.stringify({
                title: title.trim(),
                courses: selectedCourseIds,
            });

            const response = await fetch(`${API_URL_BASE}/api/groups/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${userToken}`,
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            if (response.status === 201) {
                const newGroup = await response.json();
                Alert.alert("সফল!", "গ্রুপ সফলভাবে তৈরি হয়েছে।");
                navigation.replace('GroupDetail', { groupId: newGroup.id, groupTitle: newGroup.title });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'গ্রুপ তৈরি করা যায়নি।');
            }
        } catch (e) {
            console.error(e);
            Alert.alert("ত্রুটি", e.message);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>নতুন গ্রুপ তৈরি করুন</Text>
                
                <Text style={styles.label}>গ্রুপের নাম:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="যেমন: Class 10 Batch"
                    value={title}
                    onChangeText={setTitle}
                />
                
                <Text style={styles.label}>কোর্সসমূহ (ঐচ্ছিক):</Text>
                <Text style={styles.subtitle}>এই গ্রুপের জন্য কোন কোর্সগুলো লিংক করতে চান?</Text>

                <View style={styles.courseListContainer}>
                    {allCourses.length > 0 ? (
                        allCourses.map((course) => {
                            const isSelected = selectedCourseIds.includes(course.id);
                            return (
                                <TouchableOpacity
                                    key={course.id}
                                    style={[styles.courseItem, isSelected && styles.selectedCourseItem]}
                                    onPress={() => toggleCourseSelection(course.id)}
                                >
                                    <Ionicons 
                                        name={isSelected ? "checkbox" : "square-outline"} 
                                        size={22} 
                                        color={isSelected ? COLORS.primary : COLORS.textLight} 
                                    />
                                    <Text style={styles.courseItemText}>{course.title}</Text>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyCourseText}>কোনো কোর্স পাওয়া যায়নি।</Text>
                    )}
                </View>
                
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleCreateGroup} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.buttonText}>Create Group</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// --- স্টাইল (থিম কালার ব্যবহার করে আপডেট) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // পরিবর্তন
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background, // পরিবর্তন
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text, // পরিবর্তন
        marginBottom: 8,
        marginTop: 10,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textLight, // পরিবর্তন
        marginBottom: 15,
    },
    input: {
        backgroundColor: COLORS.white, // পরিবর্তন
        padding: 15,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border, // পরিবর্তন
    },
    courseListContainer: {
        maxHeight: 300, // উচ্চতা সীমাবদ্ধ করা
        borderWidth: 1,
        borderColor: COLORS.border, // পরিবর্তন
        borderRadius: 8,
        marginTop: 5,
        backgroundColor: COLORS.white, // পরিবর্তন
    },
    courseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border, // পরিবর্তন
    },
    selectedCourseItem: {
        backgroundColor: COLORS.primary + '15', // পরিবর্তন (হালকা প্রাইমারি)
    },
    courseItemText: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text, // পরিবর্তন
        marginLeft: 12,
    },
    emptyCourseText: {
        padding: 15,
        color: COLORS.textLight, // পরিবর্তন
        textAlign: 'center',
    },
    button: {
        backgroundColor: COLORS.primary, // পরিবর্তন
        padding: 18,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
        minHeight: 58,
        justifyContent: 'center',
    },
    buttonText: {
        color: COLORS.white, // পরিবর্তন
        fontSize: 16,
        fontWeight: 'bold',
    },
});