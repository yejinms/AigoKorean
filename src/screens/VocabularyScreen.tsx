import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, StyleSheet, Text, View, PanResponder, Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import content from '@/data/content.json';

type RelatedItem = { korean: string; vietnamese: string; };
type Item = {
  id: number;
  koreanWord: string;
  vietnameseWord: string;
  imageURL: string;
  exampleKo: string; // 한국어 예문
  exampleVi: string; // 베트남어 예문(해석)
  audioURL: string;
  audioWordKoURL?: string;
  audioExampleKoURL?: string;
  relatedTerms: RelatedItem[];
  difficulty?: 1 | 2 | 3; // 별 1~3
};

export default function VocabularyScreen() {
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  
  // index가 변경될 때마다 item을 새로 계산
  const item = useMemo(() => (content as Item[])[index], [index]);

  const goNext = useCallback(() => {
    const totalLength = (content as Item[]).length;
    
    if (index < totalLength - 1) {
      setIndex(index + 1);
    } else {
      Alert.alert('완료', '모든 단어 학습을 마쳤습니다.');
    }
  }, [index]);

  // Tinder-style swipe
  const translateX = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  
  const panResponder = useMemo(() => 
    PanResponder.create({
              onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5,
      onPanResponderMove: (_, g) => {
        // 화면 크기에 비례한 임계값 (화면 너비의 15%)
        const threshold = screenWidth * 0.15;
        const progress = Math.min(Math.abs(g.dx) / threshold, 1);
        
        if (g.dx > 10) {
          setSwipeDirection('right');
          setSwipeProgress(progress);
        } else if (g.dx < -10) {
          setSwipeDirection('left');
          setSwipeProgress(progress);
        }
        
        // 애니메이션 업데이트
        translateX.setValue(g.dx);
      },
      onPanResponderGrant: () => {
        // 스와이프 시작 시 초기화
        setSwipeDirection(null);
        setSwipeProgress(0);
      },
      onPanResponderRelease: (_, g) => {
        // 화면 크기에 비례한 임계값 (화면 너비의 15%)
        const threshold = screenWidth * 0.15;
        
        if (g.dx > threshold) {
          // 오른쪽 스와이프 → 외운 것 (초록색 체크)
          setSwipeDirection('right');
          setSwipeProgress(1);
          Animated.timing(translateX, { toValue: screenWidth * 1.2, duration: 150, useNativeDriver: false }).start(() => {
            translateX.setValue(0);
            goNext();
          });
        } else if (g.dx < -threshold) {
          // 왼쪽 스와이프 → 못 외운 것 (빨간색 X)
          setSwipeDirection('left');
          setSwipeProgress(1);
          Animated.timing(translateX, { toValue: -screenWidth * 1.2, duration: 150, useNativeDriver: false }).start(() => {
            translateX.setValue(0);
            goNext();
          });
        } else {
          // 스와이프 거리 부족, 원위치로 복귀
          setSwipeDirection(null);
          setSwipeProgress(0);
          Animated.spring(translateX, { 
            toValue: 0, 
            useNativeDriver: false,
            tension: 100,
            friction: 8
          }).start();
        }
      },
    }), [goNext, screenWidth]
  );

  useEffect(() => {
    setChecked({});
    setSwipeDirection(null);
    setSwipeProgress(0);
  }, [index]);



  const playKoreanWord = async () => {
    if (item.audioWordKoURL) {
      const { sound } = await Audio.Sound.createAsync({ uri: item.audioWordKoURL });
      await sound.playAsync();
    } else {
      Speech.speak(item.koreanWord, { language: 'ko-KR' });
    }
  };

  const playKoreanExample = async () => {
    if (item.audioExampleKoURL) {
      const { sound } = await Audio.Sound.createAsync({ uri: item.audioExampleKoURL });
      await sound.playAsync();
    } else if (item.exampleKo) {
      Speech.speak(item.exampleKo, { language: 'ko-KR' });
    }
  };

  const allChecked = useMemo(() => item.relatedTerms.some((_, i) => checked[i]), [item, checked]);

  const toggleCheck = async (i: number) => {
    const newChecked = { ...checked, [i]: !checked[i] };
    setChecked(newChecked);
    
    try {
      // 현재 단어의 체크 상태를 AsyncStorage에 저장
      const currentWordChecked = newChecked[i];
      const savedCheckedWords = await AsyncStorage.getItem('checkedWords');
      let allCheckedWords = savedCheckedWords ? JSON.parse(savedCheckedWords) : {};
      
      if (currentWordChecked) {
        // 체크된 경우: 현재 단어 ID를 저장
        allCheckedWords[item.id] = true;
      } else {
        // 체크 해제된 경우: 현재 단어 ID를 제거
        delete allCheckedWords[item.id];
      }
      
      await AsyncStorage.setItem('checkedWords', JSON.stringify(allCheckedWords));
    } catch (error) {
      console.error('체크 상태 저장 실패:', error);
    }
  };


  
  return (
    <View style={styles.screen}>
      {/* 웹 환경을 위한 네비게이션 버튼 */}
      <View style={styles.webNavigation}>
        <Pressable style={styles.navButton} onPress={() => {
          if (index > 0) {
            setIndex(index - 1);
          }
        }}>
          <Text style={styles.navButtonText}>← 이전</Text>
        </Pressable>
        <Text style={styles.navInfo}>{index + 1} / {(content as Item[]).length}</Text>
        <Pressable style={styles.navButton} onPress={goNext}>
          <Text style={styles.navButtonText}>다음 →</Text>
        </Pressable>
      </View>
      
      <Animated.View style={[styles.card, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <View style={styles.container}>
          {!item ? (
            <Text style={styles.errorText}>단어를 불러올 수 없습니다.</Text>
          ) : (
            <>
              {!!item.imageURL && (
                <Image source={{ uri: item.imageURL }} style={styles.image} />
              )}
              <View style={styles.rowWithBtn}>
                <Text style={styles.wordKo}>{item.koreanWord}</Text>
                <Pressable style={styles.speakerSmall} onPress={playKoreanWord}>
                  <Text style={{ color: 'white', fontWeight: '700' }}>🔊</Text>
                </Pressable>
              </View>
              <Text style={styles.subtitle}>{item.vietnameseWord}</Text>

              <View style={styles.exampleBox}>
                <Pressable style={styles.speaker} onPress={playKoreanExample}>
                  <Text style={{ color: 'white', fontWeight: '700' }}>🔊</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exampleLabel}>Ví dụ</Text>
                  <Text style={styles.example}>{item.exampleKo}</Text>
                </View>
              </View>
              <Text style={styles.exampleTrans}>{item.exampleVi}</Text>

              <Text style={styles.sectionTitle}>Biểu hiện liên quan nên biết</Text>
              <View style={styles.quizList}>
                {item.relatedTerms.map((t, i) => (
                  <View key={i} style={styles.quizRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quizKo}>{t.korean}</Text>
                      <Text style={styles.quizVi}>{t.vietnamese}</Text>
                    </View>
                    <Pressable onPress={() => toggleCheck(i)} style={[styles.checkbox, checked[i] && styles.checkboxOn]}>
                      <Text style={{ color: checked[i] ? 'white' : '#607D8B' }}>{checked[i] ? '✓' : ''}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
        
        {/* 틴더 스타일 스와이프 오버레이 */}
        {swipeDirection && (
          <View style={[
            styles.swipeOverlay,
            swipeDirection === 'right' ? styles.swipeOverlayGreen : styles.swipeOverlayRed,
            { opacity: Math.max(swipeProgress * 0.9, 0.3) } // 최소 투명도 0.3 보장
          ]}>
            <Text style={styles.swipeIcon}>
              {swipeDirection === 'right' ? '✅' : '❌'}
            </Text>
          </View>
        )}
        

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  webNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  navButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  navInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37474F',
  },
  errorText: {
    fontSize: 18,
    color: '#EF5350',
    textAlign: 'center',
    marginTop: 40,
  },
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  swipeOverlayGreen: {
    backgroundColor: '#4CAF50',
  },
  swipeOverlayRed: {
    backgroundColor: '#F44336',
  },
  swipeIcon: {
    fontSize: 80,
    color: 'white',
    fontWeight: 'bold',
  },

  card: {
    margin: 16,
    backgroundColor: '#FDFDFE',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    position: 'relative',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1A237E' },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#546E7A' },
  image: { width: '100%', height: 160, borderRadius: 12, backgroundColor: '#ECEFF1' },
  starsRow: { textAlign: 'center', color: '#FBC02D', fontSize: 18, fontWeight: '800' },
  exampleBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exampleLabel: { fontSize: 12, color: '#90A4AE', marginBottom: 4, fontWeight: '700' },
  example: { flex: 1, fontSize: 16, color: '#37474F', marginRight: 12 },
  exampleTrans: { fontSize: 15, color: '#607D8B' },
  speaker: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00BCD4', alignItems: 'center', justifyContent: 'center' },
  speakerSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00BCD4', alignItems: 'center', justifyContent: 'center' },
  rowWithBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordKo: { fontSize: 22, fontWeight: '800', color: '#1A237E' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  quizList: { gap: 10 },
  quizRow: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  quizKo: { fontWeight: '700', fontSize: 16 },
  quizVi: { color: '#607D8B' },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 20, fontWeight: '800' },
  checkbox: { width: 28, height: 28, borderRadius: 6, borderWidth: 2, borderColor: '#B0BEC5', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
  next: { display: 'none' },
  nextText: { display: 'none' },
});

