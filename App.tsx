import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Image, View, StyleSheet } from 'react-native';
import MainScreen from './src/screens/MainScreen';
import VocabularyScreen from './src/screens/VocabularyScreen';
import WritingScreen from './src/screens/WritingScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import MessageWritingScreen from './src/screens/MessageWritingScreen';

export type RootStackParamList = {
  Main: undefined;
  Vocabulary: undefined;
  Writing: undefined;
  Review: undefined;
  MessageWriting: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// 커스텀 헤더 컴포넌트
const LogoHeader = () => (
  <View style={styles.headerContainer}>
    <Image source={require('./assets/aigo_logo.png')} style={styles.headerLogo} />
  </View>
);

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{ 
            header: () => <LogoHeader />,
            headerShown: true
          }}
        />
        <Stack.Screen
          name="Vocabulary"
          component={VocabularyScreen}
          options={{ title: 'Từ vựng' }}
        />
        <Stack.Screen
          name="Writing"
          component={WritingScreen}
          options={{ title: '문장 연습' }}
        />
        <Stack.Screen
          name="Review"
          component={ReviewScreen}
          options={{ title: '복습하기' }}
        />
        <Stack.Screen
          name="MessageWriting"
          component={MessageWritingScreen}
          options={{ title: '문자 연습' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLogo: {
    width: 100,
    height: 35,
    resizeMode: 'contain',
  },
});
