# Re:Memo — CLAUDE.md

## プロジェクト概要
YouTube・本・メモで学んだことを、AIが忘れる前に聞き返し、声で説明するだけで定着する学習アプリ。

## 技術スタック
- **アプリ:** Expo (SDK 52+) + React Native + TypeScript
- **ルーティング:** Expo Router (file-based)
- **バックエンド:** Supabase (PostgreSQL + Auth + Edge Functions)
- **AI推論:** Gemini 2.5 Flash
- **音声入力:** Deepgram Nova-3
- **状態管理:** Zustand
- **ローカルDB:** expo-sqlite (オフラインキャッシュ)
- **課金:** RevenueCat
- **CI/CD:** GitHub Actions + EAS Build

## ディレクトリ構成
app/          # Expo Router ページ（UIのみ）
components/   # 再利用コンポーネント
lib/          # プラットフォーム非依存ロジック
  srs-engine/    SM-2アルゴリズム
  supabase-client/ 認証・CRUD・RLS
  conversation/  会話セッション管理・プロンプト
  ai-client/     Gemini API呼び出し
  types/         TypeScript型定義
supabase/     # DDL・マイグレーション
docs/         # 設計ドキュメント

## コーディング規約
- TypeScript strict mode
- 関数コンポーネント + Hooks のみ（class禁止）
- lib/ 配下は React Native に依存しない純粋TS
- Supabase RLS は全テーブル必須
- エラーハンドリング：try-catch + ユーザー向けメッセージ
- コメントは日本語OK、変数名・関数名は英語

## テスト方針
- lib/ 配下は Jest でユニットテスト必須
- SRSエンジンは境界値テスト必須（q=0〜5全パターン）
- API呼び出しはモック化

## セキュリティ
- APIキーは .env に格納（.gitignore済み）
- Supabase service_role_key はクライアントに絶対に含めない
- Edge Function経由でのみサーバーサイドキーを使用

## 重要な設計判断
- 声での回答とテキスト回答のポイント消費は同じ1pt（声促進のためコスト差を吸収）
- Free/Liteはテキストチャット復習のみ。声での復習はPro以上
- SRSアルゴリズムはSM-2（乙4マスターから移植）
- オフラインはexpo-sqliteでキャッシュ、オンライン復帰時にSupabase同期
