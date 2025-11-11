// screens/UnitDetailScreen.js
import React, { useState, useEffect, useCallback } from 'react'; // <-- useCallback যোগ করুন
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native'; // <-- useFocusEffect ইম্পোর্ট করুন
import { useAuth } from '../context/AuthContext'; 

export default function UnitDetailScreen({ route }) {
  const { unitId } = route.params;
  const navigation = useNavigation(); 
  const { userToken, API_URL_BASE } = useAuth(); 

  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState(null);
  const [learningItems, setLearningItems] = useState([]); // প্রসেস করা ডেটা
  const [error, setError] = useState(null);

  // --- পরিবর্তন: fetchUnitDetails-কে useCallback-এ মোড়ানো হয়েছে ---
  const fetchUnitDetails = useCallback(async () => {
    if (!unitId || !userToken || !API_URL_BASE) return;

    try {
      setLoading(true);
      setError(null);
      setLearningItems([]); // <-- লিস্ট খালি করুন

      const response = await fetch(`${API_URL_BASE}/api/units/${unitId}/`, {
        headers: {
          'Authorization': `Token ${userToken}`, 
        },
      });
      
      if (!response.ok) {
        if (response.status === 403) {
           setError('আপনি এই প্রিমিয়াম কোর্সটি এখনো কেনেননি।');
        } else {
           throw new Error('ইউনিটের বিস্তারিত আনতে সমস্যা হয়েছে।');
        }
      } else {
        const json = await response.json();
        setUnit(json);

        // --- (গুরুত্বপূর্ণ) ডেটা প্রসেসিং লজিক (আপনার স্টাইল অনুযায়ী) ---
        const items = [];
        
        // ১. লেসন (ভিডিও এবং আর্টিকেল)
        json.lessons.forEach(lesson => {
          // ভিডিও থাকলে, ভিডিও আইটেম যোগ করুন
          if (lesson.youtube_video_id) {
            items.push({
              id: `video-${lesson.id}`,
              type: 'video',
              title: lesson.title,
              videoId: lesson.youtube_video_id,
              lessonId: lesson.id, 
            });
          }
          // আর্টিকেল থাকলে, আর্টিকেল আইটেম যোগ করুন
          if (lesson.article_body) {
            items.push({
              id: `article-${lesson.id}`,
              type: 'article',
              title: lesson.title,
              articleBody: lesson.article_body, // <-- (গুরুত্বপূর্ণ) আর্টিকেল বডি যোগ করা হয়েছে
              lessonId: lesson.id, 
            });
          }
          // লেসন কুইজ থাকলে, সেগুলো যোগ করুন
          lesson.quizzes.forEach(quiz => {
            items.push({
              id: `quiz-${quiz.id}`,
              type: 'lesson_quiz',
              title: quiz.title,
              quizId: quiz.id,
            });
          });
        });

        // --- নতুন: ২. ম্যাচিং গেম ---
        // (এটি আর্টিকেল এবং লেসন কুইজের পরে দেখাবে)
        json.matching_games.forEach(game => {
          items.push({
            id: `game-${game.id}`,
            type: 'matching_game',
            title: game.title,
            gameId: game.id,
          });
        });
        // -------------------------

        // ৩. মাস্টারি কুইজ (ইউনিটের সাথে যুক্ত)
        json.quizzes.forEach(quiz => {
          items.push({
            id: `mastery-${quiz.id}`,
            type: 'mastery_quiz',
            title: quiz.title,
            quizId: quiz.id,
          });
        });

        setLearningItems(items); // প্রসেস করা ডেটা state-এ রাখুন
      }

    } catch (e) {
      console.error(e);
      setError(e.message || 'ইউনিটের বিস্তারিত আনতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  }, [unitId, userToken, API_URL_BASE]); // <-- ডিপেন্ডেন্সি

  // --- পরিবর্তন: useFocusEffect ইরোর ঠিক করা হয়েছে ---
  useFocusEffect(
    useCallback(() => {
      fetchUnitDetails(); // <-- async ফাংশনটি এখানে কল করা হয়েছে
    }, [fetchUnitDetails])
  );
  // ----------------------------------------------

  // --- (আপডেটেড) আইটেম ট্যাপ হ্যান্ডলার ---
  const handleItemPress = (item) => {
    if (item.type === 'video') {
      navigation.navigate('LessonVideo', { 
        videoId: item.videoId,
        lessonTitle: item.title,
        lessonId: item.lessonId, 
      });
    } else if (item.type === 'article') {
      navigation.navigate('LessonArticle', { 
        articleBody: item.articleBody, // <-- (গুরুত্বপূর্ণ) articleBody এখন পাস করা হচ্ছে
        lessonTitle: item.title,
        lessonId: item.lessonId, 
      });
    } else if (item.type === 'lesson_quiz' || item.type === 'mastery_quiz') {
      navigation.navigate('QuizScreen', { 
        quizId: item.quizId,
        quizTitle: item.title
      });
    } else if (item.type === 'matching_game') { // <-- নতুন: গেম নেভিগেশন
      navigation.navigate('MatchingGame', { 
        gameId: item.gameId,
        gameTitle: item.title
      });
    }
  };

  // --- রেন্ডারিং ---
  const renderItem = ({ item }) => {
    let icon = '❓';
    let style = styles.card;

    if (item.type === 'video') icon = '▶️ (ভিডিও)';
    else if (item.type === 'article') {
      icon = '📄 (আর্টিকেল)';
      style = [styles.card, styles.articleCard];
    } else if (item.type === 'matching_game') { // <-- নতুন: গেম স্টাইল
      icon = '🎮 (প্র্যাকটিস গেম)';
      style = [styles.card, styles.gameCard];
    } else if (item.type === 'lesson_quiz') {
      icon = '✏️ (লেসন কুইজ)';
      style = [styles.card, styles.lessonQuizCard];
    } else if (item.type === 'mastery_quiz') {
      icon = '🏆 (মাস্টারি কুইজ)';
      style = [styles.card, styles.masteryQuizCard];
    }

    return (
      <TouchableOpacity style={style} onPress={() => handleItemPress(item)}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#0000ff" />;
  }

  if (error) {
    return ( <View style={styles.loader}><Text style={styles.errorText}>{error}</Text></View> );
  }

  return (
    <View style={styles.container}>
      {/* --- পরিবর্তন: হেডার আপডেট করা হয়েছে (আপনার স্টাইল অনুযায়ী) --- */}
      {unit && (
        <View style={styles.header}>
          <Text style={styles.pointsText}>
            Points: {unit.user_earned_points} / {unit.total_possible_points}
          </Text>
        </View>
      )}
      {/* ------------------------------------ */}
      <FlatList
        data={learningItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.errorText}>এই ইউনিটে কোনো ম্যাটেরিয়াল নেই।</Text>}
      />
    </View>
  );
}

// --- স্টাইল (আপনার স্টাইল + গেম কার্ড) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  header: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    marginBottom: 15,
  },
  articleCard: {
    backgroundColor: '#fdfbe6',
    borderColor: '#f7f0b8',
    borderWidth: 1,
  },
  // --- নতুন: গেম কার্ড স্টাইল ---
  gameCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
  },
  // -------------------------
  lessonQuizCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#d6ebff',
    borderWidth: 1,
  },
  masteryQuizCard: {
    backgroundColor: '#e6f7ff',
    borderColor: '#b3e0ff',
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  icon: {
    fontSize: 14,
    marginBottom: 5,
    color: '#555',
  }
});