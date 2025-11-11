// screens/MatchingGameScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- হেলপার ফাংশন: অ্যারে শাফল ( এলোমেলো ) করার জন্য ---
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
// ------------------------------------

// --- পরিবর্তন: navigation prop যোগ করা হয়েছে ---
export default function MatchingGameScreen({ route, navigation }) {
  const { gameId } = route.params;
  const { userToken, API_URL_BASE } = useAuth();

  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);

  // --- গেম লজিক স্টেট ---
  const [leftItems, setLeftItems] = useState([]); 
  const [rightItems, setRightItems] = useState([]); 
  const [selectedLeft, setSelectedLeft] = useState(null); 
  const [selectedRight, setSelectedRight] = useState(null); 
  const [matchedPairs, setMatchedPairs] = useState([]); 
  const [wrongPair, setWrongPair] = useState([]); 
  const [isChecking, setIsChecking] = useState(false); 
  const [gameWon, setGameWon] = useState(false);

  // --- ডেটা লোড করার ফাংশন (অপরিবর্তিত) ---
  const fetchGame = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setGameWon(false);
      
      const response = await fetch(`${API_URL_BASE}/api/matching-games/${gameId}/`, {
        headers: {
          'Authorization': `Token ${userToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('গেমের তথ্য আনা যায়নি।');
      }
      
      const json = await response.json();
      setGame(json);

      if (json.pairs && json.pairs.length > 0) {
        const leftCol = [];
        const rightCol = [];
        
        json.pairs.forEach((pair) => {
          leftCol.push({ id: `left_${pair.id}`, pairId: pair.id, content: pair.item_one });
          rightCol.push({ id: `right_${pair.id}`, pairId: pair.id, content: pair.item_two });
        });
        
        setLeftItems(shuffleArray(leftCol)); 
        setRightItems(shuffleArray(rightCol)); 
        
        setSelectedLeft(null);
        setSelectedRight(null);
        setMatchedPairs([]);
        setWrongPair([]);
        setIsChecking(false);
        
      } else {
        setError('এই গেমে কোনো কার্ড যোগ করা হয়নি।');
      }
      
    } catch (e) {
      console.error(e);
      setError('একটি ত্রুটি ঘটেছে।');
    } finally {
      setLoading(false);
    }
  }, [gameId, userToken, API_URL_BASE]);

  useFocusEffect(
    useCallback(() => {
      fetchGame();
    }, [fetchGame])
  );

  // --- চেক করার লজিক (অপরিবর্তিত) ---
  useEffect(() => {
    if (selectedLeft && selectedRight && !isChecking) {
      setIsChecking(true);

      if (selectedLeft.pairId === selectedRight.pairId) {
        setMatchedPairs(prev => [...prev, selectedLeft.pairId]);
        setSelectedLeft(null);
        setSelectedRight(null);
        setIsChecking(false);
        
        if (matchedPairs.length + 1 === game.pairs.length) {
          setGameWon(true);
        }
      } else {
        setWrongPair([selectedLeft.id, selectedRight.id]);
        
        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
          setWrongPair([]);
          setIsChecking(false);
        }, 1000); 
      }
    }
  }, [selectedLeft, selectedRight]);

  // --- কার্ড প্রেস হ্যান্ডলার (অপরিবর্তিত) ---
  const handlePressLeft = (item) => {
    if (isChecking || matchedPairs.includes(item.pairId) || selectedLeft?.id === item.id) return;
    setSelectedLeft(item);
  };

  const handlePressRight = (item) => {
    if (isChecking || matchedPairs.includes(item.pairId) || selectedRight?.id === item.id) return;
    setSelectedRight(item);
  };

  // --- রেন্ডারিং ---
  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#0000ff" />;
  }

  if (error) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // --- পরিবর্তন: গেম জেতার স্ক্রিন ---
  if (gameWon) {
    return (
      <View style={styles.loader}>
        <Ionicons name="trophy" size={80} color="#FFD700" />
        <Text style={styles.gameTitle}>অভিনন্দন!</Text>
        <Text style={styles.gameWonText}>আপনি সফলভাবে গেমটি শেষ করেছেন।</Text>
        
        {/* "আবার খেলুন" বাটন */}
        <TouchableOpacity style={styles.button} onPress={fetchGame}>
          <Text style={styles.buttonText}>আবার খেলুন</Text>
        </TouchableOpacity>
        
        {/* --- নতুন: "ফিরে যান" বাটন --- */}
        <TouchableOpacity 
          style={[styles.button, styles.goBackButton]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>ইউনিটে ফিরে যান</Text>
        </TouchableOpacity>
        {/* --------------------------- */}
      </View>
    );
  }
  // --- পরিবর্তন শেষ ---

  // --- কলাম রেন্ডার করার ফাংশন (অপরিবর্তিত) ---
  const renderColumn = (items, side) => {
    const handlePress = side === 'left' ? handlePressLeft : handlePressRight;
    
    return (
      <View style={styles.column}>
        {items.map(item => {
          const isSelected = (side === 'left' && selectedLeft?.id === item.id) || (side === 'right' && selectedRight?.id === item.id);
          const isMatched = matchedPairs.includes(item.pairId);
          const isWrong = (side === 'left' && wrongPair[0] === item.id) || (side === 'right' && wrongPair[1] === item.id);

          return (
            <TouchableOpacity 
              key={item.id}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : null,
                isMatched ? styles.cardMatched : null,
                isWrong ? styles.cardWrong : null,
              ]}
              onPress={() => handlePress(item)}
              disabled={isChecking || isMatched}
            >
              <Text style={styles.cardText}>{item.content}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.gameTitle}>{game.title}</Text>
      <Text style={styles.instructions}>বাম কলামের সাথে ডান কলামের সঠিক জোড়া মেলান</Text>
      
      <View style={styles.gameArea}>
        {renderColumn(leftItems, 'left')}
        {renderColumn(rightItems, 'right')}
      </View>
    </ScrollView>
  );
}

// --- স্টাইল (নতুন বাটন স্টাইল যোগ করা হয়েছে) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  instructions: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 20,
  },
  gameArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  column: {
    flex: 1, 
    marginHorizontal: 5,
  },
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 10,
    minHeight: 80, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: '#007bff', 
    backgroundColor: '#e6f2ff',
  },
  cardMatched: {
    borderColor: '#28a745', 
    backgroundColor: '#d4edda',
    opacity: 0.6, 
  },
  cardWrong: {
    borderColor: '#dc3545', 
    backgroundColor: '#f8d7da',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  gameWonText: {
    fontSize: 18,
    color: 'gray',
    textAlign: 'center',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '80%', // <-- প্রস্থ ঠিক করা
  },
  // --- নতুন: "ফিরে যান" বাটন স্টাইল ---
  goBackButton: {
    backgroundColor: '#6c757d', // ধূসর রঙ
    marginTop: 10,
  },
  // ------------------------------
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});