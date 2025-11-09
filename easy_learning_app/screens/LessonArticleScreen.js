// screens/LessonArticleScreen.js
import React, { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, Text, View, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';

import { useAuth } from '../context/AuthContext'; // <-- AuthContext ইম্পোর্ট করুন

export default function LessonArticleScreen({ route, navigation }) {
  // নেভিগেশন থেকে আর্টিকেল বডি ও লেসন আইডি রিসিভ করুন
  const { articleBody, lessonId } = route.params;
  const { userToken, API_URL_BASE } = useAuth(); // <-- টোকেন এবং API URL নিন
  
  const [isCompleting, setIsCompleting] = useState(false); // <-- বাটন লোডিং স্টেট
  const { width } = useWindowDimensions();

  const htmlSource = {
    html: articleBody || '<p>এই পাঠে কোনো আর্টিকেল যোগ করা হয়নি।</p>'
  };

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
      navigation.goBack();
      
    } catch (e) {
      console.error('Lesson complete error', e);
      Alert.alert('ত্রুটি', 'লেসনটি সম্পন্ন হিসেবে মার্ক করা যায়নি।');
      setIsCompleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ১. আর্টিকেল কন্টেন্ট (স্ক্রল করা যাবে) */}
        <ScrollView style={styles.scrollContainer}>
          <RenderHTML
            contentWidth={width - 40}
            source={htmlSource}
            tagsStyles={tagsStyles}
          />
        </ScrollView>

        {/* ২. (আপডেটেড) পাঠ সম্পন্ন বাটন */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, isCompleting ? styles.buttonDisabled : null]}
            onPress={handleMarkAsComplete}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>✅ পাঠ সম্পন্ন (ফিরে যান)</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- স্টাইল ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1 },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  buttonContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
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
});

// HTML ট্যাগগুলোর জন্য কাস্টম স্টাইল (আগের মতোই)
const tagsStyles = {
  body: { whiteSpace: 'normal', color: '#333', fontSize: 17, lineHeight: 26 },
  p: { marginBottom: 15 },
  h1: { fontSize: 30, fontWeight: 'bold', marginBottom: 10 },
  h2: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  ul: { marginLeft: 15 },
  li: { marginBottom: 8 },
  img: { maxWidth: '100%', height: 'auto', borderRadius: 8 },
};