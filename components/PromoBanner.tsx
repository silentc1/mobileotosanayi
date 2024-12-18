import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function PromoBanner() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <FontAwesome name="tag" size={12} color="#fff" style={styles.icon} />
        <Text style={styles.text}>
          Kayıt olan herkese tüm servislerde %10 indirim kuponu
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#007AFF',
    width: '100%',
    paddingVertical: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
}); 