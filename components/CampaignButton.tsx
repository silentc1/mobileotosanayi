import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  ViewStyle,
  FlatList,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export interface Campaign {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  images: string[];
  terms: string;
  features: string[];
  stockCount: number;
  dealerLocations: string[];
  remainingDays?: number;
  formattedStartDate?: string;
  formattedEndDate?: string;
  savingsAmount?: number;
}

interface CampaignButtonProps {
  campaign: Campaign;
  style?: ViewStyle;
  onClose?: () => void;
}

export default function CampaignButton({ campaign, style, onClose }: CampaignButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleClose = () => {
    setIsModalVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      {!onClose ? (
        <TouchableOpacity
          style={[styles.campaignButton, style]}
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.9}
        >
          <View style={styles.buttonContent}>
            <FontAwesome name="tag" size={20} color="#FFFFFF" />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonText} numberOfLines={1}>
                {campaign.vehicleYear} {campaign.vehicleBrand} {campaign.vehicleModel}
              </Text>
              <Text style={styles.remainingDays}>
                {campaign.remainingDays} gün kaldı
              </Text>
            </View>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>%{campaign.discountPercentage}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <FontAwesome name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Kampanya Detayları</Text>
              <View style={styles.closeButton} />
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Image Slider */}
              <View style={styles.imageSliderContainer}>
                <FlatList
                  data={campaign.images}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const newIndex = Math.round(
                      e.nativeEvent.contentOffset.x / width
                    );
                    setCurrentImageIndex(newIndex);
                  }}
                  renderItem={({ item }) => (
                    <Image
                      source={{ uri: item }}
                      style={styles.campaignImage}
                      resizeMode="cover"
                    />
                  )}
                  keyExtractor={(_, index) => index.toString()}
                />
                <View style={styles.paginationDots}>
                  {campaign.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === currentImageIndex && styles.activeDot,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.contentContainer}>
                {/* Vehicle Info */}
                <View style={styles.vehicleInfo}>
                  <Text style={styles.title}>
                    {campaign.vehicleYear} {campaign.vehicleBrand} {campaign.vehicleModel}
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.originalPrice}>
                      {formatPrice(campaign.originalPrice)}
                    </Text>
                    <Text style={styles.discountedPrice}>
                      {formatPrice(campaign.discountedPrice)}
                    </Text>
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>
                        {formatPrice(campaign.savingsAmount || 0)} tasarruf
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Campaign Details */}
                <Text style={styles.description}>{campaign.description}</Text>

                {/* Features */}
                <View style={styles.featuresContainer}>
                  <Text style={styles.sectionTitle}>Kampanya Özellikleri</Text>
                  {campaign.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <FontAwesome name="check-circle" size={16} color="#4CAF50" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Dealer Locations */}
                <View style={styles.dealersContainer}>
                  <Text style={styles.sectionTitle}>Yetkili Bayiler</Text>
                  {campaign.dealerLocations.map((dealer, index) => (
                    <View key={index} style={styles.dealerItem}>
                      <FontAwesome name="map-marker" size={16} color="#1976D2" />
                      <Text style={styles.dealerText}>{dealer}</Text>
                    </View>
                  ))}
                </View>

                {/* Stock Info */}
                <View style={styles.stockContainer}>
                  <FontAwesome name="info-circle" size={16} color="#FF9800" />
                  <Text style={styles.stockText}>
                    Stokta {campaign.stockCount} adet kaldı
                  </Text>
                </View>

                {/* Terms */}
                <View style={styles.termsContainer}>
                  <Text style={styles.termsTitle}>Kampanya Koşulları</Text>
                  <Text style={styles.termsText}>{campaign.terms}</Text>
                </View>

                {/* Campaign Dates */}
                <View style={styles.footer}>
                  <View style={styles.dateContainer}>
                    <FontAwesome name="calendar" size={14} color="#666" />
                    <Text style={styles.dateText}>
                      {campaign.formattedStartDate} - {campaign.formattedEndDate}
                    </Text>
                  </View>
                  <Text style={styles.remainingDaysLarge}>
                    {campaign.remainingDays} gün kaldı
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  campaignButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    minWidth: 280,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  remainingDays: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  discountBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: '90%',
  },
  imageSliderContainer: {
    height: 250,
    position: 'relative',
  },
  campaignImage: {
    width: width,
    height: 250,
    backgroundColor: '#F0F0F0',
  },
  paginationDots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 16,
  },
  vehicleInfo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  priceContainer: {
    marginTop: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#666666',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 4,
  },
  savingsBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  savingsText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  dealersContainer: {
    marginBottom: 16,
  },
  dealerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dealerText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 8,
  },
  termsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  termsText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666666',
  },
  remainingDaysLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 8,
  },
}); 