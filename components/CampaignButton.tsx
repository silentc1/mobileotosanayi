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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export interface Campaign {
  _id: string;
  title: string;
  description: string;
  image: string;
  business: string;
  brands: string[];
  discount: string;
  validUntil: string;
}

interface CampaignButtonProps {
  campaign: Campaign;
}

export default function CampaignButton({ campaign }: CampaignButtonProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const formattedDate = new Date(campaign.validUntil).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.9}
      >
        <View style={styles.buttonContent}>
          <FontAwesome name="tag" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Kampanya</Text>
        </View>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{campaign.discount}</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <FontAwesome name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Kampanya Detayları</Text>
              <View style={styles.closeButton} />
            </View>

            <ScrollView style={styles.modalScroll}>
              <Image
                source={{ uri: campaign.image }}
                style={styles.campaignImage}
                resizeMode="cover"
              />

              <View style={styles.contentContainer}>
                <View style={styles.headerContainer}>
                  <View style={styles.businessBadge}>
                    <FontAwesome name="building" size={14} color="#1976d2" style={styles.businessIcon} />
                    <Text style={styles.businessText}>{campaign.business}</Text>
                  </View>
                  <View style={styles.discountBadgeLarge}>
                    <FontAwesome name="tag" size={14} color="#FFFFFF" style={styles.discountIcon} />
                    <Text style={styles.discountTextLarge}>{campaign.discount}</Text>
                  </View>
                </View>

                <Text style={styles.title}>{campaign.title}</Text>
                <Text style={styles.description}>{campaign.description}</Text>

                <View style={styles.brandsContainer}>
                  {campaign.brands.map((brand, index) => (
                    <View key={index} style={styles.brandBadge}>
                      <FontAwesome name="check" size={12} color="#666" style={styles.brandIcon} />
                      <Text style={styles.brandText}>{brand}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.footer}>
                  <View style={styles.dateContainer}>
                    <FontAwesome name="calendar" size={14} color="#666" style={styles.dateIcon} />
                    <Text style={styles.dateText}>Son Geçerlilik: {formattedDate}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    right: 20,
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
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  discountBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
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
  campaignImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F0F0F0',
  },
  contentContainer: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  businessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  businessIcon: {
    marginRight: 6,
  },
  businessText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  discountBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountIcon: {
    marginRight: 6,
  },
  discountTextLarge: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 16,
  },
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  brandIcon: {
    marginRight: 4,
  },
  brandText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 6,
  },
  dateText: {
    color: '#666666',
    fontSize: 14,
  },
}); 