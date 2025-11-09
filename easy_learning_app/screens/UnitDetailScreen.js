// screens/UnitDetailScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';

import { useNavigation } from '@react-navigation/native'; // <-- নেভিগেশনের জন্য ইম্পোর্ট
import { useAuth } from '../context/AuthContext'; // <-- AuthContext ইম্পোর্ট করুন

export default function UnitDetailScreen({ route }) {
  const { unitId } = route.params;
  const navigation = useNavigation(); // <-- নেভিগেশন হুক
  // AuthContext থেকে টোকেন এবং আপনার আইপি অ্যাড্রেস (API_URL_BASE) নিন
  const { userToken, API_URL_BASE } = useAuth(); 

  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState(null);
  const [learningItems, setLearningItems] = useState([]); // প্রসেস করা ডেটা
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUnitDetails = async () => {
      if (!unitId || !userToken || !API_URL_BASE) return;

      try {
        const response = await fetch(`${API_URL_BASE}/api/units/${unitId}/`, {
          headers: {
            'Authorization': `Token ${userToken}`, // <-- টোকেন পাঠানো হচ্ছে
          },
        });
        
        if (!response.ok) {
          throw new Error('ইউনিটের বিস্তারিত আনতে সমস্যা হয়েছে।');
        }

        const json = await response.json();
        setUnit(json);

        // --- (গুরুত্বপূর্ণ) ডেটা প্রসেসিং লজিক ---
        // আমরা API থেকে আসা ডেটাকে অ্যাপে দেখানোর জন্য প্রস্তুত করছি
        const items = [];
        
        json.lessons.forEach(lesson => {
          // ভিডিও থাকলে, ভিডিও আইটেম যোগ করুন
          if (lesson.youtube_video_id) {
            items.push({
              id: `video-${lesson.id}`,
              type: 'video',
              title: lesson.title,
              videoId: lesson.youtube_video_id,
              lessonId: lesson.id, // <-- লেসন আইডি (প্রোগ্রেস সেভ করার জন্য)
            });
          }
          // আর্টিকেল থাকলে, আর্টিকেল আইটেম যোগ করুন
          if (lesson.article_body) {
            items.push({
              id: `article-${lesson.id}`,
              type: 'article',
              title: lesson.title,
              articleBody: lesson.article_body,
              lessonId: lesson.id, // <-- লেসন আইডি (প্রোগ্রেস সেভ করার জন্য)
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

        // মাস্টারি কুইজগুলো যোগ করুন
        json.quizzes.forEach(quiz => {
          items.push({
            id: `mastery-${quiz.id}`,
            type: 'mastery_quiz',
            title: quiz.title,
            quizId: quiz.id,
          });
        });

        setLearningItems(items); // প্রসেস করা ডেটা state-এ রাখুন

      } catch (e) {
        console.error(e);
        setError(e.message || 'ইউনিটের বিস্তারিত আনতে সমস্যা হয়েছে।');
      } finally {
        setLoading(false);
      }
    };

    fetchUnitDetails();
  }, [unitId, userToken, API_URL_BASE]);

  // --- (আপডেটেড) আইটেম ট্যাপ হ্যান্ডলার ---
  const handleItemPress = (item) => {
    if (item.type === 'video') {
      navigation.navigate('LessonVideo', { 
        videoId: item.videoId,
        lessonTitle: item.title,
        lessonId: item.lessonId, // <-- আমরা lessonId পাঠাচ্ছি
      });
    } else if (item.type === 'article') {
      navigation.navigate('LessonArticle', { 
        articleBody: item.articleBody,
        lessonTitle: item.title,
        lessonId: item.lessonId, // <-- আমরা lessonId পাঠাচ্ছি
      });
    } else if (item.type === 'lesson_quiz' || item.type === 'mastery_quiz') {
      navigation.navigate('QuizScreen', { 
        quizId: item.quizId,
        quizTitle: item.title
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
      <Text style={styles.header}>Learning Materials</Text>
      <FlatList
        data={learningItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.errorText}>এই ইউনিটে কোনো ম্যাটেরিয়াল নেই।</Text>}
      />
    </View>
  );
}

// --- স্টাইল ---
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
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 5,
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