// App.js
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // <-- আইকনের জন্য

// AuthContext ইম্পোর্ট
import { AuthProvider, useAuth } from './context/AuthContext';

// --- স্ক্রিন ইম্পোর্ট ---
import HomeScreen from './screens/HomeScreen';
import ExploreScreen from './screens/ExploreScreen';
import CourseListScreen from './screens/CourseListScreen';
import CourseDetailScreen from './screens/CourseDetailScreen';
import UnitDetailScreen from './screens/UnitDetailScreen';
import LessonVideoScreen from './screens/LessonVideoScreen';
import LessonArticleScreen from './screens/LessonArticleScreen';
import QuizScreen from './screens/QuizScreen';
import LoginScreen from './screens/LoginScreen';
// --- পরিবর্তন: RegisterScreen ইম্পোর্ট করুন ---
import RegisterScreen from './screens/RegisterScreen'; 
import PaywallScreen from './screens/PaywallScreen'; 
import WhatsappGuideScreen from './screens/WhatsappGuideScreen'; 
import ProfileScreen from './screens/ProfileScreen'; 
import MatchingGameScreen from './screens/MatchingGameScreen'; 

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- MainAppStack (অপরিবর্তিত) ---
function MainAppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerLargeTitle: true }}>
      <Stack.Screen name="ExploreMain" component={ExploreScreen} options={{ title: 'Explore' }} />
      
      <Stack.Screen 
        name="CourseList" 
        component={CourseListScreen} 
        options={({ route }) => ({ 
          title: route.params.searchTitle || route.params.categoryName 
        })} 
      />

      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={({ route }) => ({ title: route.params.courseTitle })} />
      <Stack.Screen name="UnitDetail" component={UnitDetailScreen} options={({ route }) => ({ title: route.params.unitTitle })} />
      <Stack.Screen name="LessonVideo" component={LessonVideoScreen} options={({ route }) => ({ title: route.params.lessonTitle, headerLargeTitle: false })} />
      <Stack.Screen name="LessonArticle" component={LessonArticleScreen} options={({ route }) => ({ title: route.params.lessonTitle, headerLargeTitle: false })} />
      <Stack.Screen name="QuizScreen" component={QuizScreen} options={({ route }) => ({ title: route.params.quizTitle, headerLargeTitle: false })} />
      
      <Stack.Screen 
        name="MatchingGame" 
        component={MatchingGameScreen} 
        options={({ route }) => ({ title: route.params.gameTitle, headerLargeTitle: false })} 
      />

      <Stack.Screen 
        name="Paywall" 
        component={PaywallScreen} 
        options={({ route }) => ({ title: route.params.courseTitle, headerLargeTitle: false })} 
      />

      <Stack.Screen 
        name="WhatsappGuide" 
        component={WhatsappGuideScreen} 
        options={{ title: 'Enrollment Guide', headerLargeTitle: false }} 
      />
    </Stack.Navigator>
  );
}

// --- HomeTabs (অপরিবর্তিত) ---
function HomeTabs() {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerLargeTitle: true,
        tabBarActiveTintColor: '#007bff', 
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => { 
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ExploreStack') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen 
        name="ExploreStack"
        component={MainAppStack}
        options={{ title: 'Explore', headerShown: false }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }} 
      />
    </Tab.Navigator>
  );
}

// --- পরিবর্তন: AuthStack ---
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      {/* --- RegisterScreen আবার যোগ করা হয়েছে --- */}
      <Stack.Screen name="Register" component={RegisterScreen} /> 
    </Stack.Navigator>
  );
}
// -----------------------------

// --- (AppNavigator অপরিবর্তিত) ---
function AppNavigator() {
  const { userToken, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userToken == null ? <AuthStack /> : <HomeTabs />}
    </NavigationContainer>
  );
}

// --- (export default App অপরিবর্তিত) ---
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}