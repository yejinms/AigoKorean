import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, StyleSheet, Text, View, PanResponder, Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import content from '@/data/content.json';

type RelatedItem = { korean: string; vietnamese: string; isCorrect: boolean };
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
  const item = (content as Item[])[index];
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  // Tinder-style swipe
  const translateX = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: Animated.event([null, { dx: translateX }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        const threshold = 120;
        if (g.dx > threshold) {
          // 이해함 (오른쪽) → 다음 카드
          Animated.timing(translateX, { toValue: screenWidth * 1.2, duration: 200, useNativeDriver: true }).start(() => {
            translateX.setValue(0);
            goNext();
          });
        } else if (g.dx < -threshold) {
          // 어려움 (왼쪽) → 다음 카드로도 이동 (복습은 데이터 정책에 따라 추후 처리)
          Animated.timing(translateX, { toValue: -screenWidth * 1.2, duration: 200, useNativeDriver: true }).start(() => {
            translateX.setValue(0);
            goNext();
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    setChecked({});
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

  const toggleCheck = (i: number) => setChecked(prev => ({ ...prev, [i]: !prev[i] }));

  const goNext = () => {
    if (index < (content as Item[]).length - 1) setIndex(index + 1);
    else Alert.alert('완료', '모든 단어 학습을 마쳤습니다.');
  };

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.card, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <View style={styles.container}>
          {!!item.imageURL && (
            <Image source={{ uri: item.imageURL }} style={styles.image} />
          )}
          <Text style={styles.starsRow}>{'★'.repeat(item.difficulty ?? 2)}{'☆'.repeat(3 - (item.difficulty ?? 2))}</Text>
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
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: {
    margin: 16,
    backgroundColor: '#FDFDFE',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
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

