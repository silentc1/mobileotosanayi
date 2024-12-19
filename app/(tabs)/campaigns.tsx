import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Campaign } from '../../models/Campaign';
import { apiService } from '../../services/api';

const { width } = Dimensions.get('window');
const cardWidth = width - 32;

export default function CampaignsScreen() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCampaigns();
      if (response && response.campaigns) {
        setCampaigns(response.campaigns);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error loading campaigns:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCampaigns();
  };

  const renderCampaign = ({ item }: { item: Campaign }) => {
    const validUntilDate = new Date(item.validUntil);
    const formattedDate = validUntilDate.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <View style={styles.card}>
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.contentContainer}>
          <View style={styles.businessBadge}>
            <Text style={styles.businessText}>{item.business}</Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.brandsContainer}>
            {item.brands.map((brand, index) => (
              <View key={index} style={styles.brandBadge}>
                <Text style={styles.brandText}>{brand}</Text>
              </View>
            ))}
          </View>
          <View style={styles.footer}>
            <View style={styles.dateContainer}>
              <FontAwesome name="calendar" size={14} color="#666" />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{item.discount}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCampaigns}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kampanyalar</Text>
      </View>
      <FlatList
        data={campaigns}
        renderItem={renderCampaign}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  contentContainer: {
    padding: 16,
  },
  businessBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  businessText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12,
  },
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  brandBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: '#666',
    fontSize: 14,
  },
  discountBadge: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 