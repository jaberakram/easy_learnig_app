// screens/PaywallScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export default function PaywallScreen({ route, navigation }) {
  // --- (পরিবর্তন) কোর্স আইডি এবং টাইটেল রিসিভ করুন ---
  const { courseId, courseTitle } = route.params;

  // --- (পরিবর্তন) এই ফাংশনটি এখন গাইডলাইন পেজে পাঠাবে ---
  const handleEnroll = () => {
    navigation.navigate('WhatsappGuide', { 
      courseId: courseId, 
      courseTitle: courseTitle 
    });
  };
  // ----------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>"{courseTitle}"</Text>
        <Text style={styles.subtitle}>এটি একটি প্রিমিয়াম কোর্স</Text>
        <Text style={styles.description}>
          এই কোর্সের সমস্ত ইউনিট, লেসন এবং কুইজ আনলক করতে অনুগ্রহ করে এনরোল করুন।
        </Text>

        <View style={styles.flexibleSpace} />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleEnroll} // <-- পরিবর্তিত ফাংশন
        >
          <Text style={styles.buttonText}>কোর্সটি কিনুন</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- স্টাইল (অপরিবর্তিত) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  icon: {
    fontSize: 80,
    marginTop: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#555',
    marginTop: 5,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  flexibleSpace: {
    flex: 1,
  },
  button: {
    backgroundColor: '#007bff', // <-- আসল "Buy" বাটন কালার
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});