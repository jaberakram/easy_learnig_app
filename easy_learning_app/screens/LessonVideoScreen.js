// screens/LessonVideoScreen.js
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { useAuth } from '../context/AuthContext'; 

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
// ----------------------------------------

/**
 * --- হেলপার ফাংশন ---
 * এই ফাংশনটি একটি YouTube URL বা ID থেকে শুধু ID-টুকু বের করে আনে।
 */
const getYouTubeId = (urlOrId) => {
  if (!urlOrId) return null;
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = urlOrId.match(regex);
  if (match && match[1]) {
    return match[1];
  }
  if (urlOrId.length === 11) {
    return urlOrId;
  }
  return null;
};

// --- মূল স্ক্রিন কম্পোনেন্ট ---
export default function LessonVideoScreen({ route, navigation }) {
  // নেভিগেশন থেকে টাইটেল ও ভিডিও আইডি রিসিভ করুন
  const { videoId: urlOrId, lessonTitle, lessonId } = route.params;
  // const { userToken, API_URL_BASE } = useAuth(); // <-- এখন আর প্রয়োজন নেই
  
  const [loading, setLoading] = useState(true);
  // const [isCompleting, setIsCompleting] = useState(false); // <-- মুছে ফেলা হয়েছে
  const videoIdToPlay = useMemo(() => getYouTubeId(urlOrId), [urlOrId]);

  // --- (মুছে ফেলা) লেসন সম্পন্ন করার ফাংশন ---
  // const handleMarkAsComplete = async () => { ... };
  // --------------------------------------

  if (!videoIdToPlay) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>একটি ভুল YouTube URL বা ID দেওয়া হয়েছে।</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{lessonTitle || 'Video Lesson'}</Text>

      <View style={styles.videoPlayerContainer}>
        {loading && (
          <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color={COLORS.primary} />
        )}
        <YoutubeIframe
          height={loading ? 0 : 250}
          videoId={videoIdToPlay}
          onReady={() => setLoading(false)}
          onError={(e) => Alert.alert('Error', 'ভিডিওটি লোড করা যায়নি।')}
          play={true}
        />
      </View>

      <View style={styles.flexibleSpace} />

      {/* --- (পরিবর্তিত) সাধারণ "ফিরে যান" বাটন --- */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.goBack()} // <-- শুধু ফিরে যাওয়ার কাজ করে
      >
        <Text style={styles.buttonText}>
          <Ionicons name="arrow-back-outline" size={16} color={COLORS.white} /> ফিরে যান
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- স্টাইল (থিম কালার ব্যবহার করে আপডেট) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // পরিবর্তন
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.accent, // পরিবর্তন
  },
  videoPlayerContainer: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.border, // পরিবর্তন
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  flexibleSpace: {
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.accent, // পরিবর্তন (Primary এর বদলে Accent)
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 50,
    justifyContent: 'center',
    flexDirection: 'row', // আইকনের জন্য
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled, // পরিবর্তন
  },
  buttonText: {
    color: COLORS.white, // পরিবর্তন
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.white, // পরিবর্তন
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error, // পরিবর্তন
  },
});