// screens/LessonDetailScreen.js
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

// --- কন্টেন্ট কার্ড কম্পোনেন্ট ---
const ContentCard = ({ icon, title, type, isCompleted, onPress }) => {
    
    const isCompletedStyle = isCompleted ? styles.completedCard : {};
    const iconColor = isCompleted ? COLORS.progress : COLORS.primary;
    
    return (
        <TouchableOpacity 
            style={[styles.contentCard, isCompletedStyle]} 
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={icon} size={28} color={iconColor} />
            </View>
            <View style={styles.textContent}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardType}>{type}</Text>
            </View>
            {isCompleted ? (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.progress} />
            ) : (
                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
            )}
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

    // --- লেসন ডিটেইলস (ফুল ডেটা) লোড করা ---
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
            navigation.setOptions({ title: json.title }); // হেডার টাইটেল সেট করা

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
    
    // কুইজ এবং গেমগুলো ফিল্টার করা (যদি থাকে)
    const lessonQuiz = lessonData.quizzes && lessonData.quizzes[0];
    const lessonGame = lessonData.matching_games && lessonData.matching_games[0];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} refreshControl={
                <RefreshControl refreshing={loading} onRefresh={fetchLessonDetails} colors={[COLORS.primary]} />
            }>
                
                {/* --- ১. হেডার --- */}
                <View style={styles.headerSection}>
                    <Text style={styles.lessonTitle}>{lessonData.title}</Text>
                    {/* FIX: 'is_completed' (ভিউ ভিত্তিক) ব্যাজটি সরানো হয়েছে */}
                </View>

                {/* --- ২. কন্টেন্ট তালিকা --- */}
                <Text style={styles.listHeader}>Lesson Content</Text>

                {/* ভিডিও কার্ড */}
                {lessonData.youtube_video_id && (
                    <ContentCard
                        icon="videocam-outline"
                        title="Watch Video"
                        type="Video Content"
                        isCompleted={false} // FIX: ভিডিও দেখা মানেই সম্পন্ন নয়
                        onPress={() => navigation.navigate('LessonVideo', { 
                            lessonId: lessonData.id, 
                            lessonTitle: lessonData.title, 
                            videoId: lessonData.youtube_video_id 
                        })}
                    />
                )}
                
                {/* আর্টিকেল কার্ড */}
                {lessonData.article_body && (
                    <ContentCard
                        icon="reader-outline" // FIX: আইকন পরিবর্তন
                        title="Read Article"
                        type="Article Content"
                        isCompleted={false} // FIX: আর্টিকেল পড়া মানেই সম্পন্ন নয়
                        onPress={() => navigation.navigate('LessonArticle', { 
                            lessonId: lessonData.id, 
                            lessonTitle: lessonData.title, 
                            articleBody: lessonData.article_body 
                        })}
                    />
                )}

                {/* কুইজ কার্ড */}
                {lessonQuiz && (
                    <ContentCard
                        icon="help-circle-outline"
                        title={lessonQuiz.title}
                        type="Lesson Quiz"
                        isCompleted={lessonQuiz.is_attempted} // FIX: শুধুমাত্র কুইজ/গেম সম্পন্ন হবে
                        onPress={() => navigation.navigate('QuizScreen', { 
                            quizId: lessonQuiz.id, 
                            quizTitle: lessonQuiz.title 
                        })}
                    />
                )}
                
                {/* গেম কার্ড */}
                {lessonGame && (
                    <ContentCard
                        icon="game-controller-outline"
                        title={lessonGame.title}
                        type="Matching Game"
                        isCompleted={lessonGame.is_attempted} // FIX: শুধুমাত্র কুইজ/গেম সম্পন্ন হবে
                        onPress={() => navigation.navigate('MatchingGame', { 
                            gameId: lessonGame.id, 
                            gameTitle: lessonGame.title 
                        })}
                    />
                )}

                {/* যদি কোনো কন্টেন্ট না থাকে */}
                {!lessonData.youtube_video_id && !lessonData.article_body && !lessonQuiz && !lessonGame && (
                    <Text style={styles.emptyText}>এই লেসনে এখনো কোনো কন্টেন্ট যোগ করা হয়নি।</Text>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

// --- স্টাইল (অপরিবর্তিত) ---
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
    // --- Header Section ---
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
    // --- Content List ---
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
    completedCard: {
        backgroundColor: '#F7FFF7', // খুব হালকা সবুজ
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
});