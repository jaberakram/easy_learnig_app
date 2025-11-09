// screens/LessonVideoScreen.js
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { useAuth } from '../context/AuthContext'; // <-- AuthContext ইম্পোর্ট করুন

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
  const { userToken, API_URL_BASE } = useAuth(); // <-- টোকেন এবং API URL নিন
  
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false); // <-- বাটন লোডিং স্টেট
  const videoIdToPlay = useMemo(() => getYouTubeId(urlOrId), [urlOrId]);

  // --- (নতুন) লেসন সম্পন্ন করার ফাংশন ---
  const handleMarkAsComplete = async () => {
    setIsCompleting(true);
    try {
      await fetch(`${API_URL_BASE}/api/progress/lesson/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${userToken}`, // <-- টোকেন পাঠানো হচ্ছে
        },
        body: JSON.stringify({
          lesson: lessonId, // <-- কোন লেসনটি শেষ হলো
        }),
      });
      // সফল হলে বা ব্যর্থ হলেও পেছনে ফিরে যান (আপাতত)
      navigation.goBack();
      
    } catch (e) {
      console.error('Lesson complete error', e);
      Alert.alert('ত্রুটি', 'লেসনটি সম্পন্ন হিসেবে মার্ক করা যায়নি।');
      setIsCompleting(false);
    }
  };

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
          <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color="#0000ff" />
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

      {/* --- (আপডেটেড) পাঠ সম্পন্ন বাটন --- */}
      <TouchableOpacity 
        style={[styles.button, isCompleting ? styles.buttonDisabled : null]} 
        onPress={handleMarkAsComplete}
        disabled={isCompleting} // লোডিং চলাকালীন বাটন নিষ্ক্রিয়
      >
        {isCompleting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>✅ পাঠ সম্পন্ন (ফিরে যান)</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- স্টাইল ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  videoPlayerContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  flexibleSpace: {
    flex: 1,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 50, // লোডিং স্পিনারের জন্য
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
  },
});