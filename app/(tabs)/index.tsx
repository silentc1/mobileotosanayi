import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FeatureCardProps {
  icon: keyof typeof FontAwesome.glyphMap;
  title: string;
  description: string;
}

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Otosanayicim</Text>
          <Text style={styles.heroSubtitle}>Cebinizdeki Oto Sanayici</Text>
          <TouchableOpacity 
            style={styles.heroButton}
            onPress={() => router.push('/isletmeler')}
          >
            <Text style={styles.heroButtonText}>İşletmeleri Keşfet</Text>
            <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <FeatureCard
            icon="search"
            title="İşletme Bul"
            description="Size en yakın ve en uygun oto sanayi işletmelerini bulun"
          />
          <FeatureCard
            icon="star"
            title="Değerlendir"
            description="Deneyiminizi paylaşın ve diğer kullanıcılara yardımcı olun"
          />
          <FeatureCard
            icon="map-marker"
            title="Kolay Erişim"
            description="Yol tarifi alın ve hızlıca işletmelere ulaşın"
          />
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Hemen Başlayın</Text>
          <Text style={styles.ctaText}>
            Binlerce işletme ve ustaya tek tıkla ulaşın
          </Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => router.push('/isletmeler')}
          >
            <Text style={styles.ctaButtonText}>İşletmeleri Görüntüle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconContainer}>
        <FontAwesome name={icon} size={24} color="#007AFF" />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuresSection: {
    padding: 24,
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    alignItems: 'center',
    gap: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaSection: {
    padding: 24,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    marginHorizontal: 24,
    borderRadius: 24,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
