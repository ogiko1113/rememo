import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const sources = [
  {
    icon: '📝',
    title: 'メモを入力',
    description: '思いついたことや学んだことを書く',
    implemented: true,
  },
  {
    icon: '🎥',
    title: 'YouTube URL',
    description: '動画の要点をAIが抽出',
    implemented: false,
  },
  {
    icon: '📚',
    title: '本の撮影/PDF',
    description: 'ページを撮影して要点抽出',
    implemented: false,
  },
];

export default function LearnScreen() {
  const router = useRouter();

  const handlePress = (source: typeof sources[number]) => {
    if (!source.implemented) {
      Alert.alert('準備中', 'この機能はまもなく追加されます');
      return;
    }
    if (source.title === 'メモを入力') {
      router.push('/learn/memo');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>学んだことを追加</Text>
        {sources.map((source) => (
          <TouchableOpacity
            key={source.title}
            style={[styles.card, !source.implemented && styles.cardDisabled]}
            activeOpacity={0.7}
            onPress={() => handlePress(source)}
          >
            <Text style={styles.icon}>{source.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>
                {source.title}{!source.implemented ? '（準備中）' : ''}
              </Text>
              <Text style={styles.cardDescription}>{source.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});
