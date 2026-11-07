# 流水归属 side

| 内部值 | 界面 |
|--------|------|
| `male` | 男方 |
| `female` | 女方 |
| `joint` | 共同 |
| `null` / 空 | 不区分（默认，旧数据） |

SQLite：`transactions.side TEXT`（可空）。迁移：`ALTER TABLE transactions ADD COLUMN side TEXT`，旧行保持 NULL。
