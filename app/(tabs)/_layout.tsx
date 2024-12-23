import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const tabBarHeight = Platform.OS === 'ios' ? 95 : 75;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderWidth: 0,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? 25 : 12,
          paddingTop: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: 'transparent',
          shadowOffset: {
            width: 0,
            height: 0,
          },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        tabBarActiveTintColor: '#4A55A2',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 48,
              height: 36,
              backgroundColor: focused ? `${color}15` : 'transparent',
              borderRadius: 12,
            }}>
              <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="isletmeler"
        options={{
          title: 'İşletmeler',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 48,
              height: 36,
              backgroundColor: focused ? `${color}15` : 'transparent',
              borderRadius: 12,
            }}>
              <Ionicons name={focused ? "business" : "business-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="acil"
        options={{
          title: 'Acil',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 48,
              height: 36,
              backgroundColor: focused ? '#FF3B3015' : 'transparent',
              borderRadius: 12,
            }}>
              <Ionicons 
                name={focused ? "warning" : "warning-outline"} 
                size={26} 
                color={focused ? "#FF3B30" : "#94A3B8"} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="kampanyalar"
        options={{
          title: 'Kampanyalar',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 48,
              height: 36,
              backgroundColor: focused ? `${color}15` : 'transparent',
              borderRadius: 12,
            }}>
              <Ionicons name={focused ? "pricetag" : "pricetag-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profilim"
        options={{
          title: 'Profilim',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 48,
              height: 36,
              backgroundColor: focused ? `${color}15` : 'transparent',
              borderRadius: 12,
            }}>
              <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
