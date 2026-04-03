import { Text, View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
      <Text style={{ color: 'white', fontSize: 24 }}>Re:Memo</Text>
    </View>
  );
}
