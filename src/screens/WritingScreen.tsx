import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import content from '@/data/content.json';

type Item = {
  id: number;
  category: string;
  koreanWord: string;
  vietnameseWord: string;
  difficulty?: 1 | 2 | 3;
  exampleKo: string;
  exampleVi: string;
  vietnameseSentence: string;
  koreanOptions: string[];
  correctAnswer: number;
  explanation: string;
  usage: string;
  relatedTerms: Array<{ korean: string; vietnamese: string; }>;
};

export default function SentenceScreen() {
  const items = (content as Item[]);
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const item = items[index];
  const target = item?.vietnameseSentence || '';

  // 한국어 선택지 생성 (정답 + 오답 2개)
  const koreanOptions = useMemo(() => {
    if (!item) return [];
    
    return item.koreanOptions.map((option, idx) => ({
      text: option,
      isCorrect: idx === item.correctAnswer,
      originalIndex: idx
    }));
  }, [item]);

  useEffect(() => {
    // 자동재생 제거 - 베트남어 음성은 불필요
  }, [index, target]);

  const playKoreanHint = () => {
    if (item) {
      const correctAnswer = item.koreanOptions[item.correctAnswer];
      Speech.speak(correctAnswer, { language: 'ko-KR' });
    }
  };

  // 틀린 문장을 AsyncStorage에 저장하는 함수
  const saveWrongSentence = async (sentenceItem: Item, wrongAnswer: string) => {
    try {
      const savedWrongSentences = await AsyncStorage.getItem('wrongSentences');
      let wrongSentences = savedWrongSentences ? JSON.parse(savedWrongSentences) : [];
      
      // 이미 저장된 문장인지 확인
      const existingIndex = wrongSentences.findIndex((s: any) => s.id === sentenceItem.id);
      
      if (existingIndex === -1) {
        // 새로운 틀린 문장 추가
        wrongSentences.push({
          id: sentenceItem.id,
          vietnameseSentence: sentenceItem.vietnameseSentence,
          wrongAnswer: wrongAnswer,
          correctAnswer: sentenceItem.koreanOptions[sentenceItem.correctAnswer],
          category: sentenceItem.category || '기타',
          timestamp: new Date().toISOString()
        });
        
        await AsyncStorage.setItem('wrongSentences', JSON.stringify(wrongSentences));
      }
    } catch (error) {
      console.error('틀린 문장 저장 실패:', error);
    }
  };

  const selectAnswer = async (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
    setShowResult(true);
    
    // 틀린 답을 선택한 경우 AsyncStorage에 저장
    if (!koreanOptions[optionIndex].isCorrect) {
      await saveWrongSentence(item, koreanOptions[optionIndex].text);
    }
  };

  const goNext = () => {
    if (index < items.length - 1) {
      setIndex(index + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      Alert.alert('완료', '모든 문장 연습을 마쳤습니다.');
    }
  };



  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>문장을 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 현재 문장 정보 */}
      <View style={styles.sentenceInfo}>
        <View style={styles.infoHeader}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.categoryDescription}>
          {item.category === '요양보호사' ? '요양보호사가 노인과 대화할 때 사용하는 표현' :
           item.category === '의학/건강' ? '병원에서 증상이나 건강 상태를 문의할 때' :
           '일상생활에서 가족과 대화할 때'}
        </Text>
      </View>



      {/* 한국어 정답 힌트 음성 */}
      <View style={styles.audioSection}>
        <Pressable style={styles.audioButton} onPress={playKoreanHint}>
          <Text style={styles.audioText}>🔊 정답 힌트 듣기</Text>
        </Pressable>
      </View>

      {/* 베트남어 문장 표시 */}
      <View style={styles.vietnameseSection}>
        <Text style={styles.vietnameseTitle}>베트남어 문장:</Text>
        <Text style={styles.vietnameseText}>{item.vietnameseSentence}</Text>
        <Text style={styles.vietnameseSubtext}>이 베트남어 문장을 한국어로 어떻게 표현할까요?</Text>
      </View>

      {/* 한국어 선택지 */}
      <View style={styles.optionsSection}>
        <Text style={styles.optionsTitle}>한국어 표현 선택:</Text>
        {koreanOptions.map((option, idx) => (
          <Pressable
            key={idx}
            style={[
              styles.optionButton,
              selectedAnswer === idx && styles.optionButtonSelected,
              showResult && option.isCorrect && styles.optionButtonCorrect,
              showResult && selectedAnswer === idx && !option.isCorrect && styles.optionButtonWrong
            ]}
            onPress={() => selectAnswer(idx)}
            disabled={showResult}
          >
            <Text style={[
              styles.optionText,
              selectedAnswer === idx && styles.optionTextSelected,
              showResult && option.isCorrect && styles.optionTextCorrect
            ]}>
              {String.fromCharCode(65 + idx)}. {option.text}
            </Text>
            {showResult && option.isCorrect && (
              <Text style={styles.correctIcon}>✅</Text>
            )}
            {showResult && selectedAnswer === idx && !option.isCorrect && (
              <Text style={styles.wrongIcon}>❌</Text>
            )}
          </Pressable>
        ))}
      </View>

      {/* 결과 표시 */}
      {showResult && (
        <View style={styles.resultSection}>
          {selectedAnswer !== null && koreanOptions[selectedAnswer]?.isCorrect ? (
            <View style={styles.correctResult}>
              <Text style={styles.resultTitle}>🎉 정답입니다!</Text>
              <Text style={styles.resultSubtext}>훌륭합니다! 이 표현을 잘 이해하고 계시네요.</Text>
              <Text style={styles.explanation}>
                이 표현은 {item.category === '요양보호사' ? '요양보호사 업무' : '일상생활'}에서 자주 사용됩니다.
              </Text>
            </View>
          ) : (
            <View style={styles.wrongResult}>
              <Text style={styles.resultTitle}>❌ 오답입니다</Text>
              <Text style={styles.resultSubtext}>정답을 확인하고 다시 학습해보세요.</Text>
                                        <Text style={styles.correctAnswer}>
                            정답: {item.koreanOptions[item.correctAnswer]}
                          </Text>
              <Text style={styles.explanation}>
                이 표현은 {item.category === '요양보호사' ? '요양보호사 업무' : '일상생활'}에서 자주 사용됩니다.
              </Text>
            </View>
          )}
          
          <Pressable style={styles.nextButton} onPress={goNext}>
            <Text style={styles.nextButtonText}>
              {index < items.length - 1 ? '다음 문장' : '완료'}
            </Text>
          </Pressable>
        </View>
      )}



      {/* 진행 상황 */}
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          {index + 1} / {items.length} 문장
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  contentContainer: { padding: 20, gap: 16 },
  
  // 문장 정보 스타일
  sentenceInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },

  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37474F',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6C757D',
  },



  // 음성 재생 스타일
  audioSection: {
    flexDirection: 'row',
    gap: 12,
  },
  audioButton: { 
    backgroundColor: '#00BCD4', 
    paddingVertical: 12, 
    paddingHorizontal: 24,
    borderRadius: 12, 
    alignItems: 'center' 
  },
  audioText: { color: 'white', fontWeight: '800' },

  // 베트남어 문장 표시 스타일
  vietnameseSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  vietnameseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 8,
  },
  vietnameseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 8,
  },
  vietnameseSubtext: {
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
  },

  // 한국어 선택지 스타일
  optionsSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  optionButtonCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  optionButtonWrong: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#37474F',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#1976D2',
  },
  optionTextCorrect: {
    color: '#2E7D32',
  },
  optionTextWrong: {
    color: '#C62828',
  },
  correctIcon: {
    fontSize: 20,
    color: '#4CAF50',
    marginLeft: 10,
  },
  wrongIcon: {
    fontSize: 20,
    color: '#C62828',
    marginLeft: 10,
  },

  // 결과 표시 스타일
  resultSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 16,
  },
  correctResult: {
    alignItems: 'center',
    marginBottom: 16,
  },
  wrongResult: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 12,
  },
  correctAnswer: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 8,
  },
  explanation: {
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // 다음 버튼 스타일
  nextButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },



  // 진행 상황 스타일
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

  errorText: {
    fontSize: 18,
    color: '#EF5350',
    textAlign: 'center',
    marginTop: 40,
  },
});

