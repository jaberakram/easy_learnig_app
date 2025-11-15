// screens/MatchingGameScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from '../constants/theme';
// ----------------------------------------

// --- হেলপার ফাংশন: অ্যারে এলোমেলো করা ---
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

export default function MatchingGameScreen({ route }) {
    const { gameId } = route.params;
    const { userToken, API_URL_BASE } = useAuth();
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [gameData, setGameData] = useState(null);
    
    // --- পরিবর্তন: একটি 'items' অ্যারের বদলে দুটি আলাদা অ্যারে ---
    const [itemsA, setItemsA] = useState([]); // কলাম A
    const [itemsB, setItemsB] = useState([]); // কলাম B
    // ----------------------------------------------------
    
    const [selectedItem, setSelectedItem] = useState(null); // { id: '1-a', pairId: 1, type: 'a' }
    const [matchedPairs, setMatchedPairs] = useState([]); // [1, 2, ...]
    const [wrongPair, setWrongPair] = useState([]); // ['1-a', '2-b']
    
    const [gameFinished, setGameFinished] = useState(false);

    // --- গেম লোড করার ফাংশন ---
    const fetchGame = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL_BASE}/api/games/${gameId}/`, {
                headers: { 'Authorization': `Token ${userToken}` },
            });
            if (!response.ok) throw new Error('গেম লোড করা যায়নি।');
            const data = await response.json();
            setGameData(data);
            initializeGame(data.pairs);
        } catch (e) {
            Alert.alert("Error", e.message);
        } finally {
            setLoading(false);
        }
    }, [gameId, userToken, API_URL_BASE]);

    // --- পরিবর্তন: গেম শুরু করা (দুটি কলাম আলাদাভাবে) ---
    const initializeGame = (pairs) => {
        const itemsA_data = pairs.map(p => ({ id: `${p.id}-a`, text: p.item_one, pairId: p.id, type: 'a' }));
        const itemsB_data = pairs.map(p => ({ id: `${p.id}-b`, text: p.item_two, pairId: p.id, type: 'b' }));
        
        // --- প্রতিটি কলামকে আলাদাভাবে এলোমেলো করা ---
        setItemsA(shuffleArray(itemsA_data));
        setItemsB(shuffleArray(itemsB_data));

        setSelectedItem(null);
        setMatchedPairs([]);
        setWrongPair([]);
        setGameFinished(false);
    };
    // -------------------------------------------------

    useEffect(() => {
        fetchGame();
    }, [fetchGame]);

    // --- আইটেম সিলেক্ট হ্যান্ডলার (অপরিবর্তিত) ---
    const handleItemPress = (item) => {
        if (matchedPairs.includes(item.pairId) || (wrongPair.length > 0)) {
            return; 
        }

        if (!selectedItem) {
            setSelectedItem(item);
            return;
        }

        if (selectedItem.id === item.id) {
            setSelectedItem(null);
            return;
        }

        if (selectedItem.type === item.type) {
            setSelectedItem(item);
            return;
        }

        if (selectedItem.pairId === item.pairId) {
            setMatchedPairs(prev => [...prev, item.pairId]);
            setSelectedItem(null);
            
            if (matchedPairs.length + 1 === (gameData?.pairs?.length || 0)) {
                setGameFinished(true);
            }
        } else {
            setWrongPair([selectedItem.id, item.id]);
            setSelectedItem(null);
            setTimeout(() => {
                setWrongPair([]);
            }, 1000);
        }
    };

    // --- কার্ডের স্টাইল (অপরিবর্তিত) ---
    const getCardStyle = (item) => {
        if (matchedPairs.includes(item.pairId)) {
            return [styles.card, styles.matchedCard];
        }
        if (wrongPair.includes(item.id)) {
            return [styles.card, styles.wrongCard];
        }
        if (selectedItem?.id === item.id) {
            return [styles.card, styles.selectedCard];
        }
        return styles.card;
    };
    
    const getCardTextStyle = (item) => {
         if (matchedPairs.includes(item.pairId) || wrongPair.includes(item.id) || selectedItem?.id === item.id) {
             return styles.selectedCardText;
         }
         return styles.cardText;
    };


    if (loading || !gameData) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }
    
    // --- গেম শেষ হলে (অপরিবর্তিত) ---
    if (gameFinished) {
        return (
            <SafeAreaView style={styles.resultsContainer}>
                <Ionicons name="sparkles" size={80} color={COLORS.progress} />
                <Text style={styles.resultsTitle}>দারুণ!</Text>
                <Text style={styles.summaryText}>আপনি সফলভাবে সবগুলো মিলিয়েছেন।</Text>
                
                <TouchableOpacity style={styles.button} onPress={fetchGame}>
                    <Text style={styles.buttonText}>আবার খেলুন</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.goBack()}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>ফিরে যান</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Text style={styles.title}>{gameData.title}</Text>
            <Text style={styles.instructions}>সঠিক জোড়াগুলো মেলান</Text>
            
            {/* --- পরিবর্তন: লেআউট দুটি কলামে ভাগ করা --- */}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.gameContainer}>
                    {/* --- কলাম A --- */}
                    <View style={styles.column}>
                        {itemsA.map(item => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={getCardStyle(item)}
                                onPress={() => handleItemPress(item)}
                            >
                                <Text style={getCardTextStyle(item)}>{item.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    {/* --- কলাম B --- */}
                    <View style={styles.column}>
                        {itemsB.map(item => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={getCardStyle(item)}
                                onPress={() => handleItemPress(item)}
                            >
                                <Text style={getCardTextStyle(item)}>{item.text}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// --- স্টাইল (দুটি কলামের জন্য আপডেটেড) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background, 
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background, 
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.accent, 
        textAlign: 'center',
        marginTop: 10,
    },
    instructions: {
        fontSize: 16,
        color: COLORS.textLight, 
        textAlign: 'center',
        marginBottom: 15,
    },
    scrollContainer: { // নতুন স্টাইল
        flexGrow: 1,
    },
    gameContainer: {
        flex: 1, // নতুন
        flexDirection: 'row',
        justifyContent: 'space-between', // 'space-around' থেকে পরিবর্তন
        padding: 10,
    },
    column: { // নতুন স্টাইল
        width: '48%', // কলামের প্রস্থ (মাঝে গ্যাপ রাখার জন্য)
        flexDirection: 'column',
    },
    card: {
        width: '100%', // কলামের সম্পূর্ণ প্রস্থ
        minHeight: 100, // উচ্চতা auto
        backgroundColor: COLORS.white, 
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.border, 
        marginBottom: 15,
    },
    cardText: {
        fontSize: 15,
        color: COLORS.text, 
        textAlign: 'center',
    },
    selectedCard: {
        backgroundColor: COLORS.primary, 
        borderColor: COLORS.primary, 
    },
    selectedCardText: {
        fontSize: 15,
        color: COLORS.white, 
        textAlign: 'center',
        fontWeight: 'bold',
    },
    matchedCard: {
        backgroundColor: COLORS.green, 
        borderColor: COLORS.green, 
        opacity: 0.7, 
    },
    wrongCard: {
        backgroundColor: COLORS.error, 
        borderColor: COLORS.error, 
    },
    
    // --- ফলাফল স্ক্রিন স্টাইল (অপরিবর্তিত) ---
    resultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white, 
        padding: 20,
    },
    resultsTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.accent, 
        marginTop: 15,
    },
    summaryText: {
        fontSize: 18,
        color: COLORS.textLight, 
        textAlign: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    button: {
        backgroundColor: COLORS.primary, 
        padding: 18,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
    },
    buttonText: {
        color: COLORS.white, 
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: COLORS.white, 
        borderWidth: 1,
        borderColor: COLORS.primary, 
    },
    secondaryButtonText: {
        color: COLORS.primary, 
    },
});