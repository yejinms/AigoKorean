import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Speech from 'expo-speech';
import content from '@/data/content.json';

type Item = {
  writingChallenge: string;
};

export default function WritingScreen() {
  const items = (content as (Item & any)[]);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);
  const target = items[index].writingChallenge as string;

  useEffect(() => {
    Speech.speak(target, { language: 'ko-KR' });
  }, [index]);

  const isCorrect = useMemo(() => value.trim() === target.trim(), [value, target]);

  const replay = () => Speech.speak(target, { language: 'ko-KR' });

  const submit = () => {
    if (isCorrect) {
      setResult('correct');
      try { Alert.alert('정답입니다!'); } catch {}
      if (index < items.length - 1) {
        setIndex(index + 1);
        setValue('');
        setShowDiff(false);
        setResult(null);
      } else {
        try { Alert.alert('완료', '모든 쓰기 연습을 마쳤습니다.'); } catch {}
      }
      return;
    }
    setShowDiff(true);
    setResult('wrong');
    try { Alert.alert('오답', '틀린 부분을 확인하고 수정해 보세요.'); } catch {}
  };

  const renderAnnotated = () => {
    const targetChars = Array.from(target);
    const typedChars = Array.from(value);
    const maxLen = Math.max(targetChars.length, typedChars.length);
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < maxLen; i++) {
      const t = targetChars[i];
      const v = typedChars[i];
      if (showDiff && v !== undefined) {
        const match = v === t;
        nodes.push(
          <Text key={`v-${i}`} style={match ? styles.charCorrect : styles.charWrong}>
            {v}
          </Text>
        );
      } else if (t !== undefined) {
        // 아직 안 쓴 나머지 정답은 고스트로 표시
        nodes.push(
          <Text key={`g-${i}`} style={styles.charGhost}>
            {t}
          </Text>
        );
      }
    }
    return nodes;
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.audio} onPress={replay}>
        <Text style={styles.audioText}>🔊 듣기</Text>
      </Pressable>

      <View style={[styles.inputWrapper, !isCorrect && value ? styles.inputError : null]}>
        <Text style={styles.answerGhost} numberOfLines={0}>{renderAnnotated()}</Text>
        <TextInput
          placeholder=""
          value={value}
          onChangeText={(t) => { setValue(t); if (showDiff) setShowDiff(false); setResult(null); }}
          multiline
          selectionColor="#1E88E5"
          style={[
            styles.input,
            showDiff ? { color: 'transparent' } : { color: '#000' },
          ]}
        />
      </View>

      <Pressable style={styles.submit} onPress={submit}>
        <Text style={styles.submitText}>제출</Text>
      </Pressable>

      {result === 'correct' && (
        <Text style={styles.feedbackCorrect}>정답입니다!</Text>
      )}
      {result === 'wrong' && (
        <Text style={styles.feedbackWrong}>틀린 부분을 확인해 수정해 보세요.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16 },
  audio: { backgroundColor: '#00BCD4', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  audioText: { color: 'white', fontWeight: '800' },
  inputWrapper: { position: 'relative', flex: 1, backgroundColor: 'white', borderRadius: 12 },
  answerGhost: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    lineHeight: 22,
    zIndex: 0,
    pointerEvents: 'none',
  },
  charGhost: { color: '#B0BEC5' },
  charCorrect: { color: '#2E7D32' },
  charWrong: { color: '#C62828' },
  feedbackCorrect: { marginTop: 8, color: '#2E7D32', fontWeight: '700' },
  feedbackWrong: { marginTop: 8, color: '#C62828', fontWeight: '700' },
  input: { flex: 1, padding: 16, fontSize: 16, color: '#000' },
  inputError: { borderWidth: 2, borderColor: '#EF5350' },
  submit: { backgroundColor: '#1E88E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: '800', fontSize: 16 },
});

