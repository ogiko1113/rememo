# Re:Memo アーキテクチャ

## システム構成

```
┌─────────────────────────────────────────┐
│           Expo (React Native)           │
│  app/ ─── UI層（Expo Router）            │
│  components/ ─── 再利用UIコンポーネント    │
│  lib/ ─── プラットフォーム非依存ロジック    │
│    ├── srs-engine/   SM-2アルゴリズム     │
│    ├── ai-client/    Gemini API          │
│    ├── conversation/ 会話セッション管理    │
│    └── supabase-client/ 認証・CRUD       │
└───────────┬───────────┬─────────────────┘
            │           │
    ┌───────▼───┐  ┌────▼──────────────┐
    │  Supabase │  │  External APIs    │
    │  - Auth   │  │  - Gemini 2.5     │
    │  - PgSQL  │  │  - Deepgram Nova  │
    │  - Edge   │  │  - RevenueCat     │
    │  - RLS    │  │                   │
    └───────────┘  └───────────────────┘
```

## データフロー

1. **学習登録**: ユーザー入力 → AI要点抽出 → LearningEvent + LearningUnits + SRSCards 作成
2. **復習**: 期日カード取得 → 質問生成 → 音声/テキスト回答 → AI採点 → SRS更新
3. **ポイント消費**: 操作前にポイント残高チェック → consume_points RPC → トランザクション記録

## オフライン戦略
- expo-sqlite にカード・学習データをキャッシュ
- オフライン時はローカルDBで復習可能
- オンライン復帰時にSupabaseへ同期
