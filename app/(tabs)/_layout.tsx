import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#E8E8E8',
          },
          android: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#E8E8E8',
            elevation: 8,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: '/',
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="acil"
        options={{
          href: '/acil',
          title: 'Acil',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="exclamation-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          href: '/campaigns',
          title: 'Kampanyalar',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="gift" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bilgilendirme"
        options={{
          href: '/bilgilendirme',
          title: 'Bilgi',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="info-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
