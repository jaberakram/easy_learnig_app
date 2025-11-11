// screens/LessonArticleScreen.js
import React, { useState } from 'react';
// --- 'ScrollView' এবং 'Text' (আর্টিকেলের জন্য) বাদ দিন ---
import { View, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Text } from 'react-native';
// --- 'WebView' ইম্পোর্ট করুন ---
import { WebView } from 'react-native-webview'; 
import { useAuth } from '../context/AuthContext';

export default function LessonArticleScreen({ route, navigation }) {
  const { articleBody, lessonId, lessonTitle } = route.params;
  const { userToken, API_URL_BASE } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);

  const handleCompleteLesson = async () => {
    try {
      const response = await fetch(`${API_URL_BASE}/api/progress/lesson/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${userToken}`,
        },
        body: JSON.stringify({ lesson: lessonId }),
      });
      if (response.ok) {
        setIsCompleted(true);
        Alert.alert('সফল!', 'আপনি সফলভাবে পাঠটি সম্পন্ন করেছেন।');
      } else {
        throw new Error('পাঠ সম্পন্ন হিসেবে সেভ করা যায়নি।');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('ত্রুটি', e.message);
    }
  };

  // --- (নতুন) HTML-কে সুন্দর করার জন্য CSS ---
  const htmlWithStyling = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            font-size: 17px; /* ফন্ট সাইজ একটু বড় করা হলো */
            line-height: 1.7; /* লাইন স্পেসিং বাড়ানো হলো */
            padding: 15px;
            color: #333;
          }
          h2, h3 {
            color: #000;
          }
          code {
            background-color: #f0f0f0;
            padding: 2px 5px;
            border-radius: 4px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 16px;
          }
          ul, ol {
            padding-left: 25px;
          }
          li {
            margin-bottom: 10px;
          }
          img { /* যদি আর্টিকেলে ছবি থাকে */
            max-width: 100%;
            height: auto;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        ${articleBody}
      </body>
    </html>
  `;
  // ----------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: htmlWithStyling }} // <-- এখানে HTML লোড করুন
        scrollEnabled={true} 
      />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isCompleted ? styles.buttonDisabled : null]} 
          onPress={handleCompleteLesson}
          disabled={isCompleted}
        >
          <Text style={styles.buttonText}>
            {isCompleted ? 'পাঠ সম্পন্ন হয়েছে' : 'পাঠ সম্পন্ন করুন'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- স্টাইল (পরিবর্তিত) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1, 
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
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});