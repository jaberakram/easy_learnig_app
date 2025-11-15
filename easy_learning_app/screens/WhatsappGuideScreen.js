// screens/WhatsappGuideScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ----------------------------------------

export default function WhatsappGuideScreen() {
    
    // --- পেমেন্ট নম্বর (ভবিষ্যতে API থেকে আনা উচিত) ---
    const bkashNumber = '+8801930772966';
    const whatsappNumber = '+8801930772966';
    const whatsappMessage = "Hi, I have completed the payment for the course. Please activate my account.";

    // --- WhatsApp ওপেন করার ফাংশন ---
    const openWhatsApp = () => {
        const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(whatsappMessage)}`;
        Linking.openURL(url).catch(() => {
            Alert.alert('ত্রুটি', 'আপনার ফোনে WhatsApp ইনস্টল করা নেই।');
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerTitle}>এনরোলমেন্ট গাইড</Text>
                <Text style={styles.subtitle}>
                    কোর্সটি আনলক করতে নিচের ধাপগুলো অনুসরণ করুন।
                </Text>

                {/* --- ধাপ ১ --- */}
                <View style={styles.stepCard}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>ধাপ ১</Text>
                        <Text style={styles.stepTitle}>পেমেন্ট করুন</Text>
                    </View>
                    <Text style={styles.stepInstruction}>
                        আপনার বিকাশ বা নগদ অ্যাপ থেকে নিচের নম্বরে কোর্স ফি সেন্ড মানি করুন:
                    </Text>
                    <View style={styles.numberContainer}>
                        <Ionicons name="call" size={20} color={COLORS.primary} />
                        <Text style={styles.numberText}>{bkashNumber}</Text>
                    </View>
                    <Text style={styles.noteText}>
                        (অনুগ্রহ করে পেমেন্টের একটি স্ক্রিনশট বা TrxID সংরক্ষণ করুন)
                    </Text>
                </View>

                {/* --- ধাপ ২ --- */}
                <View style={styles.stepCard}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>ধাপ ২</Text>
                        <Text style={styles.stepTitle}>WhatsApp-এ মেসেজ দিন</Text>
                    </View>
                    <Text style={styles.stepInstruction}>
                        পেমেন্ট সম্পন্ন করার পর, আপনার পেমেন্টের স্ক্রিনশট এবং যে ইমেইল দিয়ে অ্যাপে রেজিস্ট্রেশন করেছেন, তা আমাদের WhatsApp নম্বরে পাঠিয়ে দিন।
                    </Text>
                    <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp}>
                        <Ionicons name="logo-whatsapp" size={24} color={COLORS.white} />
                        <Text style={styles.buttonText}>Open WhatsApp</Text>
                    </TouchableOpacity>
                </View>
                
                {/* --- ধাপ ৩ --- */}
                <View style={styles.stepCard}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>ধাপ ৩</Text>
                        <Text style={styles.stepTitle}>অ্যাক্টিভেশনের জন্য অপেক্ষা করুন</Text>
                    </View>
                    <Text style={styles.stepInstruction}>
                        আমাদের প্রতিনিধি আপনার পেমেন্ট যাচাই করে খুব শীঘ্রই আপনার একাউন্টে কোর্সটি অ্যাক্টিভেট করে দেবেন।
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

// --- স্টাইল (থিম কালার ব্যবহার করে আপডেট) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background, // পরিবর্তন
    },
    container: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight, // পরিবর্তন
        marginBottom: 25,
    },
    stepCard: {
        backgroundColor: COLORS.white, // পরিবর্তন
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border, // পরিবর্তন
        elevation: 2,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border, // পরিবর্তন
        paddingBottom: 10,
        marginBottom: 15,
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.white, // পরিবর্তন
        backgroundColor: COLORS.primary, // পরিবর্তন
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
        marginRight: 10,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
    },
    stepInstruction: {
        fontSize: 15,
        color: COLORS.text, // পরিবর্তন
        lineHeight: 22,
        marginBottom: 15,
    },
    numberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background, // পরিবর্তন
        padding: 15,
        borderRadius: 8,
        justifyContent: 'center',
    },
    numberText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary, // পরিবর্তন
        marginLeft: 10,
        letterSpacing: 1,
    },
    noteText: {
        fontSize: 13,
        color: COLORS.textLight, // পরিবর্তন
        textAlign: 'center',
        marginTop: 10,
    },
    whatsappButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.green, // পরিবর্তন (WhatsApp Green)
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: COLORS.white, // পরিবর্তন
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});