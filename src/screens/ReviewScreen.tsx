import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
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
  const [checkedWords, setCheckedWords] = useState<Record<number, boolean>>({});
  const [filteredContent, setFilteredContent] = useState<Item[]>([]);

  useEffect(() => {
    loadCheckedWords();
  }, []);

  const loadCheckedWords = async () => {
    try {
      const saved = await AsyncStorage.getItem('checkedWords');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCheckedWords(parsed);
        filterCheckedContent(parsed);
      }
    } catch (error) {
      console.error('체크된 단어 로드 실패:', error);
    }
  };

  const filterCheckedContent = (checked: Record<number, boolean>) => {
    const checkedIds = Object.keys(checked).filter(id => checked[Number(id)]);
    const filtered = (content as Item[]).filter(item => 
      checkedIds.includes(item.id.toString())
    );
    setFilteredContent(filtered);
  };

  const toggleCheck = async (id: number) => {
    const newChecked = { ...checkedWords, [id]: !checkedWords[id] };
    setCheckedWords(newChecked);
    
    try {
      await AsyncStorage.setItem('checkedWords', JSON.stringify(newChecked));
      filterCheckedContent(newChecked);
    } catch (error) {
      console.error('체크 상태 저장 실패:', error);
    }
  };

  const getCategoryStats = () => {
    const stats: Record<string, { total: number; checked: number }> = {};
    
    (content as Item[]).forEach(item => {
      if (!stats[item.category]) {
        stats[item.category] = { total: 0, checked: 0 };
      }
      stats[item.category].total++;
      
      if (checkedWords[item.id]) {
        stats[item.category].checked++;
      }
    });
    
    return stats;
  };

  const stats = getCategoryStats();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>복습하기</Text>
      
      {/* 진행률 요약 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>전체 진행률</Text>
        {Object.entries(stats).map(([category, { total, checked }]) => (
          <View key={category} style={styles.statRow}>
            <Text style={styles.categoryName}>{category}</Text>
            <Text style={styles.progressText}>
              {checked}/{total} ({Math.round((checked/total)*100)}%)
            </Text>
          </View>
        ))}
      </View>

      {/* 체크된 단어 목록 */}
      <Text style={styles.sectionTitle}>체크한 단어들</Text>
      {filteredContent.length === 0 ? (
        <Text style={styles.emptyText}>아직 체크한 단어가 없습니다.</Text>
      ) : (
        filteredContent.map((item) => (
          <View key={item.id} style={styles.wordCard}>
            <View style={styles.wordHeader}>
              <Text style={styles.wordKo}>{item.koreanWord}</Text>
              <Text style={styles.wordVi}>{item.vietnameseWord}</Text>
              <Text style={styles.difficulty}>
                {'★'.repeat(item.difficulty ?? 2)}
              </Text>
            </View>
            
            <View style={styles.relatedTerms}>
              {item.relatedTerms.map((term, i) => (
                <View key={i} style={styles.termRow}>
                  <Text style={styles.termKo}>{term.korean}</Text>
                  <Text style={styles.termVi}>{term.vietnamese}</Text>
                </View>
              ))}
            </View>
            
            <Pressable 
              style={[styles.checkbox, styles.checkboxOn]} 
              onPress={() => toggleCheck(item.id)}
            >
              <Text style={styles.checkboxText}>✓</Text>
            </Pressable>
          </View>
        ))
      )}
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
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  checkboxOn: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  checkboxText: {
    color: 'white',
    fontWeight: '800',
  },
});
