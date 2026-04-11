# Postmortem: Edge Function JWT 検証による 401 障害

## 概要
`gemini-proxy` Edge Function を Supabase にデプロイした直後、クライアントからの呼び出しがすべて `401 Unauthorized` を返し、要点抽出・採点などの AI 機能が全面的に停止した。`supabase functions deploy` の既定で有効な JWT 検証が原因だった。`--no-verify-jwt` を付けて再デプロイしたことで即時復旧した。

## 影響
- **影響範囲**: AI を利用する全機能（要点抽出・採点・YouTube要点抽出）
- **症状**: クライアントで `Edge Function error: ... 401` が発生し、学習登録・復習採点がすべて失敗
- **影響時間**: 初回デプロイ〜再デプロイ完了までの期間
- **データ損失**: なし（Gemini 呼び出し自体が走らなかったため、ポイント消費・SRS 更新も発生していない）

## タイムライン
1. `supabase functions deploy gemini-proxy` 実行、デプロイは成功
2. クライアントから `supabase.functions.invoke('gemini-proxy', …)` を実行
3. 応答が `401 Unauthorized` で失敗。ユーザー影響を検知
4. Edge Function ログを確認し、JWT 検証段階で弾かれていることを特定
5. `supabase functions deploy gemini-proxy --no-verify-jwt` で再デプロイ
6. クライアントから正常に応答が返ることを確認、復旧

## 根本原因
`supabase functions deploy` は既定で `verify_jwt = true` で関数をデプロイする。この設定では Supabase Gateway 層で Authorization ヘッダの JWT を必須かつ検証対象として扱うため、以下のいずれかが成立しないと関数本体へ到達する前に 401 で返される。

- 有効なユーザーセッションの JWT が Authorization ヘッダに付与されている
- もしくは anon key を明示的に Authorization ヘッダで渡している

今回は呼び出し経路上で想定通りの Authorization ヘッダが届いておらず、関数側でリクエストを受け取る前に Gateway で遮断されていた。

## 対応
`--no-verify-jwt` フラグを付けて `gemini-proxy` を再デプロイし、Gateway 層での JWT 検証を無効化することで即座に復旧させた。これにより関数本体に直接リクエストが届くようになった。

## 再発防止
- **CLAUDE.md に必須ルールを追加**: Edge Function をデプロイする際は必ず `--no-verify-jwt` を付けることを「セキュリティルール」セクションに明記した（本 postmortem への参照付き）
- **デプロイ手順の統一**: 今後 Edge Function を追加する場合は `supabase functions deploy <name> --no-verify-jwt` をデプロイコマンドのテンプレートとする
- **レビュー観点**: Edge Function のデプロイを伴う PR では、コマンドに `--no-verify-jwt` が含まれているかを確認する

## リスクと今後の改善点
`--no-verify-jwt` は Gateway 層の JWT 検証を無効化するため、関数 URL を知る第三者は認証なしで直接関数を叩ける状態になる。`gemini-proxy` のような **有料外部 API（Gemini）** を呼ぶ関数では、クォータ／コスト枯渇攻撃の対象となりうる。

この運用上のリスクは承知のうえで、本障害の復旧と再発防止を優先して `--no-verify-jwt` を採用する。ただし以下を残課題とし、将来的に解消する:

- 関数内で `auth.uid()` に相当する独自認可（たとえば Authorization ヘッダから JWT を取り出し、関数側で Supabase Admin API により検証する）を追加する
- レート制限・IP 制限・Origin チェックなど関数内での多層防御を検討する
- Gemini 呼び出しの 1 日あたり使用量上限を関数側で強制し、コスト青天井化を防ぐ

## 学び
- `supabase functions deploy` の既定挙動（`verify_jwt = true`）は十分に明示されておらず、デプロイ直後に 401 で気付くパターンになりやすい
- Gateway 層の JWT 検証は「認証」であって「認可」ではない。JWT 検証を無効化したからといって認可まで放棄してよいわけではなく、関数側で独自の認可を実装する責務が残る
- 運用上のトレードオフ（復旧優先 vs. セキュリティ強度）は postmortem に明示的に残し、残課題として追跡することが重要
