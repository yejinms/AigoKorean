import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { StatusBar } from 'expo-status-bar';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function MainScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.headerSection}>
        <View style={styles.welcomeBubble}>
          <Text style={styles.welcomeText}>Xin chào, chào mừng!</Text>
        </View>
      </View>

      <View style={styles.mascotSection}>
        <View style={styles.mascotContainer}>
          <Image source={require('../../assets/hattnim.png')} style={styles.mascotImage} />
        </View>
      </View>

      <Pressable style={styles.card} onPress={() => navigation.navigate('Writing')}>
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <View style={styles.cardDot} />
            <Text style={styles.cardTitle}>Viết</Text>
          </View>
          <Text style={styles.cardArrow}>→</Text>
        </View>
      </Pressable>

      <Pressable style={styles.card} onPress={() => navigation.navigate('Vocabulary')}>
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <View style={styles.cardDot} />
            <Text style={styles.cardTitle}>Từ vựng</Text>
          </View>
          <Text style={styles.cardArrow}>→</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  headerSection: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoImage: {
    width: 80,
    height: 30,
    resizeMode: 'contain',
  },
  welcomeBubble: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
    textAlign: 'center',
  },
  mascotSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mascotContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  mascotImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  card: {
    width: '88%',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    marginBottom: 16,
    alignSelf: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF5350',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1976D2',
  },
  cardArrow: {
    fontSize: 24,
    color: '#1976D2',
    fontWeight: '600',
  },
});

