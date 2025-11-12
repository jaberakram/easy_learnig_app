// screens/CreateGroupScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext'; 

export default function CreateGroupScreen({ navigation }) {
    const { userToken, API_URL_BASE } = useAuth();
    
    // --- নতুন স্টেট ---
    const [createdGroupId, setCreatedGroupId] = useState(null); // নতুন যোগ
    // -------------------
    const [groupTitle, setGroupTitle] = useState('');
    const [allCourses, setAllCourses] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]); // Array of course IDs
    const [loading, setLoading] = useState(false);
    const [coursesLoading, setCoursesLoading] = useState(true);

    // --- সব কোর্স লোড করা (API থেকে) ---
    useEffect(() => {
        const fetchAllCourses = async () => {
            try {
                const response = await fetch(`${API_URL_BASE}/api/courses/`, {
                    headers: {
                        'Authorization': `Token ${userToken}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('কোর্স লোড করা যায়নি।');
                }
                const courses = await response.json();
                setAllCourses(courses);
            } catch (e) {
                console.error("Course fetch error:", e);
                Alert.alert('ত্রুটি', 'কোর্স লোড করার সময় সমস্যা হয়েছে।');
            } finally {
                setCoursesLoading(false);
            }
        };
        fetchAllCourses();
    }, [userToken, API_URL_BASE]);
    
    // --- কোর্স নির্বাচনের হ্যান্ডলার ---
    const toggleCourseSelection = (courseId) => {
        if (selectedCourses.includes(courseId)) {
            setSelectedCourses(selectedCourses.filter(id => id !== courseId));
        } else {
            setSelectedCourses([...selectedCourses, courseId]);
        }
    };

    // --- গ্রুপ তৈরির হ্যান্ডলার (API Call) (পরিবর্তিত) ---
    const handleCreateGroup = async () => {
        if (groupTitle.trim() === '') {
            Alert.alert('ত্রুটি', 'অনুগ্রহ করে গ্রুপের নাম লিখুন।');
            return;
        }
        
        setLoading(true);
        setCreatedGroupId(null);

        try {
            const response = await fetch(`${API_URL_BASE}/api/groups/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${userToken}`,
                },
                body: JSON.stringify({
                    title: groupTitle.trim(),
                    courses: selectedCourses,
                }),
            });
            
            if (response.ok) {
                const newGroup = await response.json();
                
                // --- গ্রুপ আইডি সেভ ও প্রদর্শন (মূল ফিক্স) ---
                setCreatedGroupId(newGroup.id); 
                Alert.alert(
                    'গ্রুপ তৈরি সফল!', 
                    `আপনার গ্রুপ "${newGroup.title}" তৈরি হয়েছে।\n\nঅন্যদের যোগ করার জন্য এই আইডিটি শেয়ার করুন: ${newGroup.id}`,
                    [{ text: 'OK', onPress: () => navigation.navigate('GroupDetail', { groupId: newGroup.id, groupTitle: newGroup.title, isAdmin: true }) }]
                );
            } else {
                const errorData = await response.json();
                const errorMsg = errorData.title?.[0] || 'গ্রুপ তৈরি করা যায়নি।';
                Alert.alert('ব্যর্থ', errorMsg);
            }

        } catch (e) {
            console.error("Create group error:", e);
            Alert.alert('ত্রুটি', 'নেটওয়ার্ক সমস্যা বা সার্ভার ত্রুটি।');
        } finally {
            setLoading(false);
        }
    };
    
    // --- রেন্ডার লজিক ---
    if (coursesLoading) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={{ marginTop: 10 }}>কোর্স লোড হচ্ছে...</Text>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <Text style={styles.header}>নতুন গ্রুপ তৈরি করুন</Text>
                
                {/* ১. গ্রুপের নাম ইনপুট */}
                <Text style={styles.label}>গ্রুপের নাম*</Text>
                <TextInput
                    style={styles.input}
                    placeholder="যেমন: Class 10 Batch 2025"
                    value={groupTitle}
                    onChangeText={setGroupTitle}
                />
                
                {/* ২. কোর্স নির্বাচন */}
                <Text style={styles.label}>কোর্স নির্বাচন করুন (ঐচ্ছিক)</Text>
                <View style={styles.courseList}>
                    {allCourses.map(course => (
                        <TouchableOpacity
                            key={course.id}
                            style={[
                                styles.coursePill,
                                selectedCourses.includes(course.id) ? styles.courseSelected : styles.courseUnselected
                            ]}
                            onPress={() => toggleCourseSelection(course.id)}
                            disabled={loading}
                        >
                            <Text style={[styles.courseText, selectedCourses.includes(course.id) ? {color: 'white'} : {color: '#333'}]}>
                                {course.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {allCourses.length === 0 && (
                        <Text style={{ color: 'gray', textAlign: 'center', marginTop: 10 }}>
                            কোনো কোর্স পাওয়া যায়নি।
                        </Text>
                    )}
                </View>

                {/* ৩. তৈরি বাটন */}
                <TouchableOpacity
                    style={[styles.button, loading ? styles.buttonDisabled : null]}
                    onPress={handleCreateGroup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>গ্রুপ তৈরি করুন</Text>
                    )}
                </TouchableOpacity>
                
                {/* --- নতুন: তৈরি করা আইডি প্রদর্শন (ভিজুয়াল কনফার্মেশন) --- */}
                {createdGroupId && (
                     <View style={styles.successBox}>
                        <Text style={styles.successText}>গ্রুপ আইডি: {createdGroupId}</Text>
                        <Text style={styles.shareText}>এই আইডিটি দিয়ে অন্যেরা গ্রুপে যুক্ত হতে পারবে।</Text>
                     </View>
                )}
                {/* ------------------------------------------ */}

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
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 25,
        color: '#333',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginTop: 15,
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 10,
    },
    courseList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    coursePill: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
    },
    courseUnselected: {
        backgroundColor: '#e9ecef',
        borderColor: '#ced4da',
    },
    courseSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    courseText: {
        fontSize: 14,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
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
    successBox: {
        backgroundColor: '#d4edda',
        borderColor: '#c3e6cb',
        borderWidth: 1,
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
        alignItems: 'center',
    },
    successText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#155724',
    },
    shareText: {
        fontSize: 14,
        color: '#155724',
        marginTop: 5,
        textAlign: 'center',
    },
});