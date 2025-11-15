// screens/LessonDetailScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ------------------------------------------

// --- কন্টেন্ট কার্ড কম্পোনেন্ট (স্কোর ব্যাজ সহ আপডেটেড) ---
const ContentCard = ({ icon, title, type, onPress, typeName, scorePercentage }) => {
    
    let iconColor;
    if (typeName === 'quiz') iconColor = COLORS.primary; // কুইজ = Coral
    else if (typeName === 'game') iconColor = COLORS.progress; // গেম = Green
    else iconColor = COLORS.accent; // Video/Article = Navy Blue
    
    // --- নতুন: স্কোর ব্যাজের জন্য কালার লজিক ---
    let scoreColor = COLORS.disabled;
    if (scorePercentage !== null && scorePercentage !== undefined) {
        if (scorePercentage >= 80) scoreColor = COLORS.progress; // ভালো স্কোর (সবুজ)
        else if (scorePercentage >= 50) scoreColor = COLORS.promoBg; // মাঝারি স্কোর (হলুদ)
        else scoreColor = COLORS.primary; // কম স্কোর (Coral/Red)
    }
    // ------------------------------------
    
    return (
        <TouchableOpacity 
            style={styles.contentCard} 
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={icon} size={28} color={iconColor} />
            </View>
            <View style={styles.textContent}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardType}>{type}</Text>
            </View>
            
            {/* --- নতুন: স্কোর ব্যাজ রেন্ডারিং --- */}
            {typeName === 'quiz' && scorePercentage !== null && scorePercentage !== undefined && (
                <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
                    <Text style={styles.scoreText}>{scorePercentage}%</Text>
                </View>
            )}
            {/* ------------------------------- */}

            <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
    );
};
// ------------------------------------------


export default function LessonDetailScreen({ route }) {
    const { lessonId } = route.params;
    const navigation = useNavigation();
    const { userToken, API_URL_BASE } = useAuth();

    const [loading, setLoading] = useState(true);
    const [lessonData, setLessonData] = useState(null);
    const [error, setError] = useState(null);

    const fetchLessonDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_URL_BASE}/api/lessons/${lessonId}/`, {
                headers: {
                    'Authorization': `Token ${userToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('লেসনের তথ্য আনতে সমস্যা হয়েছে।');
            }

            const json = await response.json();
            setLessonData(json);
            navigation.setOptions({ title: json.title }); 

        } catch (e) {
            console.error('Lesson detail fetch error', e);
            setError(e.message || 'লেসনের বিস্তারিত তথ্য লোড করা যায়নি।');
        } finally {
            setLoading(false);
        }
    }, [userToken, API_URL_BASE, lessonId, navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchLessonDetails();
        }, [fetchLessonDetails])
    );

    if (loading && !lessonData) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (error && !lessonData) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }
    
    const lessonQuiz = lessonData.quizzes && lessonData.quizzes[0];
    const lessonGame = lessonData.matching_games && lessonData.matching_games[0];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} refreshControl={
                <RefreshControl refreshing={loading} onRefresh={fetchLessonDetails} colors={[COLORS.primary]} />
            }>
                
                <View style={styles.headerSection}>
                    <Text style={styles.lessonTitle}>{lessonData.title}</Text>
                </View>

                <Text style={styles.listHeader}>Lesson Content</Text>

                {lessonData.youtube_video_id && (
                    <ContentCard
                        icon="videocam-outline"
                        title="Watch Video"
                        type="Video Content"
                        typeName="video" 
                        onPress={() => navigation.navigate('LessonVideo', { 
                            lessonId: lessonData.id, 
                            lessonTitle: lessonData.title, 
                            videoId: lessonData.youtube_video_id 
                        })}
                    />
                )}
                
                {lessonData.article_body && (
                    <ContentCard
                        icon="reader-outline" 
                        title="Read Article"
                        type="Article Content"
                        typeName="article" 
                        onPress={() => navigation.navigate('LessonArticle', { 
                            lessonId: lessonData.id, 
                            lessonTitle: lessonData.title, 
                            articleBody: lessonData.article_body 
                        })}
                    />
                )}

                {lessonQuiz && (
                    <ContentCard
                        icon="help-circle-outline"
                        title={lessonQuiz.title}
                        type="Lesson Quiz"
                        typeName="quiz" 
                        scorePercentage={lessonQuiz.latest_score_percentage} // <-- নতুন prop পাস
                        onPress={() => navigation.navigate('QuizScreen', { 
                            quizId: lessonQuiz.id, 
                            quizTitle: lessonQuiz.title 
                        })}
                    />
                )}
                
                {lessonGame && (
                    <ContentCard
                        icon="game-controller-outline"
                        title={lessonGame.title}
                        type="Matching Game"
                        typeName="game" 
                        onPress={() => navigation.navigate('MatchingGame', { 
                            gameId: lessonGame.id, 
                            gameTitle: lessonGame.title 
                        })}
                    />
                )}

                {!lessonData.youtube_video_id && !lessonData.article_body && !lessonQuiz && !lessonGame && (
                    <Text style={styles.emptyText}>এই লেসনে এখনো কোনো কন্টেন্ট যোগ করা হয়নি।</Text>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

// --- স্টাইল (স্কোর ব্যাজ স্টাইল সহ) ---
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
        paddingTop: 15,
        paddingBottom: 100,
    },
    errorText: {
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    headerSection: {
        paddingVertical: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    lessonTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.accent,
        marginBottom: 8,
    },
    listHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.accent,
        marginBottom: 15,
        marginTop: 10,
    },
    contentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 15,
        marginBottom: 12,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconContainer: {
        padding: 12,
        borderRadius: 8,
        marginRight: 15,
    },
    textContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    cardType: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginTop: 20,
        fontSize: 16,
    },
    // --- নতুন: স্কোর ব্যাজ স্টাইল ---
    scoreBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
        minWidth: 40,
        alignItems: 'center',
    },
    scoreText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    // --------------------------
});