// screens/LessonArticleScreen.js
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';

import RenderHTML from 'react-native-render-html'; 
// --- useAuth ইম্পোর্ট সরানো হয়েছে ---
// import { useAuth } from '../context/AuthContext'; 

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
// ----------------------------------------

// --- নতুন: HTML Entities Decode করার ফাংশন ---
// এটি সার্ভার থেকে আসা Escaped HTML কে (যেমন &lt;p&gt;) সঠিক HTML (<p>) এ পরিবর্তন করবে।
const decodeHTMLEntities = (text) => {
  if (!text) return '';
  // সহজ এনটিটি ডিকোডিং
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
};
// ----------------------------------------

export default function LessonArticleScreen({ route, navigation }) {
  // নেভিগেশন থেকে আর্টিকেল বডি ও লেসন আইডি রিসিভ করুন
  const { articleBody, lessonId } = route.params;
  // --- টোকেন এবং API URL সরানো হয়েছে ---
  
  // const [isCompleting, setIsCompleting] = useState(false); // <-- মুছে ফেলা হয়েছে
  const { width } = useWindowDimensions();

  // --- পরিবর্তন: ডিকোডিং ফাংশন ব্যবহার করা হয়েছে ---
  const decodedArticleBody = decodeHTMLEntities(articleBody);
  
  const htmlSource = {
    html: decodedArticleBody || '<p>এই পাঠে কোনো আর্টিকেল যোগ করা হয়নি।</p>'
  };
  // ----------------------------------------

  // --- লেসন সম্পন্ন করার ফাংশন (মুছে ফেলা হয়েছে) ---
  // const handleMarkAsComplete = async () => { ... };
  // ----------------------------------------

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

        {/* ২. (পরিবর্তিত) সাধারণ "ফিরে যান" বাটন */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.goBack()} // <-- শুধু ফিরে যাওয়ার কাজ করে
          >
            <Text style={styles.buttonText}>
              <Ionicons name="arrow-back-outline" size={16} color={COLORS.white} /> ফিরে যান
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- স্টাইল (থিম কালার ব্যবহার করে আপডেট) ---
const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.white // পরিবর্তন
  },
  container: { 
    flex: 1 
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  buttonContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border, // পরিবর্তন
    backgroundColor: COLORS.white, // পরিবর্তন
  },
  button: {
    backgroundColor: COLORS.accent, // পরিবর্তন (Primary এর বদলে Accent)
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
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
});

// HTML ট্যাগগুলোর জন্য কাস্টম স্টাইল (থিম কালার ব্যবহার করে আপডেট)
const tagsStyles = {
  body: { 
    whiteSpace: 'normal', 
    color: COLORS.text, // পরিবর্তন
    fontSize: 17, 
    lineHeight: 26 
  },
  p: { 
    marginBottom: 15 
  },
  h1: { 
    fontSize: 30, 
    fontWeight: 'bold', 
    marginBottom: 10,
    color: COLORS.accent // পরিবর্তন
  },
  h2: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: COLORS.accent // পরিবর্তন
  },
  ul: { 
    marginLeft: 15 
  },
  li: { 
    marginBottom: 8 
  },
  img: { 
    maxWidth: '100%', 
    height: 'auto', 
    borderRadius: 8 
  },
};