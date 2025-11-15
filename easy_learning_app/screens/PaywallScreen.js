// screens/PaywallScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ----------------------------------------

export default function PaywallScreen({ route }) {
    const { courseTitle } = route.params;
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerIcon}>
                    <Ionicons name="lock-closed" size={80} color={COLORS.primary} />
                </View>

                <Text style={styles.title}>
                    <Text style={styles.courseTitle}>"{courseTitle}"</Text> কোর্সটি আনলক করুন
                </Text>
                
                <Text style={styles.subtitle}>
                    এই প্রিমিয়াম কোর্সটি চালিয়ে যেতে, অনুগ্রহ করে এনরোলমেন্ট সম্পন্ন করুন।
                </Text>

                {/* --- ফিচারের তালিকা --- */}
                <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.progress} />
                        <Text style={styles.featureText}>সবগুলো লেসন ও ভিডিও অ্যাক্সেস</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.progress} />
                        <Text style={styles.featureText}>সবগুলো মাস্টারি কুইজ ও গেম</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.progress} />
                        <Text style={styles.featureText}>স্টাডি গ্রুপে অংশগ্রহণের সুবিধা</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.progress} />
                        <Text style={styles.featureText}>কোর্স কমপ্লিশন সার্টিফিকেট (শীঘ্রই আসছে)</Text>
                    </View>
                </View>

                {/* --- এনরোল বাটন --- */}
                <TouchableOpacity 
                    style={styles.enrollButton} 
                    onPress={() => navigation.navigate('WhatsappGuide')}
                >
                    <Text style={styles.buttonText}>কিভাবে এনরোল করবেন?</Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

// --- স্টাইল (থিম কালার ব্যবহার করে আপডেট) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white, // পরিবর্তন
    },
    container: {
        flexGrow: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerIcon: {
        marginBottom: 20,
        padding: 20,
        backgroundColor: COLORS.primary + '20', // পরিবর্তন
        borderRadius: 100,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.accent, // পরিবর্তন
        textAlign: 'center',
        marginBottom: 10,
    },
    courseTitle: {
        color: COLORS.primary, // পরিবর্তন
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight, // পরিবর্তন
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    featureList: {
        width: '100%',
        marginBottom: 30,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: COLORS.background, // পরিবর্তন
        padding: 12,
        borderRadius: 8,
    },
    featureText: {
        fontSize: 16,
        color: COLORS.text, // পরিবর্তন
        marginLeft: 12,
        flex: 1,
    },
    enrollButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary, // পরিবর্তন
        paddingVertical: 18,
        paddingHorizontal: 30,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    buttonText: {
        color: COLORS.white, // পরিবর্তন
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
});