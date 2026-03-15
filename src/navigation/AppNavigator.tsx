import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight } from '../theme';

// Screens
import { SplashScreen } from '../screens/auth/SplashScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { MyListScreen } from '../screens/mylist/MyListScreen';

import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { VideoDetailScreen } from '../screens/detail/VideoDetailScreen';
import { VideoPlayerScreen } from '../screens/player/VideoPlayerScreen';
import { CoordinatorProfileScreen } from '../screens/profiles/CoordinatorProfileScreen';
import { PerformerProfileScreen } from '../screens/profiles/PerformerProfileScreen';
import { ProductionPageScreen } from '../screens/profiles/ProductionPageScreen';
import { TrainingPathDetailScreen } from '../screens/training/TrainingPathDetailScreen';
import { CollectionDetailScreen } from '../screens/collections/CollectionDetailScreen';
import { BookmarksScreen } from '../screens/bookmarks/BookmarksScreen';
import { ReviewModalScreen } from '../screens/community/ReviewModalScreen';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { CategoryVideosScreen } from '../screens/category/CategoryVideosScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          switch (route.name) {
            case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
            case 'Search': iconName = focused ? 'search' : 'search-outline'; break;
            case 'MyList': iconName = focused ? 'bookmark' : 'bookmark-outline'; break;

            case 'Profile': iconName = focused ? 'person' : 'person-outline'; break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
          height: 85,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: FontWeight.medium,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="MyList" component={MyListScreen} options={{ tabBarLabel: 'My List' }} />
      <Tab.Screen name="Profile" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: Colors.primary,
          background: Colors.background,
          card: Colors.surface,
          text: Colors.textPrimary,
          border: Colors.border,
          notification: Colors.primary,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="VideoDetail" component={VideoDetailScreen} />
        <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ animation: 'fade', orientation: 'all' }} />
        <Stack.Screen name="CoordinatorProfile" component={CoordinatorProfileScreen} />
        <Stack.Screen name="PerformerProfile" component={PerformerProfileScreen} />
        <Stack.Screen name="ProductionPage" component={ProductionPageScreen} />
        <Stack.Screen name="TrainingPathDetail" component={TrainingPathDetailScreen} />
        <Stack.Screen name="CollectionDetail" component={CollectionDetailScreen} />
        <Stack.Screen name="AllBookmarks" component={BookmarksScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="CategoryVideos" component={CategoryVideosScreen} />
        <Stack.Screen
          name="ReviewModal"
          component={ReviewModalScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
