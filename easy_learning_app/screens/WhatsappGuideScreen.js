// screens/WhatsappGuideScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking, Alert, ScrollView } from 'react-native';

// --- (নতুন) আপনার WhatsApp নম্বর এবং মেসেজ এখানে দিন ---
const ADMIN_WHATSAPP_NUMBER = '+8801930772966'; // (আপনার আসল নম্বর দিন)
const WHATSAPP_MESSAGE = 'আমি আপনার অ্যাপের প্রিমিয়াম কোর্সে এনরোল করতে চাই।';
// ----------------------------------------------------


export default function WhatsappGuideScreen({ route, navigation }) {
  const { courseTitle } = route.params;

  // --- WhatsApp খোলার ফাংশন ---
  const handleOpenWhatsApp = async () => {
    const url = `whatsapp://send?phone=${ADMIN_WHATSAPP_NUMBER}&text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('WhatsApp পাওয়া যায়নি', 'অনুগ্রহ করে আপনার ফোনে WhatsApp ইনস্টল করুন।');
      }
    } catch (e) {
      console.error('WhatsApp open error', e);
      Alert.alert('একটি সমস্যা হয়েছে', 'WhatsApp চালু করা যায়নি।');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.title}>এনরোলমেন্ট গাইডলাইন</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ধাপ ১: পেমেন্ট করুন</Text>
            <Text style={styles.description}>
              অনুগ্রহ করে নিচের নম্বরে কোর্স ফি পাঠান।
            </Text>
            <Text style={styles.paymentNumber}>বিকাশ/নগদ: 01930772966</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ধাপ ২: অ্যাডমিনকে জানান</Text>
            <Text style={styles.description}>
              পেমেন্ট সম্পন্ন করার পর, নিচের বাটনে ক্লিক করে WhatsApp-এ আপনার পেমেন্টের তথ্য (যেমন: TrxID বা শেষ নম্বর) অ্যাডমিনকে পাঠান।
            </Text>
            <Text style={styles.description}>
              অ্যাডমিন আপনার পেমেন্ট ভেরিফাই করে কিছুক্ষণের মধ্যেই কোর্সটি আনলক করে দেবে।
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleOpenWhatsApp}
          >
            <Text style={styles.buttonText}>WhatsApp-এ যোগাযোগ করুন</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- স্টাইল ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 10,
  },
  paymentNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d9534f',
    textAlign: 'center',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#25D366', // WhatsApp-এর সবুজ রঙ
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});