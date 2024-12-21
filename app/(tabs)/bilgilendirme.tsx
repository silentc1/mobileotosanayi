import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';

const { width } = Dimensions.get('window');
const cardWidth = width - 32;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not defined in environment variables');
}

// Initialize Gemini API with optimized settings
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Optimized generation config for faster responses
const generationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 20,
  maxOutputTokens: 4096,
};

// Initialize model with caching
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generationConfig,
});

// Chat message type
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

// Common questions for quick access
const QUICK_QUESTIONS = [
  'Motor yağı değişimi ne zaman yapılmalı?',
  'Lastik basıncı nasıl kontrol edilir?',
  'Akü bakımı nasıl yapılır?',
  'Fren sistemi kontrolleri nelerdir?',
  'Araç kliması nasıl verimli kullanılır?',
  'Yakıt tasarrufu için öneriler nelerdir?',
];

export default function BilgilendirmeScreen() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const chatSessionRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize chat session on mount
  useEffect(() => {
    try {
      chatSessionRef.current = model.startChat({
        history: [],
        generationConfig,
      });
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      console.error('Chat başlatılırken hata:', errorMessage);
      setError(errorMessage);
    }
  }, []);

  // Optimized message handling
  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    if (!GEMINI_API_KEY) {
      Alert.alert('Hata', 'API anahtarı bulunamadı. Lütfen daha sonra tekrar deneyin.');
      return;
    }

    try {
      setIsLoading(true);
      addMessage('user', input);
      setInput('');

      const prompt = `Sen bir deneyimli araç ustasısın. Otosanayicim uygulaması için kullanıcının "${input}" sorusuna kısa ve öz bilgiler ver. Türkçe yanıtla. En önemli 3-4 maddeyi belirt. Önerilerin için işletmeler sayfasındaki usta işletmelere yönlendir`;
      
      const result = await chatSessionRef.current.sendMessage(prompt);
      const response = await result.response;
      
      addMessage('assistant', response.text());
      setError(null);
    } catch (error) {
      console.error('Gemini API Error:', error);
      setError('Yanıt alınamadı. Lütfen tekrar deneyin.');
      Alert.alert('Hata', 'Yanıt alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, addMessage]);

  const handleQuickQuestion = useCallback((question: string) => {
    setInput(question);
    handleSend();
  }, [handleSend]);

  const MessageBubble = useCallback(({ message }: { message: ChatMessage }) => (
    <View style={[
      styles.messageBubble,
      message.role === 'user' ? styles.userBubble : styles.assistantBubble
    ]}>
      <View style={[
        styles.avatarContainer,
        { backgroundColor: message.role === 'user' ? '#007AFF' : '#34C759' }
      ]}>
        <FontAwesome
          name={message.role === 'user' ? 'user' : 'wrench'}
          size={12}
          color="white"
        />
      </View>
      <View style={styles.messageContent}>
        <Text style={[
          styles.messageText,
          message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
        ]}>
          {message.content}
        </Text>
        <Text style={styles.timestampText}>
          {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  ), []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={48} color="#ff3b30" />
        <Text style={styles.errorTitle}>Bir Hata Oluştu</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => {
            setError(null);
            chatSessionRef.current = model.startChat({
              history: [],
              generationConfig,
            });
          }}
        >
          <FontAwesome name="refresh" size={16} color="#FFFFFF" style={styles.retryIcon} />
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ustaya Sor</Text>
          <Text style={styles.headerSubtitle}>Aracınızla ilgili tüm sorularınızı yanıtlayalım</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { flexGrow: 1, justifyContent: messages.length === 0 ? 'flex-start' : 'flex-end' }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {messages.length === 0 ? (
            <View style={styles.quickQuestionsContainer}>
              <View style={styles.welcomeContainer}>
                <FontAwesome name="comments" size={48} color="#007AFF" />
                <Text style={styles.welcomeTitle}>Ustaya Sorun</Text>
                <Text style={styles.welcomeText}>
                  Aracınızla ilgili her türlü sorunuzu deneyimli ustamıza sorabilirsiniz.
                </Text>
              </View>
              <Text style={styles.quickQuestionsTitle}>Sık Sorulan Sorular:</Text>
              {QUICK_QUESTIONS.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion(question)}
                >
                  <FontAwesome name="question-circle" size={16} color="#007AFF" />
                  <Text style={styles.quickQuestionText}>{question}</Text>
                  <FontAwesome name="chevron-right" size={12} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Yanıt hazırlanıyor...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={(text) => {
              setInput(text);
              // Klavye açıldığında otomatik scroll
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
            placeholder="Sorunuzu yazın..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <FontAwesome name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 4,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  quickQuestionsContainer: {
    flex: 1,
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  quickQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickQuestionText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    marginLeft: 12,
    marginRight: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageContent: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#1A1A1A',
  },
  assistantMessageText: {
    color: '#333333',
  },
  timestampText: {
    fontSize: 11,
    color: '#999999',
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    marginBottom: 0,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    color: '#333333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 