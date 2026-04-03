import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { KeyPoint, KeyPointType } from '../lib/types';

const TYPE_ICONS: Record<KeyPointType, string> = {
  definition: '📖',
  comparison: '⚖️',
  causation: '🔗',
  procedure: '📋',
  exception: '⚠️',
  application: '💡',
};

interface Props {
  item: KeyPoint;
  index: number;
  onDelete: (index: number) => void;
}

export default function KeyPointCard({ item, index, onDelete }: Props) {
  return (
    <View style={styles.kpCard}>
      <View style={styles.kpHeader}>
        <Text style={styles.kpIcon}>{TYPE_ICONS[item.type] ?? '📝'}</Text>
        <View style={styles.kpStars}>
          {Array.from({ length: item.importance }, (_, i) => (
            <Text key={i} style={styles.star}>⭐</Text>
          ))}
        </View>
        <TouchableOpacity onPress={() => onDelete(index)} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.kpContent}>{item.content}</Text>
      <View style={styles.kpTags}>
        {item.keywords.map((kw) => (
          <View key={kw} style={styles.tag}>
            <Text style={styles.tagText}>{kw}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kpCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  kpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  kpStars: {
    flexDirection: 'row',
    flex: 1,
  },
  star: {
    fontSize: 12,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    color: '#64748b',
    fontSize: 16,
  },
  kpContent: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  kpTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#0f172a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: '#6366f1',
    fontSize: 12,
  },
});
