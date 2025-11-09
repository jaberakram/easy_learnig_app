// screens/QuizScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext'; // <-- AuthContext ইম্পোর্ট করুন

export default function QuizScreen({ route, navigation }) {
  const { quizId } = route.params;
  // AuthContext থেকে টোকেন এবং আপনার আইপি অ্যাড্রেস (API_URL_BASE) নিন
  const { userToken, API_URL_BASE } = useAuth(); 

  // --- স্টেট ---
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null); // কুইজের সব তথ্য (শুরুতে null)
  const [questions, setQuestions] = useState([]); // কুইজের প্রশ্নগুলো
  const [error, setError] = useState(null);

  // --- কুইজ লজিক স্টেট ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // --- ডেটা লোড করা (সংশোধিত এবং উন্নত) ---
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || !userToken || !API_URL_BASE) return; 

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL_BASE}/api/quizzes/${quizId}/`, {
          headers: {
            'Authorization': `Token ${userToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('সার্ভার থেকে কুইজটি লোড করা যায়নি।');
        }

        const json = await response.json();
        
        setQuiz(json); // <-- সফল হলে কুইজ সেট করুন
        
        if (json.questions && json.questions.length > 0) {
          setQuestions(json.questions); // প্রশ্ন সেট করুন
        } else {
          setError('এই কুইজে কোনো প্রশ্ন যোগ করা হয়নি।');
        }

      } catch (e) {
        console.error(e);
        setError(e.message || 'কুইজটি লোড করা যায়নি।');
      } finally {
        setLoading(false); // সবশেষে লোডিং বন্ধ করুন
      }
    };
    fetchQuiz();
  }, [quizId, userToken, API_URL_BASE]);

  // --- কুইজের ফলাফল সার্ভারে সেভ করা ---
  const saveQuizResult = async (finalScore, totalPoints) => {
    try {
      await fetch(`${API_URL_BASE}/api/progress/quiz/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${userToken}`,
        },
        body: JSON.stringify({
          quiz: quizId,
          score: finalScore,
          total_points: totalPoints,
        }),
      });
    } catch (e) {
      console.error('Quiz result save error', e);
      Alert.alert('ত্রুটি', 'আপনার ফলাফল সেভ করা যায়নি।');
    }
  };

  // --- কুইজের ফাংশন (অপরিবর্তিত) ---
  const handleSelectChoice = (choiceId) => {
    if (showFeedback) return;
    setSelectedChoiceId(choiceId);
    setIsAnswerCorrect(null);
  };

  const handleCheckAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const correctChoice = currentQuestion.choices.find(c => c.is_correct);
    if (selectedChoiceId === correctChoice.id) {
      setIsAnswerCorrect(true);
      setScore(score + currentQuestion.points);
    } else {
      setIsAnswerCorrect(false);
    }
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    setSelectedChoiceId(null);
    setIsAnswerCorrect(null);
    setShowFeedback(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizFinished(true);
      const totalPoints = questions.reduce((total, q) => total + q.points, 0);
      saveQuizResult(score, totalPoints);
    }
  };

  // --- রেন্ডারিং (সংশোধিত লোডিং এবং এরর চেক) ---

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#0000ff" />;
  }

  if (error) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>ফিরে যান</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- (সংশোধিত) কুইজ শেষ হলে রেজাল্ট ---
  if (quizFinished) {
    const totalPoints = questions.reduce((total, q) => total + q.points, 0);
    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    return (
      <View style={styles.loader}>
        <Text style={styles.quizTitle}>কুইজ সম্পন্ন!</Text>
        <Text style={styles.scoreText}>আপনার স্কোর</Text>
        
        {/* --- (এই লাইনটি ঠিক করা হয়েছে) --- */}
        <Text style={styles.scoreValue}>
          {`${score} / ${totalPoints} (${percentage.toFixed(0)}%)`}
        </Text>
        {/* -------------------------------- */}

        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>ইউনিটে ফিরে যান</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!quiz || questions.length === 0) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>কুইজটি লোড করা সম্ভব হয়নি।</Text>
      </View>
    );
  }

  // বর্তমান প্রশ্নটি
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.quizTitle}>{quiz.title}</Text>
      <Text style={styles.progressText}>
        {/* --- (এই লাইনটিও ঠিক করা হয়েছে) --- */}
        {`প্রশ্ন ${currentQuestionIndex + 1} / ${questions.length}`}
      </Text>
      <View style={styles.progressOuter}>
        <View style={[styles.progressInner, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} />
      </View>

      <View style={styles.questionBox}>
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
      </View>

      {currentQuestion.choices.map((choice) => {
        let choiceStyle = styles.choiceCard;
        if (showFeedback && choice.is_correct) choiceStyle = [styles.choiceCard, styles.correctChoice];
        else if (showFeedback && selectedChoiceId === choice.id && !choice.is_correct) choiceStyle = [styles.choiceCard, styles.wrongChoice];
        else if (selectedChoiceId === choice.id) choiceStyle = [styles.choiceCard, styles.selectedChoice];
        return (
          <TouchableOpacity key={choice.id} style={choiceStyle} onPress={() => handleSelectChoice(choice.id)} disabled={showFeedback}>
            <Text style={styles.choiceText}>{choice.text}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.buttonContainer}>
        {!showFeedback && (
          <TouchableOpacity style={[styles.button, !selectedChoiceId ? styles.buttonDisabled : null]} onPress={handleCheckAnswer} disabled={!selectedChoiceId}>
            <Text style={styles.buttonText}>Check (যাচাই করুন)</Text>
          </TouchableOpacity>
        )}
        {showFeedback && (
          <TouchableOpacity style={styles.button} onPress={handleNextQuestion}>
            <Text style={styles.buttonText}>{currentQuestionIndex === questions.length - 1 ? 'Finish (শেষ করুন)' : 'Next (পরবর্তী)'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

// --- স্টাইল (অপরিবর্তিত) ---
const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', padding: 20 },
  quizTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  progressText: { fontSize: 14, color: 'gray', textAlign: 'center' },
  progressOuter: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, marginTop: 5, marginBottom: 20 },
  progressInner: { height: '100%', backgroundColor: '#007bff', borderRadius: 5 },
  questionBox: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 20, elevation: 2 },
  questionText: { fontSize: 18, fontWeight: '500', lineHeight: 26 },
  choiceCard: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  selectedChoice: { borderColor: '#007bff' },
  correctChoice: { backgroundColor: '#d4edda', borderColor: '#c3e6cb' },
  wrongChoice: { backgroundColor: '#f8d7da', borderColor: '#f5c6cb' },
  choiceText: { fontSize: 16 },
  buttonContainer: { marginTop: 20, marginBottom: 50 },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  scoreText: { fontSize: 22, color: 'gray', marginTop: 20 },
  scoreValue: { fontSize: 48, fontWeight: 'bold', color: '#007bff', marginVertical: 10 },
});