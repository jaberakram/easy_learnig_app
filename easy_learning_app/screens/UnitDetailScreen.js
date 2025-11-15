// screens/UnitDetailScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// --- সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ------------------------------------------

// --- অ্যানিমেশন সক্ষম করা (Android-এর জন্য) ---
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
// ------------------------------------------


// --- এক্সপ্যান্ডেবল লেসন আইটেম কম্পোনেন্ট (অপরিবর্তিত) ---
const ExpandableLessonItem = ({ item, navigation }) => {
    const [expanded, setExpanded] = useState(false);
    
    const iconColor = COLORS.accent; 
    const lessonIcon = "document-text-outline"; 
    
    const handleLessonPress = () => {
        navigation.navigate('LessonDetail', { 
            lessonId: item.id, 
            lessonTitle: item.title 
        });
    };

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    let lessonType = item.has_video ? 'Video' : 'Article';
    if (!item.has_video && !item.has_article) lessonType = 'Lesson Content'; 
    if (item.has_quiz) lessonType += ' + Quiz';
    if (item.has_game) lessonType += ' + Game';
    
    return (
        <View style={styles.unitCard}>
            <View style={styles.unitHeader}>
                <TouchableOpacity onPress={handleLessonPress} style={styles.unitHeaderContentWrapper}>
                    <View style={styles.headerIconWrapper}>
                        <Ionicons 
                            name={lessonIcon} 
                            size={24} 
                            color={iconColor} 
                        />
                    </View>
                    
                    <View style={styles.unitHeaderContent}>
                        <Text style={styles.lessonTitle}>Lesson {item.order}: {item.title}</Text>
                        <Text style={styles.unitStats}>{lessonType}</Text>
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
                    <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={24} color={COLORS.textLight} />
                </TouchableOpacity>
            </View>

            {expanded && (
                <View style={styles.unitContent}>
                    {item.has_video && (
                        <Text style={styles.contentItem}>
                            <Ionicons name="play-circle-outline" size={14} color={COLORS.textLight} /> Video Content
                        </Text>
                    )}
                    {item.has_article && (
                        <Text style={styles.contentItem}>
                            <Ionicons name="reader-outline" size={14} color={COLORS.textLight} /> Article Content
                        </Text>
                    )}
                    {item.has_quiz && (
                        <Text style={styles.contentItem}>
                            <Ionicons name="help-circle-outline" size={14} color={COLORS.textLight} /> Lesson Quiz
                        </Text>
                    )}
                    {item.has_game && (
                        <Text style={styles.contentItem}>
                            <Ionicons name="game-controller-outline" size={14} color={COLORS.textLight} /> Matching Game
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
};
// ------------------------------------------

// --- কুইজ/গেম আইটেম কম্পোনেন্ট (অপরিবর্তিত) ---
const ChallengeItem = ({ item, navigation, type = 'quiz' }) => {
    
    let iconName, typeName, iconColor;
    const scorePercentage = item.latest_score_percentage;

    if (type === 'quiz') {
        iconName = 'help-circle-outline';
        typeName = 'Mastery Quiz';
        iconColor = COLORS.primary;
    } else { 
        iconName = 'game-controller-outline';
        typeName = 'Unit Game';
        iconColor = COLORS.progress;
    }
    
    let scoreColor = COLORS.disabled;
    if (scorePercentage !== null && scorePercentage !== undefined) {
        if (scorePercentage >= 80) scoreColor = COLORS.progress; 
        else if (scorePercentage >= 50) scoreColor = COLORS.promoBg; 
        else scoreColor = COLORS.primary; 
    }

    const handlePress = () => {
        if (type === 'quiz') {
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
        <TouchableOpacity style={styles.unitCard} onPress={handlePress}>
            <View style={styles.unitHeader}>
                <View style={styles.unitHeaderContentWrapper}> 
                    <View style={styles.headerIconWrapper}>
                        <Ionicons name={iconName} size={24} color={iconColor} />
                    </View>
                    <View style={styles.unitHeaderContent}>
                        <Text style={styles.lessonTitle}>
                            {type === 'quiz' ? 'Quiz' : 'Game'} {item.order}: {item.title}
                        </Text>
                        <Text style={styles.unitStats}>{typeName}</Text>
                    </View>
                </View>
                
                {type === 'quiz' && scorePercentage !== null && scorePercentage !== undefined && (
                    <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
                        <Text style={styles.scoreText}>{scorePercentage}%</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} style={{ marginLeft: 8 }} />
            </View>
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
    
    const lessons = unitData.lessons || [];
    const masteryQuizzes = unitData.quizzes || [];
    const unitGames = unitData.matching_games || [];

    const totalLessons = lessons.length;
    const totalLessonQuizzes = lessons.filter(l => l.has_quiz).length;
    const totalLessonGames = lessons.filter(l => l.has_game).length;
    const totalMasteryQuizzes = masteryQuizzes.length;
    const totalUnitGames = unitGames.length;
    const totalQuizzes = totalLessonQuizzes + totalMasteryQuizzes;
    const totalGames = totalLessonGames + totalUnitGames;
    
    const totalPoints = unitData.total_possible_points || 0;
    const earnedPoints = unitData.user_earned_points || 0;
    const progressPercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    
    const statusText = (earnedPoints > 0 || totalPoints > 0)
        ? `${progressPercentage.toFixed(0)}% Complete`
        : 'Not Started';


    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} refreshControl={
                <RefreshControl refreshing={loading} onRefresh={fetchUnitDetails} colors={[COLORS.primary]} />
            }>
                
                {/* --- ১. Hero Section (টাইটেল ফন্ট আপডেটেড) --- */}
                <View style={styles.heroSection}>
                    <Text style={styles.unitTitle}>{unitData.title}</Text>
                    <Text style={styles.courseTitleText}>
                        <Ionicons name="school-outline" size={17} color={COLORS.textLight} />
                        {unitData.course_title || 'Course'}
                    </Text>
                </View>

                {/* --- ২. Progress Section --- */}
                <View style={styles.progressSection}>
                    <View style={styles.progressBarOuter}>
                        <View style={[styles.progressBarInner, { width: `${progressPercentage}%` }]} />
                    </View>
                    <View style={styles.statsRow}>
                        <Text style={styles.progressText}>
                            {statusText}
                        </Text>
                        <Text style={styles.totalItemsText}>
                           Points: {earnedPoints} / {totalPoints}
                        </Text>
                    </View>
                </View>

                {/* --- ৩. ইউনিট স্ট্যাটিস্টিকস গ্রিড --- */}
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Ionicons name="document-text-outline" size={24} color={COLORS.accent} />
                        <Text style={styles.statValue}>{totalLessons}</Text>
                        <Text style={styles.statLabel}>Lessons</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="help-circle-outline" size={24} color={COLORS.accent} />
                        <Text style={styles.statValue}>{totalQuizzes}</Text>
                        <Text style={styles.statLabel}>Total Quizzes</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="game-controller-outline" size={24} color={COLORS.accent} />
                        <Text style={styles.statValue}>{totalGames}</Text>
                        <Text style={styles.statLabel}>Total Games</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="trophy-outline" size={24} color={COLORS.accent} />
                        <Text style={styles.statValue}>{totalPoints}</Text>
                        <Text style={styles.statLabel}>Total Points</Text>
                    </View>
                </View>


                {/* --- ৪. লেসন তালিকা --- */}
                <Text style={styles.unitsHeader}>Lessons</Text>
                <View>
                    {lessons.length > 0 ? (
                        lessons.map((item) => (
                            <ExpandableLessonItem 
                                key={`L-${item.id}`}
                                item={item} 
                                navigation={navigation} 
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>এই ইউনিটে কোনো লেসন যোগ করা হয়নি।</Text>
                    )}
                </View>
                
                {/* --- ৫. মাস্টারি কুইজ ও গেম তালিকা --- */}
                {(masteryQuizzes.length > 0 || unitGames.length > 0) && (
                    <>
                        <Text style={styles.unitsHeader}>Mastery Challenges</Text>
                        <View>
                            {masteryQuizzes.map((item) => (
                                <ChallengeItem 
                                    key={`Q-${item.id}`}
                                    item={item} 
                                    navigation={navigation} 
                                    type='quiz'
                                />
                            ))}
                            {unitGames.map((item) => (
                                <ChallengeItem 
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
        </SafeAreaView>
    );
}

// --- স্টাইল (আপডেটেড Hero Section ফন্ট সাইজ) ---
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
        paddingBottom: 20,
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
    // --- Hero Section (টাইটেল ফন্ট আপডেটেড) ---
    heroSection: {
        paddingVertical: 20,
        paddingBottom: 10,
    },
    unitTitle: {
        fontSize: 28, // <-- পরিবর্তন: 26 থেকে 28
        fontWeight: 'bold',
        color: COLORS.accent,
        marginBottom: 5,
    },
    courseTitleText: {
        fontSize: 17, // <-- পরিবর্তন: 16 থেকে 17
        color: COLORS.textLight,
    },
    // --- Progress Section ---
    progressSection: {
        paddingVertical: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    progressBarOuter: {
        height: 8,
        backgroundColor: COLORS.border,
        borderRadius: 4,
        marginBottom: 5,
    },
    progressBarInner: {
        height: '100%',
        backgroundColor: COLORS.progress, 
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
        fontWeight: '500', 
    },
    // --- Stats Grid ---
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingTop: 10,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        padding: 8,
        borderRightWidth: 1,
        borderRightColor: COLORS.border,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.accent,
        marginTop: 5,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    // --- Unit/Lesson List ---
    unitsHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.accent,
        marginBottom: 15,
        marginTop: 10,
    },
    unitCard: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
    },
    unitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: COLORS.white,
    },
    unitHeaderContentWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconWrapper: {
        padding: 5,
        borderRadius: 5,
        backgroundColor: COLORS.background, 
        marginRight: 15,
    },
    unitHeaderContent: {
        flex: 1,
    },
    lessonTitle: { // লেসনের টাইটেল (লিস্টের ভেতরের)
        fontSize: 16, // <-- এটা অপরিবর্তিত (16)
        fontWeight: 'bold',
        color: COLORS.accent,
    },
    unitStats: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    expandButton: {
        padding: 5,
    },
    unitContent: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    contentItem: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 5,
        marginLeft: 5,
    },
    reloadButton: {
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    // --- স্কোর ব্যাজ স্টাইল ---
    scoreBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
        minWidth: 40,
        alignItems: 'center',
        marginLeft: 8, 
    },
    scoreText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
});