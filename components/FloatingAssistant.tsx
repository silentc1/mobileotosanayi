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
  Modal,
  Animated,
  PanResponder,
  Keyboard,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = 60;
const EXPANDED_HEIGHT = height * 0.7;

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

const QUICK_QUESTIONS = [
  'Motor yağı değişimi ne zaman yapılmalı?',
  'Lastik basıncı nasıl kontrol edilir?',
  'Akü bakımı nasıl yapılır?',
  'Fren sistemi kontrolleri nelerdir?',
  'Araç kliması nasıl verimli kullanılır?',
  'Yakıt tasarrufu için öneriler nelerdir?',
];

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const generationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 20,
  maxOutputTokens: 4096,
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generationConfig,
});

export default function FloatingAssistant() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const chatSessionRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [position] = useState(new Animated.ValueXY({ x: width - BUTTON_SIZE - 20, y: height - BUTTON_SIZE - 100 }));
  const [isDragging, setIsDragging] = useState(false);

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

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        position.setValue({
          x: Math.max(0, Math.min(width - BUTTON_SIZE, position.x._value + gestureState.dx)),
          y: Math.max(0, Math.min(height - BUTTON_SIZE, position.y._value + gestureState.dy)),
        });
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        const snapToEdge = () => {
          const targetX = position.x._value > width / 2 ? width - BUTTON_SIZE - 20 : 20;
          Animated.spring(position.x, {
            toValue: targetX,
            useNativeDriver: false,
          }).start();
        };
        snapToEdge();
      },
    })
  ).current;

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

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

  const renderFloatingButton = () => (
    <Animated.View
      style={[
        styles.floatingButton,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onPress={() => !isDragging && setIsExpanded(true)}
        style={styles.buttonContent}
      >
        <FontAwesome name="comments" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderExpandedView = () => (
    <Modal
      visible={isExpanded}
      transparent
      animationType="slide"
      onRequestClose={() => setIsExpanded(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.expandedContainer, { marginBottom: keyboardHeight }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ustaya Sor</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsExpanded(false)}
            >
              <FontAwesome name="times" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <FontAwesome name="comments" size={48} color="#007AFF" />
                <Text style={styles.welcomeTitle}>Ustaya Sorun</Text>
                <Text style={styles.welcomeText}>
                  Aracınızla ilgili her türlü sorunuzu deneyimli ustamıza sorabilirsiniz.
                </Text>
                <View style={styles.quickQuestionsContainer}>
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
              onChangeText={setInput}
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <>
      {renderFloatingButton()}
      {renderExpandedView()}
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#007AFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  expandedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: EXPANDED_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 8,
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
    padding: 24,
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
    width: '100%',
    marginTop: 24,
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
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
}); 