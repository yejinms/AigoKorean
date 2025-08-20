import { useEffect, useState, useRef } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  TextInput, 
  Alert,
  Modal,
  Animated 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import content from '@/data/content.json';

type ScenarioData = {
  title: string;
  description: string;
  imageURL: string;
  difficulty: 1 | 2 | 3;
  sampleMessages: string[];
  keyExpressions: string[];
};

type Item = {
  id: number;
  category: string;
  koreanWord: string;
  vietnameseWord: string;
  difficulty?: 1 | 2 | 3;
  exampleKo: string;
  exampleVi: string;
  audioURL: string;
  audioWordKoURL?: string;
  audioExampleKoURL?: string;
  relatedTerms: any[];
  vietnameseSentence?: string;
  koreanOptions?: string[];
  correctAnswer?: number;
  explanation?: string;
  usage?: string;
  scenarioData?: ScenarioData;
};

export default function MessageWritingScreen() {
  const items = (content as Item[]).filter(item => item.scenarioData);
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [feedbackLanguage, setFeedbackLanguage] = useState<'ko' | 'vi'>('ko');
  const [showHint, setShowHint] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // 애니메이션을 위한 ref들
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const item = items[index];

  useEffect(() => {
    loadDailyUsage();
    checkPremiumStatus();
  }, []);

  const loadDailyUsage = async () => {
    try {
      const today = new Date().toDateString();
      const savedUsage = await AsyncStorage.getItem(`dailyUsage_${today}`);
      if (savedUsage) {
        setDailyUsage(parseInt(savedUsage));
      }
    } catch (error) {
      console.error('일일 사용량 로드 실패:', error);
    }
  };

  const checkPremiumStatus = async () => {
    try {
      const premiumStatus = await AsyncStorage.getItem('isPremium');
      setIsPremium(premiumStatus === 'true');
    } catch (error) {
      console.error('프리미엄 상태 확인 실패:', error);
    }
  };

  const saveDailyUsage = async () => {
    try {
      const today = new Date().toDateString();
      const newUsage = dailyUsage + 1;
      await AsyncStorage.setItem(`dailyUsage_${today}`, newUsage.toString());
      setDailyUsage(newUsage);
    } catch (error) {
      console.error('일일 사용량 저장 실패:', error);
    }
  };

  const saveLearningRecord = async (originalMessage: string, correctedMessage: string) => {
    try {
      const savedRecords = await AsyncStorage.getItem('messageLearningRecords');
      let records = savedRecords ? JSON.parse(savedRecords) : [];
      
      records.push({
        id: Date.now(),
        scenarioId: item?.id,
        originalMessage,
        correctedMessage,
        timestamp: new Date().toISOString(),
        category: item?.category || '기타'
      });
      
      await AsyncStorage.setItem('messageLearningRecords', JSON.stringify(records));
    } catch (error) {
      console.error('학습 기록 저장 실패:', error);
    }
  };

  const requestAICorrection = async () => {
    if (!message.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tin nhắn.');
      return;
    }

    if (!isPremium && dailyUsage >= 3) {
      setShowPremiumModal(true);
      return;
    }

    // 하드코딩된 AI 교정 (MVP 단계)
    const correctedMessage = getMockAICorrection(message);
    
    if (!isPremium) {
      await saveDailyUsage();
    }
    
    await saveLearningRecord(message, correctedMessage);
    setShowFeedback(true);
  };

  const getMockAICorrection = (originalMessage: string): string => {
    // 간단한 하드코딩된 교정 예시
    let corrected = originalMessage;
    
    // 기본적인 교정 (실제로는 Claude API로 대체)
    corrected = corrected
      .replace(/할머니가/g, '할머니께서')
      .replace(/아프다/g, '아프시다')
      .replace(/병원에 간다/g, '병원에 가야 합니다')
      .replace(/통증이 심하다/g, '통증이 심하십니다');
    
    return corrected || originalMessage;
  };

  const goNext = () => {
    if (index < items.length - 1) {
      setIndex(index + 1);
      setMessage('');
      setShowFeedback(false);
      setShowHint(false);
    } else {
      // 모든 학습 완료 시 축하 페이지 표시
      setShowCelebration(true);
      startConfettiAnimation();
    }
  };

  const goPrevious = () => {
    if (index > 0) {
      setIndex(index - 1);
      setMessage('');
      setShowFeedback(false);
      setShowHint(false);
    }
  };

  const toggleFeedbackLanguage = () => {
    setFeedbackLanguage(feedbackLanguage === 'ko' ? 'vi' : 'ko');
  };

  const startConfettiAnimation = () => {
    Animated.sequence([
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const goToMain = () => {
    // 메인 화면으로 이동 (네비게이션 구현 필요)
    Alert.alert('Chúc mừng!', 'Chuyển về màn hình chính.');
  };

  if (!item || !item.scenarioData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không thể tải kịch bản.</Text>
      </View>
    );
  }

  const remainingUsage = Math.max(0, 3 - dailyUsage);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 사용량 표시 */}
      <View style={styles.usageContainer}>
        <Text style={styles.usageText}>
          {isPremium ? 'Người dùng Premium' : `Số lần còn lại hôm nay: ${remainingUsage}`}
        </Text>
        {!isPremium && (
          <Pressable 
            style={styles.premiumButton} 
            onPress={() => setShowPremiumModal(true)}
          >
            <Text style={styles.premiumButtonText}>Nâng cấp Premium</Text>
          </Pressable>
        )}
      </View>

      {/* 상황 카드 */}
      <View style={styles.scenarioCard}>
        <Text style={styles.scenarioTitle}>{item.scenarioData.title}</Text>
        <Text style={styles.scenarioDescription}>{item.scenarioData.description}</Text>
        
        {/* 힌트 버튼 */}
        <Pressable 
          style={styles.hintButton} 
          onPress={() => setShowHint(!showHint)}
        >
          <Text style={styles.hintButtonText}>
            {showHint ? '💡 Ẩn gợi ý' : '💡 Xem gợi ý'}
          </Text>
        </Pressable>

        {/* 힌트 내용 */}
        {showHint && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintTitle}>📝 Tin nhắn mẫu</Text>
            {item.scenarioData.sampleMessages.map((sample, idx) => (
              <Text key={idx} style={styles.hintText}>
                {idx + 1}. {sample}
              </Text>
            ))}
            <Text style={styles.hintSubtitle}>
              Hãy viết theo cách này!
            </Text>
          </View>
        )}
      </View>

      {/* 문자 작성 입력창 */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputTitle}>Viết tin nhắn</Text>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder="Viết tin nhắn ở đây... (giới hạn 200 ký tự)"
          placeholderTextColor="#90A4AE"
          multiline
          maxLength={200}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>
          {message.length}/200
        </Text>
        <Pressable 
          style={[
            styles.submitButton, 
            !message.trim() && styles.submitButtonDisabled
          ]} 
          onPress={requestAICorrection}
          disabled={!message.trim()}
        >
          <Text style={styles.submitButtonText}>Yêu cầu sửa lỗi AI</Text>
        </Pressable>
      </View>

      {/* AI 피드백 - 인라인 교정 */}
      {showFeedback && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackTitle}>🤖 AI sửa lỗi kết quả</Text>
          
          {/* 교정된 메시지 표시 */}
          <View style={styles.correctedMessageContainer}>
            <Text style={styles.correctedMessageLabel}>
              {feedbackLanguage === 'ko' ? 'Tin nhắn đã sửa' : 'Tin nhắn đã sửa'}
            </Text>
            <Text style={styles.correctedMessageText}>
              {getMockAICorrection(message)}
            </Text>
          </View>

          {/* 간단한 코멘트 */}
          <View style={styles.commentContainer}>
            <Text style={styles.commentTitle}>
              💬 Nhận xét
            </Text>
            <Text style={styles.commentText}>
              Bạn đã sử dụng kính ngữ và cách diễn đạt lịch sự rất tốt. Đã được cải thiện thành cách diễn đạt tiếng Hàn tự nhiên hơn.
            </Text>
          </View>

          {/* 언어 전환 */}
          <Pressable 
            style={styles.languageToggle} 
            onPress={toggleFeedbackLanguage}
          >
            <Text style={styles.languageToggleText}>
              {feedbackLanguage === 'ko' ? '🇰🇷 한국어' : '🇻🇳 Tiếng Việt'}
            </Text>
          </Pressable>

          {/* 네비게이션 버튼 */}
          <View style={styles.navigationButtons}>
            <Pressable 
              style={[styles.navButton, styles.prevButton]} 
              onPress={goPrevious}
              disabled={index === 0}
            >
              <Text style={styles.navButtonText}>← Trước</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.navButton, styles.nextButton]} 
              onPress={goNext}
            >
              <Text style={styles.navButtonText}>
                {index === items.length - 1 ? 'Hoàn thành' : 'Tiếp theo →'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 진행률 정보 */}
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          {index + 1} / {items.length} kịch bản
        </Text>
      </View>

      {/* 프리미엄 업그레이드 모달 */}
      <Modal
        visible={showPremiumModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPremiumModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🌟 Nâng cấp Premium</Text>
            <Text style={styles.modalSubtitle}>
              Sử dụng các tính năng AI không giới hạn và các tính năng nâng cao!
            </Text>
            
            <View style={styles.premiumFeatures}>
              <Text style={styles.featureText}>✅ AI sửa lỗi không giới hạn</Text>
              <Text style={styles.featureText}>✅ Luyện phát âm và phản hồi âm thanh</Text>
              <Text style={styles.featureText}>✅ Phân tích và thống kê nâng cao</Text>
              <Text style={styles.featureText}>✅ Học tự động đề xuất cá nhân</Text>
            </View>

            <Text style={styles.developmentNote}>
              🚧 Đang phát triển. Dịch vụ sẽ sớm khởi động!
            </Text>

            <Pressable 
              style={styles.modalButton} 
              onPress={() => setShowPremiumModal(false)}
            >
              <Text style={styles.modalButtonText}>Xác nhận</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 축하 페이지 모달 */}
      <Modal
        visible={showCelebration}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCelebration(false)}
      >
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationContent}>
            {/* 콘페티 애니메이션 */}
            <Animated.View 
              style={[
                styles.confetti,
                {
                  opacity: confettiAnim,
                  transform: [{ scale: confettiAnim }]
                }
              ]}
            >
              <Text style={styles.confettiText}>🎉🎊🎈</Text>
            </Animated.View>
            
            <Text style={styles.celebrationTitle}>🎉 Chúc mừng! 🎉</Text>
            <Text style={styles.celebrationSubtitle}>
              Hoàn thành tất cả các bài tập viết tin nhắn!
            </Text>
            <Text style={styles.celebrationMessage}>
              Kỹ năng viết tin nhắn tiếng Hàn thực tế của bạn với tư cách là người chăm sóc đã được cải thiện đáng kể.
            </Text>
            
            <Pressable 
              style={styles.celebrationButton} 
              onPress={goToMain}
            >
              <Text style={styles.celebrationButtonText}>Trở về trang chủ</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  
  // 사용량 표시
  usageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  usageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37474F',
  },
  premiumButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  premiumButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // 상황 카드
  scenarioCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scenarioTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A237E',
    marginBottom: 12,
  },
  scenarioDescription: {
    fontSize: 16,
    color: '#37474F',
    lineHeight: 24,
    marginBottom: 16,
  },

  // 힌트 버튼
  hintButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  hintButtonText: {
    fontSize: 14,
    color: '#37474F',
    fontWeight: '600',
  },

  // 힌트 내용
  hintContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 12,
  },
  hintText: {
    fontSize: 14,
    color: '#546E7A',
    lineHeight: 20,
    marginBottom: 8,
  },
  hintSubtitle: {
    fontSize: 14,
    color: '#90A4AE',
    textAlign: 'center',
  },

  // 입력창
  inputContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#37474F',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 14,
    color: '#90A4AE',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },

  // AI 피드백
  feedbackContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 16,
  },
  
  // 교정된 메시지
  correctedMessageContainer: {
    marginBottom: 16,
  },
  correctedMessageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#546E7A',
    marginBottom: 8,
  },
  correctedMessageText: {
    fontSize: 16,
    color: '#2E7D32',
    lineHeight: 22,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    fontWeight: '600',
  },

  // 간단한 코멘트
  commentContainer: {
    marginBottom: 16,
  },
  commentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#546E7A',
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#37474F',
    lineHeight: 20,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    minHeight: 80,
  },

  // 언어 전환
  languageToggle: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  languageToggleText: {
    fontSize: 14,
    color: '#37474F',
    fontWeight: '600',
  },

  // 네비게이션 버튼
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: '#90A4AE',
  },
  nextButton: {
    backgroundColor: '#1E88E5',
  },
  navButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // 진행률
  progressInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9C27B0',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#37474F',
    textAlign: 'center',
    marginBottom: 20,
  },
  premiumFeatures: {
    marginBottom: 20,
  },
  featureText: {
    fontSize: 14,
    color: '#546E7A',
    marginBottom: 8,
  },
  developmentNote: {
    fontSize: 14,
    color: '#FF9800',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  modalButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },

  // 축하 페이지
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  confetti: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    zIndex: 1,
  },
  confettiText: {
    fontSize: 100,
    color: '#FFD700', // 금색
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A237E',
    marginBottom: 10,
  },
  celebrationSubtitle: {
    fontSize: 18,
    color: '#37474F',
    marginBottom: 15,
  },
  celebrationMessage: {
    fontSize: 16,
    color: '#37474F',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  celebrationButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  celebrationButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },

  errorText: {
    fontSize: 18,
    color: '#EF5350',
    textAlign: 'center',
    marginTop: 40,
  },
});
