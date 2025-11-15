// screens/QuizScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ----------------------------------------

export default function QuizScreen({ route }) {
    const { quizId } = route.params;
    const { userToken, API_URL_BASE } = useAuth();
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedChoiceId, setSelectedChoiceId] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null); // null, true, false
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);
    
    const [quizFinished, setQuizFinished] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [finalTotalPoints, setFinalTotalPoints] = useState(0);
    const [isSaving, setIsSaving] = useState(false); // সেভ করার লোডার

    // --- কুইজের প্রশ্ন লোড করা ---
    const fetchQuiz = useCallback(async () => {
        setLoading(true);
        setQuizFinished(false);
        try {
            const response = await fetch(`${API_URL_BASE}/api/quizzes/${quizId}/`, {
                headers: { 'Authorization': `Token ${userToken}` },
            });
            if (!response.ok) throw new Error('কুইজের প্রশ্ন লোড করা যায়নি।');
            const data = await response.json();
            setQuizData(data);
            // কুইজের মোট সম্ভাব্য পয়েন্ট গণনা করা
            const total = data.questions.reduce((acc, q) => acc + q.points, 0);
            setTotalPoints(total);
            setFinalTotalPoints(total); // ফাইনাল স্কোরের জন্যও সেট করা
        } catch (e) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
            // রিসেট স্টেট
            setCurrentQuestionIndex(0);
            setSelectedChoiceId(null);
            setIsCorrect(null);
            setShowFeedback(false);
            setScore(0);
        }
    }, [quizId, userToken, API_URL_BASE]);

    useFocusEffect(
        useCallback(() => {
            fetchQuiz();
        }, [fetchQuiz])
    );

    // --- কুইজের ফলাফল সেভ করা ---
    const saveQuizResult = async (achievedScore, totalPossiblePoints) => {
        setIsSaving(true);
        try {
            await fetch(`${API_URL_BASE}/api/progress/quiz/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${userToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quiz: quizId,
                    score: achievedScore,
                    total_points: totalPossiblePoints,
                }),
            });
        } catch (e) {
            console.error('Failed to save quiz result', e);
            Alert.alert("Error", "ফলাফল সেভ করা যায়নি।");
        } finally {
            setIsSaving(false);
        }
    };

    // --- উত্তর চেক করা ---
    const handleCheckAnswer = () => {
        if (selectedChoiceId === null) return;

        const currentQuestion = quizData.questions[currentQuestionIndex];
        const selectedChoice = currentQuestion.choices.find(c => c.id === selectedChoiceId);
        
        if (selectedChoice.is_correct) {
            setIsCorrect(true);
            setScore(prevScore => prevScore + currentQuestion.points);
        } else {
            setIsCorrect(false);
        }
        setShowFeedback(true);
    };

    // --- পরবর্তী প্রশ্ন বা ফলাফল ---
    const handleNextQuestion = () => {
        setShowFeedback(false);
        setSelectedChoiceId(null);
        setIsCorrect(null);

        if (currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        } else {
            // কুইজ শেষ
            setFinalScore(score); // বর্তমান স্কোরকে ফাইনাল স্কোর হিসেবে সেট করা
            setQuizFinished(true);
            saveQuizResult(score, totalPoints); // ফলাফল সেভ করা
        }
    };

    // --- চয়েস বাটন স্টাইল ---
    const getChoiceStyle = (choiceId) => {
        if (!showFeedback) {
            return selectedChoiceId === choiceId ? styles.selectedChoice : styles.choiceButton;
        }
        
        const choice = quizData.questions[currentQuestionIndex].choices.find(c => c.id === choiceId);
        
        if (choice.is_correct) {
            return styles.correctChoice; // সঠিক উত্তর সবসময় সবুজ
        }
        if (selectedChoiceId === choiceId && !choice.is_correct) {
            return styles.wrongChoice; // ভুল সিলেক্টেড উত্তর লাল
        }
        return styles.choiceButton; // বাকিগুলো ডিফল্ট
    };

    const getChoiceTextStyle = (choiceId) => {
        if (!showFeedback) {
            return selectedChoiceId === choiceId ? styles.selectedChoiceText : styles.choiceText;
        }
        const choice = quizData.questions[currentQuestionIndex].choices.find(c => c.id === choiceId);
        if (choice.is_correct || (selectedChoiceId === choiceId && !choice.is_correct)) {
            return styles.selectedChoiceText; // সাদা টেক্সট
        }
        return styles.choiceText; // ডিফল্ট টেক্সট
    };


    if (loading || !quizData) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }
    
    // --- ফলাফল স্ক্রিন ---
    if (quizFinished) {
        const percentage = finalTotalPoints > 0 ? (finalScore / finalTotalPoints) * 100 : 0;
        let resultMessage = "ভালো করেছেন!";
        if (percentage >= 80) resultMessage = "দারুণ! চালিয়ে যান!";
        else if (percentage < 50) resultMessage = "আবার চেষ্টা করুন!";

        return (
            <SafeAreaView style={styles.resultsContainer}>
                <Ionicons name="trophy" size={80} color={COLORS.promoBg} />
                <Text style={styles.resultsTitle}>কুইজ সম্পন্ন!</Text>
                <Text style={styles.scoreText}>
                    আপনার স্কোর: {finalScore} / {finalTotalPoints} ({percentage.toFixed(0)}%)
                </Text>
                <Text style={[styles.summaryText, percentage >= 80 ? styles.congratsText : styles.retryText]}>
                    {resultMessage}
                </Text>
                
                <TouchableOpacity style={styles.button} onPress={fetchQuiz}>
                    <Text style={styles.buttonText}>আবার চেষ্টা করুন</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.goBack()}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>ফিরে যান</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const currentQuestion = quizData.questions[currentQuestionIndex];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                {/* --- হেডার: প্রশ্ন নম্বর এবং পয়েন্ট --- */}
                <View style={styles.header}>
                    <Text style={styles.title}>{quizData.title}</Text>
                    <Text style={styles.questionCounter}>
                        প্রশ্ন {currentQuestionIndex + 1} / {quizData.questions.length}
                    </Text>
                    <Text style={styles.points}>
                        পয়েন্ট: {currentQuestion.points}
                    </Text>
                </View>

                {/* --- প্রশ্ন --- */}
                <Text style={styles.questionText}>{currentQuestion.text}</Text>

                {/* --- অপশন --- */}
                <View style={styles.choicesContainer}>
                    {currentQuestion.choices.map(choice => (
                        <TouchableOpacity
                            key={choice.id}
                            style={getChoiceStyle(choice.id)}
                            onPress={() => !showFeedback && setSelectedChoiceId(choice.id)}
                            disabled={showFeedback}
                        >
                            <Text style={getChoiceTextStyle(choice.id)}>{choice.text}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* --- ফিডব্যাক (সঠিক/ভুল) --- */}
                {showFeedback && (
                    <View style={styles.feedbackContainer}>
                        <Text style={isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}>
                            {isCorrect ? "সঠিক!" : "ভুল!"}
                        </Text>
                        {currentQuestion.explanation && (
                            <>
                                <Text style={styles.explanationTitle}>ব্যাখ্যা:</Text>
                                <Text style={styles.explanationText}>
                                    {currentQuestion.explanation}
                                </Text>
                            </>
                        )}
                    </View>
                )}

            </ScrollView>

            {/* --- ফুটার: পরবর্তী বাটন --- */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, (!selectedChoiceId || isSaving) && styles.nextButtonDisabled]}
                    onPress={showFeedback ? handleNextQuestion : handleCheckAnswer}
                    disabled={!selectedChoiceId || isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.nextButtonText}>
                            {showFeedback ? (currentQuestionIndex === quizData.questions.length - 1 ? 'ফলাফল দেখুন' : 'পরবর্তী') : 'উত্তর চেক করুন'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// --- স্টাইল (থিম কালার ব্যবহার করে আপডেট) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background, // পরিবর্তন
    },
    container: {
        flex: 1,
        padding: 15,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background, // পরিবর্তন
    },
    header: {
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border, // পরিবর্তন
    },
    title: {
        fontSize: 18,
        fontWeight: '500',
        color: COLORS.accent, // পরিবর্তন
        textAlign: 'center',
    },
    questionCounter: {
        fontSize: 14,
        color: COLORS.textLight, // পরিবর্তন
        textAlign: 'center',
        marginTop: 5,
    },
    points: {
        fontSize: 14,
        color: COLORS.primary, // পরিবর্তন
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 5,
    },
    questionText: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text, // পরিবর্তন
        marginBottom: 25,
        textAlign: 'center',
        lineHeight: 28,
    },
    choicesContainer: {
        marginBottom: 20,
    },
    choiceButton: {
        backgroundColor: COLORS.white, // পরিবর্তন
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: COLORS.border, // পরিবর্তন
    },
    choiceText: {
        fontSize: 16,
        color: COLORS.text, // পরিবর্তন
    },
    selectedChoice: {
        backgroundColor: COLORS.primary, // পরিবর্তন
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: COLORS.primary, // পরিবর্তন
    },
    selectedChoiceText: {
        fontSize: 16,
        color: COLORS.white, // পরিবর্তন
        fontWeight: 'bold',
    },
    correctChoice: {
        backgroundColor: COLORS.green, // পরিবর্তন
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: COLORS.green, // পরিবর্তন
    },
    wrongChoice: {
        backgroundColor: COLORS.error, // পরিবর্তন
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: COLORS.error, // পরিবর্তন
    },
    feedbackContainer: {
        backgroundColor: COLORS.white, // পরিবর্তন
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border, // পরিবর্তন
    },
    feedbackCorrect: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.green, // পরিবর্তন
        marginBottom: 10,
    },
    feedbackWrong: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.error, // পরিবর্তন
        marginBottom: 10,
    },
    explanationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text, // পরিবর্তন
        marginTop: 5,
    },
    explanationText: {
        fontSize: 15,
        color: COLORS.textLight, // পরিবর্তন
        marginTop: 5,
    },
    footer: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: COLORS.border, // পরিবর্তন
        backgroundColor: COLORS.background, // পরিবর্তন
    },
    nextButton: {
        backgroundColor: COLORS.primary, // পরিবর্তন
        padding: 18,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 58,
    },
    nextButtonDisabled: {
        backgroundColor: COLORS.disabled, // পরিবর্তন
    },
    nextButtonText: {
        color: COLORS.white, // পরিবর্তন
        fontSize: 16,
        fontWeight: 'bold',
    },
    // --- ফলাফল স্ক্রিন স্টাইল ---
    resultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white, // পরিবর্তন
        padding: 20,
    },
    resultsTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
        marginTop: 15,
    },
    scoreText: {
        fontSize: 20,
        color: COLORS.primary, // পরিবর্তন
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 10,
    },
    summaryText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 30,
    },
    congratsText: {
        color: COLORS.green, // পরিবর্তন
    },
    retryText: {
        color: COLORS.yellow, // পরিবর্তন
    },
    button: {
        backgroundColor: COLORS.primary, // পরিবর্তন
        padding: 18,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
    },
    buttonText: {
        color: COLORS.white, // পরিবর্তন
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: COLORS.white, // পরিবর্তন
        borderWidth: 1,
        borderColor: COLORS.primary, // পরিবর্তন
    },
    secondaryButtonText: {
        color: COLORS.primary, // পরিবর্তন
    },
});