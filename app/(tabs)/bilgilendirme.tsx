import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type Article = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
};

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Araç Bakımı',
    description: 'Düzenli araç bakımı nasıl yapılır? Nelere dikkat edilmeli?',
    icon: 'wrench',
    color: '#007AFF',
  },
  {
    id: '2',
    title: 'Lastik Bakımı',
    description: 'Lastik basıncı ve diş derinliği kontrolü nasıl yapılır?',
    icon: 'car',
    color: '#FF9500',
  },
  {
    id: '3',
    title: 'Akü Bakımı',
    description: 'Akü ömrünü uzatmak için ipuçları ve bakım önerileri',
    icon: 'battery-full',
    color: '#34C759',
  },
  {
    id: '4',
    title: 'Kış Bakımı',
    description: 'Kış mevsiminde araç bakımı için önemli noktalar',
    icon: 'snowflake-o',
    color: '#5856D6',
  },
];

const FAQS: FAQ[] = [
  {
    id: '1',
    question: 'Aracımın yağ değişimi ne sıklıkla yapılmalı?',
    answer: 'Genel olarak her 10.000 km\'de bir veya yılda bir kez yağ değişimi önerilir. Ancak bu süre araç modeli ve kullanım koşullarına göre değişebilir.',
  },
  {
    id: '2',
    question: 'Lastik basıncı ne sıklıkla kontrol edilmeli?',
    answer: 'Lastik basıncı ayda bir kez veya uzun yolculuk öncesinde kontrol edilmelidir. Doğru lastik basıncı yakıt tüketimini ve yol tutuşunu etkiler.',
  },
  {
    id: '3',
    question: 'Akü ne kadar sürede değiştirilmeli?',
    answer: 'Akü ortalama 3-5 yıl ömre sahiptir. Ancak kullanım koşulları ve iklim şartlarına göre bu süre değişebilir.',
  },
  {
    id: '4',
    question: 'Fren bakımı ne zaman yapılmalı?',
    answer: 'Fren balataları her 20.000-25.000 km\'de kontrol edilmelidir. Fren diski ve balatalarının durumuna göre değişim yapılmalıdır.',
  },
];

export default function BilgilendirmeScreen() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const renderArticle = (article: Article) => (
    <TouchableOpacity
      key={article.id}
      style={styles.articleCard}
      activeOpacity={0.7}
    >
      <View style={[styles.articleIcon, { backgroundColor: article.color }]}>
        <FontAwesome name={article.icon} size={24} color="white" />
      </View>
      <View style={styles.articleContent}>
        <Text style={styles.articleTitle}>{article.title}</Text>
        <Text style={styles.articleDescription}>{article.description}</Text>
        <View style={styles.readMore}>
          <Text style={[styles.readMoreText, { color: article.color }]}>
            Devamını Oku
          </Text>
          <FontAwesome name="chevron-right" size={12} color={article.color} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFaq = (faq: FAQ) => {
    const isExpanded = expandedFaq === faq.id;
    return (
      <TouchableOpacity
        key={faq.id}
        style={[styles.faqItem, isExpanded && styles.faqItemExpanded]}
        onPress={() => toggleFaq(faq.id)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{faq.question}</Text>
          <FontAwesome
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#666"
          />
        </View>
        {isExpanded && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bilgilendirme</Text>
        <Text style={styles.headerSubtitle}>
          Faydalı bilgiler ve sık sorulan sorular
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Faydalı Bilgiler</Text>
        <View style={styles.articlesGrid}>
          {ARTICLES.map(renderArticle)}
        </View>

        <Text style={styles.sectionTitle}>Sık Sorulan Sorular</Text>
        <View style={styles.faqList}>{FAQS.map(renderFaq)}</View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    marginTop: 24,
  },
  articlesGrid: {
    gap: 16,
  },
  articleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  articleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  articleContent: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  articleDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  faqList: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  faqItemExpanded: {
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 16,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    lineHeight: 20,
  },
}); 