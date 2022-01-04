# CONVENTIONS

## DB 周りの責務

- 粒度の小さい DB 処理: /db/以下
- Deletion や ResourceUpdateTimestamp を更新する: /services/以下
- 入力の validation: /api/\*\*/controller
  - controller は可能な限り薄くする（services を呼び出すラッパーにする）
