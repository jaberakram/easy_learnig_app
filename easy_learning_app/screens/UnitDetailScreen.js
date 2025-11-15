// screens/UnitDetailScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// --- কালার প্যালেট ---
const COLORS = {
  background: '#F4F1DE', // Light Cream/Beige
  primary: '#E07A5F', // Coral/Burnt Orange (Button/CTA)
  accent: '#3D405B', // Dark Navy Blue (Text, Headings)
  progress: '#81B29A', // Muted Teal/Green (Completed)
  promoBg: '#F2CC8F', // Muted Gold/Mustard
  
  text: '#3D405B', 
  textLight: '#6B7280', 
  white: '#FFFFFF', 
  border: '#D1C8B4', 
  disabled: '#A5A6A2', 
};
// ------------------------------------------

// --- লেসন/কুইজ আইটেম কম্পোনেন্ট ---
const UnitItem = ({ item, navigation, type = 'lesson' }) => {
    
    let iconName, typeName, isCompleted, cardStyle, iconColor;

    if (type === 'lesson') {
        // FIX: আর্টিকেল আইকন পরিবর্তন
        iconName = item.has_video ? 'videocam-outline' : 'reader-outline'; 
        typeName = item.has_video ? 'Lesson (Video)' : 'Lesson (Article)';
        isCompleted = item.is_attempted; // FIX: পয়েন্ট-ভিত্তিক লজিক
        iconColor = isCompleted ? COLORS.progress : COLORS.accent;
    } else if (type === 'quiz') {
        iconName = 'help-circle-outline';
        typeName = 'Mastery Quiz';
        isCompleted = item.is_attempted;
        iconColor = isCompleted ? COLORS.progress : COLORS.primary;
    } else { // Game
        iconName = 'game-controller-outline';
        typeName = 'Unit Game';
        isCompleted = item.is_attempted;
        iconColor = isCompleted ? COLORS.progress : COLORS.progress;
    }

    // সম্পন্ন হলে কার্ডের স্টাইল পরিবর্তন
    cardStyle = isCompleted ? [styles.itemCard, styles.completedCard] : styles.itemCard;
    
    // স্ট্যাটাস আইকন
    const statusIcon = isCompleted 
        ? <Ionicons name="checkmark-circle" size={24} color={COLORS.progress} />
        : <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />;

    // আইটেম ট্যাপ হ্যান্ডলার
    const handlePress = () => {
        if (type === 'lesson') {
            navigation.navigate('LessonDetail', { 
                lessonId: item.id, 
                lessonTitle: item.title 
            });
        } else if (type === 'quiz') {
            navigation.navigate('QuizScreen', { 
                quizId: item.id, 
                quizTitle: item.title 
            });
        } else if (type === 'game') {
            navigation.navigate('MatchingGame', { 
                gameId: item.id, 
                gameTitle: item.title 
            });
        }
    };

    return (
        <TouchableOpacity style={cardStyle} onPress={handlePress}>
            <View style={[styles.itemIconContainer, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={iconName} size={22} color={iconColor} />
            </View>
            
            <View style={styles.itemTextContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemType}>{typeName} | Order: {item.order}</Text>
            </View>
            
            {statusIcon}
        </TouchableOpacity>
    );
};
// ------------------------------------------


export default function UnitDetailScreen({ route }) {
    const { unitId } = route.params;
    const navigation = useNavigation();
    const { userToken, API_URL_BASE } = useAuth();

    const [loading, setLoading] = useState(true);
    const [unitData, setUnitData] = useState(null);
    const [error, setError] = useState(null);

    // --- ইউনিট ডিটেইলস (হালকা ডেটা) লোড করা ---
    const fetchUnitDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_URL_BASE}/api/units/${unitId}/`, {
                headers: {
                    'Authorization': `Token ${userToken}`,
                },
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('এই কোর্সে এনরোল করা নেই বা প্রিমিয়াম অ্যাক্সেস নেই।');
                }
                throw new Error('ইউনিটের তথ্য আনতে সমস্যা হয়েছে।');
            }

            const json = await response.json();
            setUnitData(json);
            navigation.setOptions({ title: json.title });

        } catch (e) {
            console.error('Unit detail fetch error', e);
            setError(e.message || 'ইউনিটের বিস্তারিত তথ্য লোড করা যায়নি।');
        } finally {
            setLoading(false);
        }
    }, [userToken, API_URL_BASE, unitId, navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchUnitDetails();
        }, [fetchUnitDetails])
    );
    
    // --- ফিক্সড ফুটার অ্যাকশন (সরানো হয়েছে) ---

    if (loading && !unitData) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (error && !unitData) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.reloadButton} onPress={fetchUnitDetails}>
                    <Text style={{ color: COLORS.white }}>Reload</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }
    
    // নতুন আর্কিটেকচার অনুযায়ী লেসন, কুইজ ও গেম আলাদা করা
    const lessons = unitData.lessons || [];
    const masteryQuizzes = unitData.quizzes || []; // ব্যাকএন্ড এগুলোকে ফিল্টার করেছে
    const unitGames = unitData.matching_games || []; // ব্যাকএন্ড এগুলোকে ফিল্টার করেছে

    // অগ্রগতি গণনা (শুধুমাত্র অ্যাটেম্পটের উপর ভিত্তি করে)
    const totalItems = lessons.length + masteryQuizzes.length + unitGames.length;
    const completedItems = 
        lessons.filter(item => item.is_attempted).length + // FIX: is_completed এর বদলে is_attempted
        masteryQuizzes.filter(item => item.is_attempted).length +
        unitGames.filter(item => item.is_attempted).length;
        
    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;


    return (
        <SafeAreaView style={styles.safeArea}>
            {/* FIX: paddingBottom: 100 সরানো হয়েছে */}
            <ScrollView contentContainerStyle={styles.container} refreshControl={
                <RefreshControl refreshing={loading} onRefresh={fetchUnitDetails} colors={[COLORS.primary]} />
            }>
                
                {/* --- ১. Hero Section (Progress & Stats) --- */}
                <View style={styles.headerSection}>
                    <Text style={styles.unitTitle}>{unitData.title}</Text>
                    
                    <View style={styles.progressBarOuter}>
                        <View style={[styles.progressBarInner, { width: `${progressPercentage}%` }]} />
                    </View>
                    
                    <View style={styles.statsRow}>
                        <Text style={styles.progressText}>
                            {progressPercentage.toFixed(0)}% Complete (Based on attempts)
                        </Text>
                        <Text style={styles.totalItemsText}>
                            {completedItems} / {totalItems} Items
                        </Text>
                    </View>
                </View>

                {/* --- ২. লেসন তালিকা --- */}
                <Text style={styles.listHeader}>Lessons</Text>
                <View style={styles.itemsList}>
                    {lessons.length > 0 ? (
                        lessons.map((item) => (
                            <UnitItem 
                                key={`L-${item.id}`}
                                item={item} 
                                navigation={navigation} 
                                type='lesson'
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>এই ইউনিটে কোনো লেসন যোগ করা হয়নি।</Text>
                    )}
                </View>
                
                {/* --- ৩. মাস্টারি কুইজ ও গেম তালিকা --- */}
                {(masteryQuizzes.length > 0 || unitGames.length > 0) && (
                    <>
                        <Text style={styles.listHeader}>Mastery Challenges</Text>
                        <View style={styles.itemsList}>
                            {masteryQuizzes.map((item) => (
                                <UnitItem 
                                    key={`Q-${item.id}`}
                                    item={item} 
                                    navigation={navigation} 
                                    type='quiz'
                                />
                            ))}
                            {unitGames.map((item) => (
                                <UnitItem 
                                    key={`G-${item.id}`}
                                    item={item} 
                                    navigation={navigation} 
                                    type='game'
                                />
                            ))}
                        </View>
                    </>
                )}

            </ScrollView>
            
            {/* --- ৪. ফিক্সড ফুটার CTA (সরানো হয়েছে) --- */}

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
    container: {
        paddingHorizontal: 15,
        paddingTop: 0,
        paddingBottom: 20, // FIX: ফুটারের প্যাডিং সরানো হয়েছে
    },
    errorText: {
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        paddingVertical: 10,
    },
    // --- Header Section ---
    headerSection: {
        paddingVertical: 20,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    unitTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.accent,
        marginBottom: 15,
    },
    progressBarOuter: {
        height: 8,
        backgroundColor: COLORS.border,
        borderRadius: 4,
        marginBottom: 5,
    },
    progressBarInner: {
        height: '100%',
        backgroundColor: COLORS.progress, // Muted Teal/Green
        borderRadius: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    progressText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.progress,
    },
    totalItemsText: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    // --- Items List ---
    listHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.accent,
        marginBottom: 15,
        marginTop: 10,
    },
    itemsList: {
        // স্টাইল এখানে
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary, // অসম্পূর্ণ আইটেমের হাইলাইট
        elevation: 2,
    },
    completedCard: {
        backgroundColor: '#F7FFF7', // খুব হালকা সবুজ ব্যাকগ্রাউন্ড
        borderLeftColor: COLORS.progress, // Progress color for completed item
    },
    itemIconContainer: {
        padding: 10,
        borderRadius: 8,
        marginRight: 15,
    },
    itemTextContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    itemType: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    // --- Footer CTA (সরানো হয়েছে) ---
    reloadButton: {
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
});