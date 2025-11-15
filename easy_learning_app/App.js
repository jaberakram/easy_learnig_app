// App.js
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 

// AuthContext ইম্পোর্ট
import { AuthProvider, useAuth } from './context/AuthContext';

// --- নতুন: সেন্ট্রাল থিম থেকে কালার ইম্পোর্ট ---
import { COLORS } from './constants/theme';
// ----------------------------------------

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
import PaywallScreen from './screens/PaywallScreen'; 
import WhatsappGuideScreen from './screens/WhatsappGuideScreen'; 
import ProfileScreen from './screens/ProfileScreen'; 
import MatchingGameScreen from './screens/MatchingGameScreen'; 
import GroupListScreen from './screens/GroupListScreen'; 
import GroupDetailScreen from './screens/GroupDetailScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import GroupJoinScreen from './screens/GroupJoinScreen';
import LessonDetailScreen from './screens/LessonDetailScreen'; 
// ----------------------------

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- কালার প্যালেট (এই অংশটি মুছে ফেলা হয়েছে) ---
// const COLORS = { ... };
// ---------------------------------

// --- MainAppStack (থিম কালার ব্যবহার করে আপডেট) ---
function MainAppStack() {
  return (
    <Stack.Navigator 
        screenOptions={{ 
            headerLargeTitle: true,
            headerTintColor: COLORS.accent, // হেডার টেক্সট কালার
            headerStyle: { backgroundColor: COLORS.background }, // হেডার ব্যাকগ্রাউন্ড
        }}
    >
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
      
      <Stack.Screen 
        name="LessonDetail" 
        component={LessonDetailScreen} 
        options={({ route }) => ({ title: route.params.lessonTitle, headerLargeTitle: false })} 
      />

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

// --- GroupStack (থিম কালার ব্যবহার করে আপডেট) ---
function GroupStack() {
    return (
        <Stack.Navigator 
            screenOptions={{ 
                headerLargeTitle: true,
                headerTintColor: COLORS.accent,
                headerStyle: { backgroundColor: COLORS.background },
            }}
        >
            <Stack.Screen name="GroupListMain" component={GroupListScreen} options={{ title: 'Groups' }} />
            <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={({ route }) => ({ title: route.params.groupTitle })} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Create New Group' }} />
            <Stack.Screen name="GroupJoin" component={GroupJoinScreen} options={{ title: 'Join Group' }} /> 
        </Stack.Navigator>
    );
}
// ----------------------------

// --- HomeTabs (থিম কালার ব্যবহার করে আপডেট) ---
function HomeTabs() {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerLargeTitle: true,
        headerTintColor: COLORS.accent, // হেডার টেক্সট কালার
        headerStyle: { backgroundColor: COLORS.background }, // হেডার ব্যাকগ্রাউন্ড
        tabBarActiveTintColor: COLORS.primary, // Coral
        tabBarInactiveTintColor: COLORS.textLight, // Gray
        tabBarStyle: { backgroundColor: COLORS.background, borderTopColor: COLORS.border }, // ট্যাব বার স্টাইল
        tabBarIcon: ({ focused, color, size }) => { 
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'GroupsTab') { 
            iconName = focused ? 'people' : 'people-outline';
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
        name="GroupsTab"
        component={GroupStack}
        options={{ title: 'Groups', headerShown: false }} 
      />
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

// --- AuthStack (অপরিবর্তিত) ---
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} /> 
    </Stack.Navigator>
  );
}
// -----------------------------

// --- AppNavigator (অপরিবর্তিত) ---
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