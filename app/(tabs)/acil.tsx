import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

type EmergencyService = {
  id: string;
  title: string;
  icon: string;
  color: string;
  phone?: string;
  action?: () => void;
};

const EMERGENCY_SERVICES: EmergencyService[] = [
  {
    id: '1',
    title: 'Lastikçi Çağır',
    icon: 'car',
    color: '#FF9500',
    phone: '05001234567',
  },
  {
    id: '2',
    title: 'Elektrikçi Çağır',
    icon: 'bolt',
    color: '#007AFF',
    phone: '05001234568',
  },
  {
    id: '3',
    title: 'Çekici Çağır',
    icon: 'truck',
    color: '#FF3B30',
    phone: '05001234569',
  },
  {
    id: '4',
    title: 'Yol Yardım',
    icon: 'wrench',
    color: '#34C759',
    phone: '05001234570',
  },
  {
    id: '5',
    title: 'Acil Servis',
    icon: 'ambulance',
    color: '#FF2D55',
    phone: '112',
  },
];

export default function EmergencyScreen() {
  const handleCall = (service: EmergencyService) => {
    if (!service.phone) return;

    const phoneNumber = Platform.select({
      ios: `telprompt:${service.phone}`,
      android: `tel:${service.phone}`,
    });

    Alert.alert(
      service.title,
      `${service.phone} numaralı telefonu aramak istiyor musunuz?`,
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Ara',
          onPress: () => {
            if (phoneNumber) {
              Linking.openURL(phoneNumber).catch((err) =>
                Alert.alert('Hata', 'Arama yapılamadı.')
              );
            }
          },
        },
      ]
    );
  };

  const renderEmergencyButton = (service: EmergencyService) => (
    <TouchableOpacity
      key={service.id}
      style={styles.serviceButton}
      onPress={() => handleCall(service)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: service.color }]}>
        <FontAwesome name={service.icon} size={32} color="white" />
      </View>
      <Text style={styles.serviceTitle}>{service.title}</Text>
      <View style={styles.callButton}>
        <FontAwesome name="phone" size={16} color={service.color} />
        <Text style={[styles.callButtonText, { color: service.color }]}>Ara</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Acil Yardım</Text>
        <Text style={styles.headerSubtitle}>
          Size en yakın yardım ekibini yönlendirelim
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.servicesGrid}>
          {EMERGENCY_SERVICES.map(renderEmergencyButton)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 16,
  },
  servicesGrid: {
    gap: 16,
  },
  serviceButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 