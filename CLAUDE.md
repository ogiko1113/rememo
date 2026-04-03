# Re:Memo — CLAUDE.md

## プロジェクト概要
YouTube・本・メモで学んだことを、AIが忘れる前に聞き返し、声で説明するだけで定着する学習アプリ。

## 技術スタック
- **アプリ:** Expo (SDK 54) + React Native + TypeScript
- **ルーティング:** Expo Router (file-based)
- **バックエンド:** Supabase (PostgreSQL + Auth + Edge Functions)
- **AI推論:** Gemini 2.5 Flash（Supabase Edge Function経由）
- **状態管理:** Zustand
- **ローカルDB:** expo-sqlite (オフラインキャッシュ)
- **課金:** RevenueCat
- **CI/CD:** GitHub Actions + EAS Build

## ディレクトリ構成
app/          # Expo Router ページ（UIのみ、ロジック禁止）
components/   # 再利用コンポーネント（1コンポーネント1ファイル）
lib/          # プラットフォーム非依存ロジック
  srs-engine/    SM-2アルゴリズム
  supabase-client/ 認証・CRUD・RLS
  ai-client/     AI API呼び出し（Edge Function経由）
  learning/      学習イベント保存
  review/        復習セッション
  stores/        Zustand ストア
  types/         TypeScript型定義
supabase/     # DDL・マイグレーション・Edge Functions
docs/         # 設計ドキュメント

## ⚠️ ファイルサイズ制限（厳守）
- 150行以下: OK
- 150〜200行: ⚠️ 次の変更時に分割を検討
- 200〜300行: 🟡 変更前にリファクタリング計画を立てる
- 300行以上: 🔴 先にファイルを分割してから変更する

分割の原則:
- UIコンポーネント → components/ に切り出し
- ビジネスロジック → lib/ のサブモジュールに切り出し
- 1ファイル1責務

## コーディング規約
- TypeScript strict mode（any禁止）
- 関数コンポーネント + Hooks のみ（class禁止）
- lib/ 配下は React Native に依存しない純粋TS
- Supabase RLS は全テーブル必須
- エラーハンドリング：try-catch + ユーザー向けメッセージ

## セキュリティルール（絶対厳守）
- APIキー（Gemini, Deepgram等）はクライアントコードに絶対に含めない
- 外部API呼び出しは必ずSupabase Edge Function経由
- EXPO_PUBLIC_ 接頭辞の環境変数には秘密情報を入れない
- RPC関数は auth.uid() で呼び出し元を必ず検証する

## データ整合性ルール
- 複数テーブルの更新は必ずSupabase RPCで1トランザクションに閉じる
- クライアントから逐次的にDB操作しない
- ポイント消費・XP加算・SRS更新は原子的に処理する

## UIルール
- React Nativeのboolean propsは {true} / {false} で渡す（"true" は禁止）
- 未実装機能はUIに「できそうに見せない」。「準備中」表示にする
- ハードコードの数値は定数（lib/types）から参照する

## テスト方針
- lib/ 配下は Jest でユニットテスト必須
- 結合部のテストを優先（保存失敗時、ポイント不足時、settings不在時）

## 変更前の確認事項（全作業で必ず実行）
1. npx tsc --noEmit
2. npm test
3. 300行超のファイルがないこと
4. grep -rn '="true"\|="false"' app/ が0件
5. grep -rn 'GEMINI_API_KEY\|DEEPGRAM_API_KEY' app/ lib/ が0件（Edge Function内は除く）
