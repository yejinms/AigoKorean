import { useEffect, useState, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Modal, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import content from '@/data/content.json';

type RelatedItem = { korean: string; vietnamese: string; };
type Item = {
  id: number;
  category: string;
  koreanWord: string;
  vietnameseWord: string;
  difficulty?: 1 | 2 | 3;
  relatedTerms: RelatedItem[];
};

export default function ReviewScreen() {
  const [difficultWords, setDifficultWords] = useState<any[]>([]);
  const [wrongSentences, setWrongSentences] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [checkedWords, setCheckedWords] = useState<Record<number, boolean>>({});
  
  // 애니메이션을 위한 ref들
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      // 못 외운 단어들 로드
      const savedDifficultWords = await AsyncStorage.getItem('difficultWords');
      if (savedDifficultWords) {
        setDifficultWords(JSON.parse(savedDifficultWords));
      }

      // 틀린 문장들 로드
      const savedWrongSentences = await AsyncStorage.getItem('wrongSentences');
      if (savedWrongSentences) {
        setWrongSentences(JSON.parse(savedWrongSentences));
      }
    } catch (error) {
      console.error('복습 데이터 로드 실패:', error);
    }
  };

  const removeDifficultWord = async (id: number) => {
    try {
      const newDifficultWords = difficultWords.filter(word => word.id !== id);
      setDifficultWords(newDifficultWords);
      await AsyncStorage.setItem('difficultWords', JSON.stringify(newDifficultWords));
    } catch (error) {
      console.error('못 외운 단어 제거 실패:', error);
    }
  };

  const removeWrongSentence = async (id: number) => {
    try {
      const newWrongSentences = wrongSentences.filter(sentence => sentence.id !== id);
      setWrongSentences(newWrongSentences);
      await AsyncStorage.setItem('wrongSentences', JSON.stringify(newWrongSentences));
    } catch (error) {
      console.error('틀린 문장 제거 실패:', error);
    }
  };

  // 상세보기 모달 열기
  const openWordDetail = (word: any) => {
    // content.json에서 해당 단어의 전체 정보 찾기
    const fullWordData = (content as any[]).find(item => item.id === word.id);
    if (fullWordData) {
      setSelectedWord(fullWordData);
      setModalVisible(true);
    }
  };

  // 상세보기 모달 닫기
  const closeModal = () => {
    setModalVisible(false);
    setSelectedWord(null);
  };

  // 체크박스 토글 (외웠어요)
  const toggleCheckbox = async (wordId: number) => {
    const newCheckedWords = { ...checkedWords, [wordId]: !checkedWords[wordId] };
    setCheckedWords(newCheckedWords);
    
    // 체크된 단어는 복습에서 제거 (애니메이션 후)
    if (newCheckedWords[wordId]) {
      // 체크 애니메이션
      Animated.sequence([
        // 체크 표시 애니메이션
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // 사라지는 애니메이션
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // 애니메이션 완료 후 단어 제거
        removeDifficultWord(wordId);
        // 애니메이션 값 초기화
        scaleAnim.setValue(1);
        fadeAnim.setValue(1);
      });
    }
  };

  const getCategoryStats = () => {
    const stats: Record<string, { difficult: number; wrong: number }> = {};
    
    // 못 외운 단어 카테고리별 통계
    difficultWords.forEach(word => {
      if (!stats[word.category]) {
        stats[word.category] = { difficult: 0, wrong: 0 };
      }
      stats[word.category].difficult++;
    });

    // 틀린 문장 카테고리별 통계
    wrongSentences.forEach(sentence => {
      if (!stats[sentence.category]) {
        stats[sentence.category] = { difficult: 0, wrong: 0 };
      }
      stats[sentence.category].wrong++;
    });
    
    return stats;
  };

  const stats = getCategoryStats();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>복습하기</Text>
      
      {/* 진행률 요약 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>복습 현황</Text>
        {Object.entries(stats).map(([category, { difficult, wrong }]) => (
          <View key={category} style={styles.statRow}>
            <Text style={styles.categoryName}>{category}</Text>
            <View style={styles.statDetails}>
              <Text style={styles.progressText}>
                못 외운 단어: {difficult}개
              </Text>
              <Text style={styles.progressText}>
                틀린 문장: {wrong}개
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* 못 외운 단어 목록 */}
      <Text style={styles.sectionTitle}>못 외운 단어들</Text>
      {difficultWords.length === 0 ? (
        <Text style={styles.emptyText}>아직 못 외운 단어가 없습니다.</Text>
      ) : (
        difficultWords.map((word) => (
          <Animated.View 
            key={word.id} 
            style={[
              styles.wordCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.wordHeader}>
              <Text style={styles.wordTitle}>{word.word}</Text>
              <Pressable 
                style={styles.detailButton} 
                onPress={() => openWordDetail(word)}
              >
                <Text style={styles.detailButtonText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.wordSubtitle}>{word.vietnameseWord}</Text>
            
            <View style={styles.cardActions}>
              <Pressable style={styles.audioButton}>
                <Text style={styles.audioButtonText}>🔊 듣기</Text>
              </Pressable>
              <Pressable 
                style={[styles.checkbox, checkedWords[word.id] && styles.checkboxOn]} 
                onPress={() => toggleCheckbox(word.id)}
              >
                <Text style={[styles.checkboxText, checkedWords[word.id] && { color: 'white' }]}>
                  {checkedWords[word.id] ? '✓' : '☐'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ))
      )}

      {/* 틀린 문장 목록 */}
      <Text style={styles.sectionTitle}>틀린 문장들</Text>
      {wrongSentences.length === 0 ? (
        <Text style={styles.emptyText}>아직 틀린 문장이 없습니다.</Text>
      ) : (
        wrongSentences.map((sentence) => (
          <View key={sentence.id} style={styles.sentenceCard}>
            <View style={styles.sentenceHeader}>
              <Text style={styles.sentenceTitle}>베트남어</Text>
              <Pressable 
                style={styles.removeButton} 
                onPress={() => removeWrongSentence(sentence.id)}
              >
                <Text style={styles.removeButtonText}>✓</Text>
              </Pressable>
            </View>
            <Text style={styles.vietnameseText}>{sentence.vietnameseSentence}</Text>
            <Text style={styles.sentenceSubtitle}>틀린 답: {sentence.wrongAnswer}</Text>
            <Text style={styles.correctAnswer}>정답: {sentence.correctAnswer}</Text>
            <Text style={styles.categoryText}>{sentence.category}</Text>
            <Text style={styles.timestampText}>
              {new Date(sentence.timestamp).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}

      {/* 상세보기 모달 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* 닫기 버튼 */}
            <Pressable style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
            
            {/* 단어 상세 정보 */}
            {selectedWord && (
              <View style={styles.wordDetailContent}>
                <Text style={styles.detailWordTitle}>{selectedWord.word}</Text>
                <Text style={styles.detailWordSubtitle}>{selectedWord.vietnameseWord}</Text>
                <Text style={styles.detailCategory}>{selectedWord.category}</Text>
                
                {/* 예시 문장 */}
                <View style={styles.exampleSection}>
                  <Text style={styles.exampleLabel}>예시 문장:</Text>
                  <Text style={styles.exampleText}>{selectedWord.exampleKo}</Text>
                  <Text style={styles.exampleTranslation}>{selectedWord.exampleVi}</Text>
                </View>
                
                {/* 연관 단어들 */}
                <View style={styles.relatedSection}>
                  <Text style={styles.relatedLabel}>관련 단어:</Text>
                  {selectedWord.relatedTerms?.map((term: any, index: number) => (
                    <View key={index} style={styles.relatedTerm}>
                      <Text style={styles.termKorean}>{term.korean}</Text>
                      <Text style={styles.termVietnamese}>{term.vietnamese}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A237E',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#546E7A',
  },
  statDetails: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#90A4AE',
    fontSize: 16,
    marginTop: 40,
  },
  wordCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  wordKo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A237E',
    flex: 1,
  },
  wordVi: {
    fontSize: 14,
    color: '#546E7A',
    flex: 1,
  },
  difficulty: {
    color: '#FBC02D',
    fontSize: 16,
    fontWeight: '800',
  },
  relatedTerms: {
    marginBottom: 12,
  },
  termRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  termKo: {
    fontSize: 14,
    color: '#37474F',
    flex: 1,
  },
  termVi: {
    fontSize: 14,
    color: '#90A4AE',
    flex: 1,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  checkboxOn: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  checkboxText: {
    color: '#90A4AE',
    fontWeight: '800',
    fontSize: 16,
  },
  wordTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A237E',
    flex: 1,
  },
  wordSubtitle: {
    fontSize: 16,
    color: '#546E7A',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  audioButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  audioButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: '800',
  },
  categoryText: {
    fontSize: 14,
    color: '#546E7A',
    marginBottom: 8,
  },
  timestampText: {
    fontSize: 12,
    color: '#90A4AE',
    fontStyle: 'italic',
  },
  sentenceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sentenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sentenceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A237E',
  },
  vietnameseText: {
    fontSize: 16,
    color: '#37474F',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sentenceSubtitle: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 4,
  },
  correctAnswer: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#90A4AE',
    fontWeight: '700',
  },
  wordDetailContent: {
    marginTop: 20,
  },
  detailWordTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A237E',
    marginBottom: 8,
    textAlign: 'center',
  },
  detailWordSubtitle: {
    fontSize: 18,
    color: '#546E7A',
    marginBottom: 8,
    textAlign: 'center',
  },
  detailCategory: {
    fontSize: 14,
    color: '#90A4AE',
    marginBottom: 20,
    textAlign: 'center',
  },
  exampleSection: {
    marginBottom: 20,
  },
  exampleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 16,
    color: '#1A237E',
    marginBottom: 4,
    lineHeight: 22,
  },
  exampleTranslation: {
    fontSize: 14,
    color: '#546E7A',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  relatedSection: {
    marginBottom: 20,
  },
  relatedLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 8,
  },
  relatedTerm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  termKorean: {
    fontSize: 14,
    color: '#37474F',
    fontWeight: '600',
  },
  termVietnamese: {
    fontSize: 14,
    color: '#546E7A',
  },
});
