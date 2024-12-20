import { useCallback, useEffect, memo } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Memoize AuthGuard for better performance
const AuthGuard = memo(({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const handleNavigation = useCallback(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading, router]);

  useEffect(() => {
    handleNavigation();
  }, [handleNavigation]);

  if (isLoading) {
    return <View style={{ flex: 1 }} />;
  }

  return <>{children}</>;
});

AuthGuard.displayName = 'AuthGuard';

// Separate the layout content to use hooks after AuthProvider
const LayoutContent = () => {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Hide splash screen once loading is complete
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <AuthGuard>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade',
          animationDuration: 200 
        }}
      >
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            headerShown: false,
            gestureEnabled: false 
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            gestureEnabled: false 
          }} 
        />
      </Stack>
    </AuthGuard>
  );
};

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#f8f9fa" />
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>
    </>
  );
}
