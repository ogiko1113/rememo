# /pre-commit — コミット前品質チェック

以下を全て実行し、問題があれば修正してからコミットしてください。

## 1. TypeScript型チェック
npx tsc --noEmit

## 2. テスト実行
npm test

## 3. ファイルサイズチェック
find app/ lib/ components/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 300 {print "🔴 SPLIT REQUIRED:", $2, "(" $1 "lines)"}'
find app/ lib/ components/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 200 && $1 <= 300 {print "🟡 SPLIT RECOMMENDED:", $2, "(" $1 "lines)"}'

## 4. セキュリティチェック
grep -rn 'GEMINI_API_KEY\|DEEPGRAM_API_KEY' app/ lib/ --include="*.ts" --include="*.tsx"
grep -rn '="true"\|="false"' app/ --include="*.tsx"

全てクリアになってからコミットしてください。
