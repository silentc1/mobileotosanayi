import React from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Text,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import PromoBanner from './PromoBanner';

export default function Header() {
  const router = useRouter();
  const { user } = useAuth();

  const handleAuthPress = () => {
    if (user) {
      router.push('/profile');
    } else {
      router.push('/login');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <PromoBanner />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ara..."
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity
          style={styles.authButton}
          onPress={handleAuthPress}
          activeOpacity={0.7}
        >
          {user ? (
            <View style={styles.userContainer}>
              <Text style={styles.userName}>{user.fullName.split(' ')[0]}</Text>
              <FontAwesome name="user-circle" size={24} color="#007AFF" />
            </View>
          ) : (
            <View style={styles.userContainer}>
              <Text style={styles.loginText}>Giriş Yap</Text>
              <FontAwesome name="user-circle-o" size={24} color="#666" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: Platform.select({
      ios: 0,
      android: 6,
    }),
  },
  authButton: {
    padding: 4,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  loginText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
}); 