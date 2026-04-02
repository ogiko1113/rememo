# Re:Memo PRレビューチェックリスト

## 必須チェック項目（全PR）
- [ ] TypeScript strict modeでエラーなし（`npm run typecheck`）
- [ ] 新規テーブルにRLSポリシーが設定されている
- [ ] try-catch + ユーザー向けエラーメッセージが適切
- [ ] APIキー・シークレットがコードにハードコードされていない
- [ ] 該当するテストが追加/更新されている

## 状況依存チェック
### lib/ 変更時
- [ ] React Native に依存していない純粋TSであること
- [ ] ユニットテストが追加されている
- [ ] 型定義が `lib/types/index.ts` に追加されている

### Supabase変更時
- [ ] マイグレーションファイルが追加されている
- [ ] RLSポリシーが `auth.uid()` ベースであること
- [ ] `service_role_key` がクライアントコードに含まれていない

### AI関連変更時
- [ ] プロンプトが `lib/ai-client/prompts.ts` に集約されている
- [ ] APIエラー時のフォールバックが実装されている
- [ ] トークン使用量の見積もりが妥当

### ポイント消費変更時
- [ ] `consume_points` RPCを使用している
- [ ] ポイント不足時のUI表示がある
- [ ] `POINT_COSTS` 定数との整合性
