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
import { getFaultDetectionResponse } from './assistants/FaultDetectionAssistant';
import { getMechanicResponse } from './assistants/MechanicAssistant';
import { getPriceResponse } from './assistants/PriceAssistant';

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = 60;
const EXPANDED_HEIGHT = height * 0.7;

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

const ASSISTANT_EXAMPLES = {
  fault: {
    title: 'Arıza Tespit Asistanı',
    description: 'Aracınızdaki sorunları yapay zeka ile tespit edin',
    examples: [
      'Motor çalışırken tıkırtı sesi geliyor',
      'Aracım rölantide titriyor',
      'Fren pedalı sertleşti',
      'Direksiyonda ses var',
      'Motor hararet yapıyor'
    ]
  },
  mechanic: {
    title: 'Cep Ustam',
    description: 'Deneyimli ustalarımıza sorularınızı sorun',
    examples: [
      'Yağ değişimi ne zaman yapılmalı?',
      'Balata değişimi nasıl anlaşılır?',
      'Akü bakımı nasıl yapılır?',
      'Lastik basıncı kaç olmalı?',
      'Triger kayışı ne zaman değişmeli?'
    ]
  },
  price: {
    title: 'Fiyat Asistanı',
    description: 'Araç bakım ve onarım fiyatlarını öğrenin',
    examples: [
      'Yağ bakımı fiyatı nedir?',
      'Balata değişimi ne kadar?',
      'Triger seti değişimi fiyatı',
      'Debriyaj değişimi maliyeti',
      'Akü değişimi fiyatı'
    ]
  }
};

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
  const [activeAssistant, setActiveAssistant] = useState<'fault' | 'mechanic' | 'price' | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const resetChat = useCallback(() => {
    setMessages([]);
    setInput('');
    setActiveAssistant(null);
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
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

    try {
      setIsLoading(true);
      addMessage('user', input);
      setInput('');

      let response: string;
      switch (activeAssistant) {
        case 'fault':
          response = await getFaultDetectionResponse(input);
          break;
        case 'mechanic':
          response = await getMechanicResponse(input);
          break;
        case 'price':
          response = await getPriceResponse(input);
          break;
        default:
          throw new Error('Geçersiz asistan türü');
      }
      
      addMessage('assistant', response);
      setError(null);
    } catch (error) {
      console.error('Assistant Error:', error);
      setError('Yanıt alınamadı. Lütfen tekrar deneyin.');
      Alert.alert('Hata', 'Yanıt alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, addMessage, activeAssistant]);

  const handleAssistantSelect = useCallback((type: 'fault' | 'mechanic' | 'price') => {
    setActiveAssistant(type);
    const assistant = ASSISTANT_EXAMPLES[type];
    
    const message = [
      `Merhaba, ben ${assistant.title}! 👋`,
      '',
      assistant.description,
      '',
      'İşte size yardımcı olabileceğim bazı örnek konular:',
      '',
      ...assistant.examples.map(example => `• ${example}`),
      '',
      'Yukarıdaki örnekler gibi sorularınızı yazabilir veya kendi sorunuzu sorabilirsiniz.'
    ].join('\n');

    addMessage('assistant', message);
  }, [addMessage]);

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
            { translateY: position.y },
            { scale: pulseAnim }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onPress={() => !isDragging && setIsExpanded(true)}
        style={styles.buttonContent}
      >
        <View style={styles.buttonInner}>
          <FontAwesome name="car" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Bilge Asistan</Text>
        </View>
        <View style={styles.notificationDot}>
          <FontAwesome name="wrench" size={10} color="#FFFFFF" />
        </View>
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
            <View style={styles.headerLeft}>
              {messages.length > 0 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={resetChat}
                >
                  <FontAwesome name="chevron-left" size={20} color="#007AFF" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>
                {messages.length === 0 ? 'Akıllı Asistan' : 'Sohbet'}
              </Text>
            </View>
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
                <Text style={styles.welcomeTitle}>Size Nasıl Yardımcı Olabilirim?</Text>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleAssistantSelect('fault')}
                  >
                    <View style={styles.optionIconContainer}>
                      <FontAwesome name="search" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>Arıza Tespit</Text>
                      <Text style={styles.optionDescription}>Aracınızdaki sorunları adım adım tespit edin</Text>
                    </View>
                    <FontAwesome name="chevron-right" size={16} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleAssistantSelect('mechanic')}
                  >
                    <View style={[styles.optionIconContainer, { backgroundColor: '#34C759' }]}>
                      <FontAwesome name="wrench" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>Cep Ustam</Text>
                      <Text style={styles.optionDescription}>Aracınızla ilgili merak ettiklerinizi sorun</Text>
                    </View>
                    <FontAwesome name="chevron-right" size={16} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleAssistantSelect('price')}
                  >
                    <View style={[styles.optionIconContainer, { backgroundColor: '#FF9500' }]}>
                      <FontAwesome name="tag" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>Fiyat Al</Text>
                      <Text style={styles.optionDescription}>Araç bakım ve onarım fiyatlarını öğrenin</Text>
                    </View>
                    <FontAwesome name="chevron-right" size={16} color="#666" />
                  </TouchableOpacity>
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

          {messages.length > 0 && (
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
          )}
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
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
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
    lineHeight: 22,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#1A1A1A',
  },
  assistantMessageText: {
    color: '#333333',
    textAlign: 'left',
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
  optionsContainer: {
    width: '100%',
    marginTop: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  bulletPoint: {
    marginLeft: 8,
    marginBottom: 4,
  },
}); 