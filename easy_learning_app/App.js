// App.js
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import RegisterScreen from './screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- ১. মূল অ্যাপ (লগইন করার পর) ---
function MainAppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerLargeTitle: true }}>
      <Stack.Screen name="ExploreMain" component={ExploreScreen} options={{ title: 'Explore' }} />
      <Stack.Screen name="CourseList" component={CourseListScreen} options={({ route }) => ({ title: route.params.categoryName })} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={({ route }) => ({ title: route.params.courseTitle })} />
      <Stack.Screen name="UnitDetail" component={UnitDetailScreen} options={({ route }) => ({ title: route.params.unitTitle })} />
      <Stack.Screen name="LessonVideo" component={LessonVideoScreen} options={({ route }) => ({ title: route.params.lessonTitle, headerLargeTitle: false })} />
      <Stack.Screen name="LessonArticle" component={LessonArticleScreen} options={({ route }) => ({ title: route.params.lessonTitle, headerLargeTitle: false })} />
      <Stack.Screen name="QuizScreen" component={QuizScreen} options={({ route }) => ({ title: route.params.quizTitle, headerLargeTitle: false })} />
    </Stack.Navigator>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerLargeTitle: true }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen 
        name="ExploreStack"
        component={MainAppStack}
        options={{ title: 'Explore', headerShown: false }} 
      />
    </Tab.Navigator>
  );
}

// --- ২. Auth স্ট্যাক (লগইন করার আগে) ---
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// --- ৩. মূল নেভিগেশন কন্ট্রোলার ---
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

// --- ৪. অ্যাপটি চালু করুন ---
export default function App() {
  return (
    // --- (নতুন) সেফ এরিয়া প্রোভাইডার ---
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}