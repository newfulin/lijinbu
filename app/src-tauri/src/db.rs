use chrono::Local;
use dirs;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

const APP_SUPPORT_FOLDER: &str = "com.aicompany.lijinbu";
const DB_FILE: &str = "lijinbu.db";

pub struct DbState(pub Mutex<Connection>);

#[derive(Debug, Serialize, Clone)]
pub struct BookRow {
    pub id: i64,
    pub name: String,
    pub is_archived: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct MemberRow {
    pub id: i64,
    pub book_id: i64,
    pub name: String,
    pub sort: i64,
    pub is_default: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct TagRow {
    pub id: i64,
    pub book_id: i64,
    pub name: String,
    pub is_system: i64,
    pub sort: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct FestivalRow {
    pub id: i64,
    pub book_id: i64,
    pub name: String,
    pub is_builtin: i64,
    pub sort: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct ContactRow {
    pub id: i64,
    pub book_id: i64,
    pub name: String,
    pub name_pinyin: Option<String>,
    pub name_initials: Option<String>,
    pub relation_tag_id: Option<i64>,
    pub relation_name: Option<String>,
    pub note: Option<String>,
    pub location: Option<String>,
    pub is_stopped: i64,
    pub balance_cents: i64,
    pub last_date: Option<String>,
    pub last_amount_cents: Option<i64>,
    pub last_direction: Option<String>,
    pub settled: i64,
}

#[derive(Debug, Deserialize)]
pub struct ContactInput {
    pub book_id: i64,
    pub name: String,
    pub name_pinyin: Option<String>,
    pub name_initials: Option<String>,
    pub relation_tag_id: Option<i64>,
    pub note: Option<String>,
    pub location: Option<String>,
    pub force_new: Option<bool>,
}

#[derive(Debug, Serialize, Clone)]
pub struct PendingRow {
    pub contact_id: i64,
    pub contact_name: String,
    pub balance_cents: i64,
    pub settled: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct RecycleItem {
    pub kind: String,
    pub id: i64,
    pub title: String,
    pub deleted_at: String,
    pub amount_cents: Option<i64>,
}

#[derive(Debug, Serialize, Clone)]
pub struct GlobalHit {
    pub kind: String,
    pub id: i64,
    pub title: String,
    pub subtitle: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ReminderRow {
    pub id: i64,
    pub book_id: i64,
    pub contact_id: Option<i64>,
    pub contact_name: Option<String>,
    pub transaction_id: Option<i64>,
    pub reminder_type: String,
    pub trigger_date: Option<String>,
    pub days_param: Option<i64>,
    pub amount_hint_cents: Option<i64>,
    pub title: Option<String>,
    pub is_important: i64,
    pub is_completed: i64,
    pub completed_at: Option<String>,
    pub snooze_until: Option<String>,
    pub festival_tag_id: Option<i64>,
    pub festival_name: Option<String>,
    pub status: String, // upcoming | overdue | completed
}

#[derive(Debug, Deserialize)]
pub struct ReminderInput {
    pub book_id: i64,
    pub contact_id: Option<i64>,
    pub transaction_id: Option<i64>,
    pub reminder_type: String,
    pub trigger_date: Option<String>,
    pub days_param: Option<i64>,
    pub amount_hint_cents: Option<i64>,
    pub title: Option<String>,
    pub is_important: Option<bool>,
    pub festival_tag_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct StatsQuery {
    pub book_id: i64,
    pub year: i32,
    pub member_id: Option<i64>,
    pub relation_tag_id: Option<i64>,
}

#[derive(Debug, Serialize, Clone)]
pub struct MonthStat {
    pub month: String,
    pub in_cents: i64,
    pub out_cents: i64,
    pub net_cents: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct RelationStat {
    pub relation_name: String,
    pub in_cents: i64,
    pub out_cents: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct StatsTableRow {
    pub label: String,
    pub in_cents: i64,
    pub out_cents: i64,
    pub net_cents: i64,
    pub count: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct StatsResult {
    pub year: i32,
    pub in_cents: i64,
    pub out_cents: i64,
    pub net_cents: i64,
    pub count: i64,
    pub pending_count: i64,
    pub monthly: Vec<MonthStat>,
    pub by_relation: Vec<RelationStat>,
    pub table_rows: Vec<StatsTableRow>,
}

#[derive(Debug, Serialize, Clone)]
pub struct TopContact {
    pub contact_id: i64,
    pub contact_name: String,
    pub amount_cents: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct FestivalDist {
    pub festival_name: String,
    pub count: i64,
    pub amount_cents: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct YearReport {
    pub book_name: String,
    pub year: i32,
    pub generated_at: String,
    pub lunar_note: String,
    pub in_cents: i64,
    pub out_cents: i64,
    pub net_cents: i64,
    pub count: i64,
    pub top_receive: Vec<TopContact>,
    pub top_give: Vec<TopContact>,
    pub top_pending: Vec<TopContact>,
    pub festival_dist: Vec<FestivalDist>,
    pub pending_count: i64,
    pub pending_total_cents: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct TxRow {
    pub id: i64,
    pub book_id: i64,
    pub contact_id: i64,
    pub contact_name: String,
    pub member_id: i64,
    pub member_name: String,
    pub direction: String,
    pub amount_cents: i64,
    pub date_gregorian: String,
    pub event_title: Option<String>,
    pub festival_tag_id: Option<i64>,
    pub festival_name: Option<String>,
    pub note: Option<String>,
    pub payment_method: Option<String>,
    pub gift_note: Option<String>,
    pub relation_tag_id: Option<i64>,
    pub relation_name: Option<String>,
    /// male | female | joint | None(=不区分)
    pub side: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct SummaryCard {
    pub month_in_cents: i64,
    pub month_out_cents: i64,
    pub year_in_cents: i64,
    pub year_out_cents: i64,
    pub total_count: i64,
    pub contact_count: i64,
    pub pending_count: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct BootstrapInfo {
    pub data_dir: String,
    pub db_path: String,
    pub books: Vec<BookRow>,
    pub active_book_id: i64,
    pub default_member_name: String,
    pub settings: serde_json::Map<String, serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct TxInput {
    pub book_id: i64,
    pub contact_id: Option<i64>,
    pub contact_name: String,
    pub relation_tag_id: Option<i64>,
    pub member_id: i64,
    pub direction: String,
    pub amount_cents: i64,
    pub date_gregorian: String,
    pub event_title: Option<String>,
    pub festival_tag_id: Option<i64>,
    pub note: Option<String>,
    pub payment_method: Option<String>,
    pub gift_note: Option<String>,
    pub create_reminder: Option<bool>,
    pub name_pinyin: Option<String>,
    pub name_initials: Option<String>,
    pub force_new_contact: Option<bool>,
    pub side: Option<String>,
}

fn app_data_dir() -> Result<PathBuf, String> {
    let base = dirs::data_dir().ok_or_else(|| "无法解析应用数据目录".to_string())?;
    let dir = base.join(APP_SUPPORT_FOLDER);
    fs::create_dir_all(&dir).map_err(|e| format!("创建数据目录失败: {e}"))?;
    Ok(dir)
}

pub fn db_path() -> Result<PathBuf, String> {
    Ok(app_data_dir()?.join(DB_FILE))
}

pub fn data_dir_string() -> Result<String, String> {
    Ok(app_data_dir()?.to_string_lossy().to_string())
}

pub fn open_connection() -> Result<Connection, String> {
    let path = db_path()?;
    let conn = Connection::open(&path).map_err(|e| format!("打开数据库失败: {e}"))?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| format!("PRAGMA 失败: {e}"))?;
    migrate(&conn)?;
    migrate_columns(&conn)?;
    seed_if_empty(&conn)?;
    ensure_system_relation_tags(&conn)?;
    Ok(conn)
}

fn migrate_columns(conn: &Connection) -> Result<(), String> {
    // 已有库补列：忽略「duplicate column」类错误
    let _ = conn.execute(
        "ALTER TABLE reminders ADD COLUMN festival_tag_id INTEGER",
        [],
    );
    let _ = conn.execute("ALTER TABLE transactions ADD COLUMN side TEXT", []);
    Ok(())
}

/// 规范化归属：male/female/joint，其它视为不区分(None)
fn normalize_side(raw: &Option<String>) -> Option<String> {
    let Some(s) = raw.as_deref().map(str::trim) else {
        return None;
    };
    match s {
        "male" | "男方" | "男" => Some("male".into()),
        "female" | "女方" | "女" => Some("female".into()),
        "joint" | "共同" | "双方" => Some("joint".into()),
        "" | "none" | "不区分" | "-" => None,
        _ => None,
    }
}

fn now_str() -> String {
    Local::now().format("%Y-%m-%d %H:%M:%S").to_string()
}

fn today_str() -> String {
    Local::now().format("%Y-%m-%d").to_string()
}

fn migrate(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          is_archived INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          sort INTEGER NOT NULL DEFAULT 0,
          is_default INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          FOREIGN KEY(book_id) REFERENCES books(id)
        );

        CREATE TABLE IF NOT EXISTS relation_tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          is_system INTEGER NOT NULL DEFAULT 0,
          sort INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY(book_id) REFERENCES books(id)
        );

        CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          name_pinyin TEXT,
          name_initials TEXT,
          relation_tag_id INTEGER,
          note TEXT,
          location TEXT,
          is_stopped INTEGER NOT NULL DEFAULT 0,
          merged_into_id INTEGER,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY(book_id) REFERENCES books(id)
        );

        CREATE TABLE IF NOT EXISTS festival_tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          is_builtin INTEGER NOT NULL DEFAULT 0,
          sort INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY(book_id) REFERENCES books(id)
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          contact_id INTEGER NOT NULL,
          member_id INTEGER NOT NULL,
          direction TEXT NOT NULL CHECK(direction IN ('in','out')),
          amount_cents INTEGER NOT NULL,
          date_gregorian TEXT NOT NULL,
          event_title TEXT,
          festival_tag_id INTEGER,
          note TEXT,
          payment_method TEXT,
          gift_note TEXT,
          side TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY(book_id) REFERENCES books(id),
          FOREIGN KEY(contact_id) REFERENCES contacts(id),
          FOREIGN KEY(member_id) REFERENCES members(id)
        );

        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          contact_id INTEGER,
          transaction_id INTEGER,
          type TEXT NOT NULL,
          trigger_date TEXT,
          days_param INTEGER,
          amount_hint_cents INTEGER,
          title TEXT,
          is_important INTEGER NOT NULL DEFAULT 0,
          is_completed INTEGER NOT NULL DEFAULT 0,
          completed_at TEXT,
          snooze_until TEXT,
          festival_tag_id INTEGER,
          created_at TEXT NOT NULL,
          deleted_at TEXT,
          FOREIGN KEY(book_id) REFERENCES books(id)
        );

        CREATE TABLE IF NOT EXISTS contact_settle_marks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          contact_id INTEGER NOT NULL,
          marked_at TEXT NOT NULL,
          note TEXT,
          baseline_balance_cents INTEGER,
          FOREIGN KEY(book_id) REFERENCES books(id),
          FOREIGN KEY(contact_id) REFERENCES contacts(id)
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value_json TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_tx_book_date
          ON transactions(book_id, date_gregorian);
        CREATE INDEX IF NOT EXISTS idx_tx_book_contact
          ON transactions(book_id, contact_id);
        CREATE INDEX IF NOT EXISTS idx_contacts_initials
          ON contacts(book_id, name_initials);
        CREATE INDEX IF NOT EXISTS idx_contacts_pinyin
          ON contacts(book_id, name_pinyin);
        "#,
    )
    .map_err(|e| format!("迁移失败: {e}"))?;
    ensure_default_settings(conn)?;
    Ok(())
}

/// 已有库补齐缺失默认设置（不覆盖用户已改值）
fn ensure_default_settings(conn: &Connection) -> Result<(), String> {
    let defaults = [
        ("lunar_on", "true"),
        ("reduce_motion", "false"),
        ("experimental_3d_celebrate", "false"),
        ("care_mode_large_text", "false"),
        ("gift_suggest_on", "true"),
        ("recycle_retain_days", "30"),
        ("pin_hash", ""),
        ("pin_salt", ""),
    ];
    for (k, v) in defaults {
        if get_setting(conn, k)?.is_none() {
            set_setting(conn, k, v)?;
        }
    }
    Ok(())
}

fn seed_if_empty(conn: &Connection) -> Result<(), String> {
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM books", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    if count > 0 {
        return Ok(());
    }

    let now = now_str();
    conn.execute(
        "INSERT INTO books (name, created_at, updated_at, is_archived) VALUES (?1, ?2, ?3, 0)",
        params!["我的礼簿", now, now],
    )
    .map_err(|e| e.to_string())?;
    let book_id = conn.last_insert_rowid();
    seed_book_defaults(conn, book_id)?;

    let defaults = [
        ("lunar_on", "true"),
        ("reduce_motion", "false"),
        ("experimental_3d_celebrate", "false"),
        ("care_mode_large_text", "false"),
        ("gift_suggest_on", "true"),
        ("recycle_retain_days", "30"),
        ("active_book_id", &book_id.to_string()),
    ];
    for (k, v) in defaults {
        set_setting(conn, k, v)?;
    }
    Ok(())
}

const SYSTEM_RELATIONS: &[&str] = &[
    "亲戚", "朋友", "同事", "同学", "邻居", "客户", "其他",
];

/// 旧库补齐系统关系标签（幂等）；自定义标签不受影响。
fn ensure_system_relation_tags(conn: &Connection) -> Result<(), String> {
    let book_ids: Vec<i64> = {
        let mut stmt = conn
            .prepare("SELECT id FROM books")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |r| r.get(0))
            .map_err(|e| e.to_string())?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?
    };
    for book_id in book_ids {
        for (i, name) in SYSTEM_RELATIONS.iter().enumerate() {
            let exists: Option<i64> = conn
                .query_row(
                    "SELECT id FROM relation_tags WHERE book_id=?1 AND name=?2",
                    params![book_id, *name],
                    |r| r.get(0),
                )
                .optional()
                .map_err(|e| e.to_string())?;
            if exists.is_none() {
                conn.execute(
                    "INSERT INTO relation_tags (book_id, name, is_system, sort) VALUES (?1, ?2, 1, ?3)",
                    params![book_id, *name, i as i64],
                )
                .map_err(|e| e.to_string())?;
            } else if let Some(id) = exists {
                // 标记为系统并校正排序，不改名
                conn.execute(
                    "UPDATE relation_tags SET is_system=1, sort=?1 WHERE id=?2",
                    params![i as i64, id],
                )
                .map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}

fn seed_book_defaults(conn: &Connection, book_id: i64) -> Result<(), String> {
    let now = now_str();
    conn.execute(
        "INSERT INTO members (book_id, name, sort, is_default, created_at) VALUES (?1, ?2, 0, 1, ?3)",
        params![book_id, "我", now],
    )
    .map_err(|e| e.to_string())?;

    for (i, name) in SYSTEM_RELATIONS.iter().enumerate() {
        conn.execute(
            "INSERT INTO relation_tags (book_id, name, is_system, sort) VALUES (?1, ?2, 1, ?3)",
            params![book_id, *name, i as i64],
        )
        .map_err(|e| e.to_string())?;
    }

    let festivals = [
        "春节", "元宵", "清明", "端午", "中秋", "结婚", "满月", "乔迁", "白事", "生日", "其他",
    ];
    for (i, name) in festivals.iter().enumerate() {
        conn.execute(
            "INSERT INTO festival_tags (book_id, name, is_builtin, sort) VALUES (?1, ?2, 1, ?3)",
            params![book_id, name, i as i64],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn set_setting(conn: &Connection, key: &str, value_json: &str) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value_json) VALUES (?1, ?2)",
        params![key, value_json],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    conn.query_row(
        "SELECT value_json FROM settings WHERE key = ?1",
        params![key],
        |r| r.get(0),
    )
    .optional()
    .map_err(|e| e.to_string())
}

pub fn all_settings(conn: &Connection) -> Result<serde_json::Map<String, serde_json::Value>, String> {
    let mut stmt = conn
        .prepare("SELECT key, value_json FROM settings")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
        .map_err(|e| e.to_string())?;
    let mut map = serde_json::Map::new();
    for row in rows {
        let (k, v) = row.map_err(|e| e.to_string())?;
        let parsed = serde_json::from_str(&v).unwrap_or(serde_json::Value::String(v));
        map.insert(k, parsed);
    }
    Ok(map)
}

pub fn list_books(conn: &Connection) -> Result<Vec<BookRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, is_archived FROM books WHERE is_archived = 0 ORDER BY id ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| {
            Ok(BookRow {
                id: r.get(0)?,
                name: r.get(1)?,
                is_archived: r.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

fn active_book_id(conn: &Connection) -> Result<i64, String> {
    if let Some(v) = get_setting(conn, "active_book_id")? {
        if let Ok(id) = v.trim_matches('"').parse::<i64>() {
            let exists: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM books WHERE id = ?1 AND is_archived = 0",
                    params![id],
                    |r| r.get(0),
                )
                .unwrap_or(0);
            if exists > 0 {
                return Ok(id);
            }
        }
    }
    let books = list_books(conn)?;
    books
        .first()
        .map(|b| b.id)
        .ok_or_else(|| "没有可用账本".into())
}

pub fn bootstrap(conn: &Connection) -> Result<BootstrapInfo, String> {
    let books = list_books(conn)?;
    if books.is_empty() {
        return Err("没有可用账本".into());
    }
    let active = active_book_id(conn)?;
    let member_name: String = conn
        .query_row(
            "SELECT name FROM members WHERE book_id = ?1 AND is_default = 1 LIMIT 1",
            params![active],
            |r| r.get(0),
        )
        .unwrap_or_else(|_| "我".into());
    Ok(BootstrapInfo {
        data_dir: data_dir_string()?,
        db_path: db_path()?.to_string_lossy().to_string(),
        books,
        active_book_id: active,
        default_member_name: member_name,
        settings: all_settings(conn)?,
    })
}

pub fn create_book(conn: &Connection, name: &str) -> Result<BookRow, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("账本名称必填".into());
    }
    let now = now_str();
    conn.execute(
        "INSERT INTO books (name, created_at, updated_at, is_archived) VALUES (?1, ?2, ?3, 0)",
        params![name, now, now],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    seed_book_defaults(conn, id)?;
    Ok(BookRow {
        id,
        name: name.to_string(),
        is_archived: 0,
    })
}

pub fn rename_book(conn: &Connection, id: i64, name: &str) -> Result<(), String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("账本名称必填".into());
    }
    let n = conn
        .execute(
            "UPDATE books SET name = ?1, updated_at = ?2 WHERE id = ?3 AND is_archived = 0",
            params![name, now_str(), id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("账本不存在".into());
    }
    Ok(())
}

pub fn delete_book(conn: &Connection, id: i64) -> Result<(), String> {
    let count = list_books(conn)?.len();
    if count <= 1 {
        return Err("至少保留 1 本账本".into());
    }
    conn.execute(
        "UPDATE books SET is_archived = 1, updated_at = ?1 WHERE id = ?2",
        params![now_str(), id],
    )
    .map_err(|e| e.to_string())?;
    let active = active_book_id(conn)?;
    if active == id {
        let next = list_books(conn)?
            .into_iter()
            .next()
            .ok_or_else(|| "没有可用账本".to_string())?;
        set_setting(conn, "active_book_id", &next.id.to_string())?;
    }
    Ok(())
}

pub fn set_active_book(conn: &Connection, id: i64) -> Result<(), String> {
    let exists: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM books WHERE id = ?1 AND is_archived = 0",
            params![id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if exists == 0 {
        return Err("账本不存在".into());
    }
    set_setting(conn, "active_book_id", &id.to_string())
}

pub fn list_members(conn: &Connection, book_id: i64) -> Result<Vec<MemberRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, book_id, name, sort, is_default FROM members WHERE book_id = ?1 ORDER BY sort, id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![book_id], |r| {
            Ok(MemberRow {
                id: r.get(0)?,
                book_id: r.get(1)?,
                name: r.get(2)?,
                sort: r.get(3)?,
                is_default: r.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

pub fn create_member(conn: &Connection, book_id: i64, name: &str) -> Result<MemberRow, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("成员名称必填".into());
    }
    conn.execute(
        "INSERT INTO members (book_id, name, sort, is_default, created_at) VALUES (?1, ?2, 100, 0, ?3)",
        params![book_id, name, now_str()],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    Ok(MemberRow {
        id,
        book_id,
        name: name.to_string(),
        sort: 100,
        is_default: 0,
    })
}

pub fn rename_member(conn: &Connection, id: i64, name: &str) -> Result<(), String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("成员名称必填".into());
    }
    let n = conn
        .execute("UPDATE members SET name = ?1 WHERE id = ?2", params![name, id])
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("成员不存在".into());
    }
    Ok(())
}

pub fn delete_member(conn: &Connection, id: i64) -> Result<(), String> {
    let is_default: i64 = conn
        .query_row(
            "SELECT is_default FROM members WHERE id = ?1",
            params![id],
            |r| r.get(0),
        )
        .map_err(|_| "成员不存在".to_string())?;
    if is_default == 1 {
        return Err("默认成员「我」不可删除".into());
    }
    let tx_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM transactions WHERE member_id = ?1 AND deleted_at IS NULL",
            params![id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if tx_count > 0 {
        return Err(format!("该成员有 {tx_count} 笔流水，无法删除"));
    }
    conn.execute("DELETE FROM members WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_relation_tags(conn: &Connection, book_id: i64) -> Result<Vec<TagRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, book_id, name, is_system, sort FROM relation_tags WHERE book_id = ?1 ORDER BY sort, id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![book_id], |r| {
            Ok(TagRow {
                id: r.get(0)?,
                book_id: r.get(1)?,
                name: r.get(2)?,
                is_system: r.get(3)?,
                sort: r.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

pub fn create_relation_tag(conn: &Connection, book_id: i64, name: &str) -> Result<TagRow, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("标签名称必填".into());
    }
    let existing: Option<TagRow> = conn
        .query_row(
            "SELECT id, book_id, name, is_system, sort FROM relation_tags WHERE book_id=?1 AND name=?2",
            params![book_id, name],
            |r| {
                Ok(TagRow {
                    id: r.get(0)?,
                    book_id: r.get(1)?,
                    name: r.get(2)?,
                    is_system: r.get(3)?,
                    sort: r.get(4)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;
    if let Some(row) = existing {
        return Ok(row);
    }
    conn.execute(
        "INSERT INTO relation_tags (book_id, name, is_system, sort) VALUES (?1, ?2, 0, 50)",
        params![book_id, name],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    Ok(TagRow {
        id,
        book_id,
        name: name.to_string(),
        is_system: 0,
        sort: 50,
    })

}

pub fn list_festival_tags(conn: &Connection, book_id: i64) -> Result<Vec<FestivalRow>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, book_id, name, is_builtin, sort FROM festival_tags WHERE book_id = ?1 ORDER BY sort, id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![book_id], |r| {
            Ok(FestivalRow {
                id: r.get(0)?,
                book_id: r.get(1)?,
                name: r.get(2)?,
                is_builtin: r.get(3)?,
                sort: r.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}


fn contact_balance(conn: &Connection, book_id: i64, contact_id: i64) -> Result<i64, String> {
    conn.query_row(
        r#"
        SELECT IFNULL(SUM(CASE WHEN direction='in' THEN amount_cents ELSE 0 END),0) -
               IFNULL(SUM(CASE WHEN direction='out' THEN amount_cents ELSE 0 END),0)
        FROM transactions
        WHERE book_id=?1 AND contact_id=?2 AND deleted_at IS NULL
        "#,
        params![book_id, contact_id],
        |r| r.get(0),
    )
    .map_err(|e| e.to_string())
}

fn is_settled(conn: &Connection, book_id: i64, contact_id: i64) -> Result<bool, String> {
    let n: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM contact_settle_marks WHERE book_id=?1 AND contact_id=?2",
            params![book_id, contact_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    Ok(n > 0)
}

fn map_contact_row(
    conn: &Connection,
    id: i64,
    book_id: i64,
    name: String,
    name_pinyin: Option<String>,
    name_initials: Option<String>,
    relation_tag_id: Option<i64>,
    relation_name: Option<String>,
    note: Option<String>,
    location: Option<String>,
    is_stopped: i64,
) -> Result<ContactRow, String> {
    let balance_cents = contact_balance(conn, book_id, id)?;
    let settled = if is_settled(conn, book_id, id)? { 1 } else { 0 };
    let last: Option<(String, i64, String)> = conn
        .query_row(
            r#"
            SELECT date_gregorian, amount_cents, direction FROM transactions
            WHERE book_id=?1 AND contact_id=?2 AND deleted_at IS NULL
            ORDER BY date_gregorian DESC, id DESC LIMIT 1
            "#,
            params![book_id, id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(ContactRow {
        id,
        book_id,
        name,
        name_pinyin,
        name_initials,
        relation_tag_id,
        relation_name,
        note,
        location,
        is_stopped,
        balance_cents,
        last_date: last.as_ref().map(|x| x.0.clone()),
        last_amount_cents: last.as_ref().map(|x| x.1),
        last_direction: last.map(|x| x.2),
        settled,
    })
}

/// tab: all | frequent | balance | stopped
pub fn list_contacts(
    conn: &Connection,
    book_id: i64,
    tab: &str,
    q: &str,
) -> Result<Vec<ContactRow>, String> {
    let q = q.trim();
    let like = format!("%{q}%");
    let stopped_only = tab == "stopped";
    let mut stmt = conn
        .prepare(
            r#"
            SELECT c.id, c.book_id, c.name, c.name_pinyin, c.name_initials,
                   c.relation_tag_id, r.name, c.note, c.location, c.is_stopped
            FROM contacts c
            LEFT JOIN relation_tags r ON r.id = c.relation_tag_id
            WHERE c.book_id = ?1
              AND c.deleted_at IS NULL
              AND c.merged_into_id IS NULL
              AND (
                (?2 = 1 AND c.is_stopped = 1) OR
                (?2 = 0 AND c.is_stopped = 0)
              )
              AND (?3 = '' OR c.name LIKE ?4 OR IFNULL(c.name_pinyin,'') LIKE ?4 OR IFNULL(c.name_initials,'') LIKE ?4)
            ORDER BY c.id DESC
            "#,
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(
            params![book_id, if stopped_only { 1 } else { 0 }, q, like],
            |r| {
                Ok((
                    r.get::<_, i64>(0)?,
                    r.get::<_, i64>(1)?,
                    r.get::<_, String>(2)?,
                    r.get::<_, Option<String>>(3)?,
                    r.get::<_, Option<String>>(4)?,
                    r.get::<_, Option<i64>>(5)?,
                    r.get::<_, Option<String>>(6)?,
                    r.get::<_, Option<String>>(7)?,
                    r.get::<_, Option<String>>(8)?,
                    r.get::<_, i64>(9)?,
                ))
            },
        )
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        let (id, bid, name, py, ini, rtid, rname, note, loc, stopped) =
            row.map_err(|e| e.to_string())?;
        let mapped = map_contact_row(
            conn, id, bid, name, py, ini, rtid, rname, note, loc, stopped,
        )?;
        let keep = match tab {
            "frequent" => mapped.last_date.is_some(),
            "balance" => mapped.balance_cents != 0,
            _ => true,
        };
        if keep {
            out.push(mapped);
        }
    }
    Ok(out)
}

pub fn search_contacts(
    conn: &Connection,
    book_id: i64,
    q: &str,
) -> Result<Vec<ContactRow>, String> {
    Ok(list_contacts(conn, book_id, "all", q)?
        .into_iter()
        .filter(|c| c.is_stopped == 0)
        .take(30)
        .collect())
}

pub fn find_same_name(
    conn: &Connection,
    book_id: i64,
    name: &str,
) -> Result<Vec<ContactRow>, String> {
    let name = name.trim();
    if name.is_empty() {
        return Ok(vec![]);
    }
    Ok(list_contacts(conn, book_id, "all", "")?
        .into_iter()
        .filter(|c| c.name == name && c.is_stopped == 0)
        .collect())
}

fn ensure_contact(
    conn: &Connection,
    book_id: i64,
    contact_id: Option<i64>,
    name: &str,
    relation_tag_id: Option<i64>,
    name_pinyin: Option<&str>,
    name_initials: Option<&str>,
    force_new: bool,
) -> Result<i64, String> {
    if let Some(id) = contact_id {
        return Ok(id);
    }
    let name = name.trim();
    if name.is_empty() {
        return Err("联系人必填".into());
    }
    if !force_new {
        let existing: Option<i64> = conn
            .query_row(
                r#"
                SELECT id FROM contacts
                WHERE book_id = ?1 AND name = ?2 AND deleted_at IS NULL AND is_stopped = 0
                  AND merged_into_id IS NULL
                ORDER BY id ASC LIMIT 1
                "#,
                params![book_id, name],
                |r| r.get(0),
            )
            .optional()
            .map_err(|e| e.to_string())?;
        if let Some(id) = existing {
            return Ok(id);
        }
    }
    let now = now_str();
    conn.execute(
        r#"
        INSERT INTO contacts (
          book_id, name, name_pinyin, name_initials, relation_tag_id,
          is_stopped, created_at, updated_at
        ) VALUES (?1,?2,?3,?4,?5,0,?6,?7)
        "#,
        params![
            book_id,
            name,
            name_pinyin,
            name_initials,
            relation_tag_id,
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

pub fn list_transactions(
    conn: &Connection,
    book_id: i64,
    direction: Option<String>,
    q: Option<String>,
    festival_tag_id: Option<i64>,
    side: Option<String>,
) -> Result<Vec<TxRow>, String> {
    let dir = direction.unwrap_or_default();
    let q = q.unwrap_or_default();
    let like = format!("%{q}%");
    let fest = festival_tag_id.unwrap_or(0);
    let side_f = side.unwrap_or_default();
    let mut stmt = conn
        .prepare(
            r#"
            SELECT
              t.id, t.book_id, t.contact_id, c.name,
              t.member_id, m.name,
              t.direction, t.amount_cents, t.date_gregorian,
              t.event_title, t.festival_tag_id, f.name,
              t.note, t.payment_method, t.gift_note, c.relation_tag_id,
              r.name, t.side
            FROM transactions t
            JOIN contacts c ON c.id = t.contact_id
            JOIN members m ON m.id = t.member_id
            LEFT JOIN festival_tags f ON f.id = t.festival_tag_id
            LEFT JOIN relation_tags r ON r.id = c.relation_tag_id
            WHERE t.book_id = ?1
              AND t.deleted_at IS NULL
              AND (?2 = '' OR t.direction = ?2)
              AND (?3 = '' OR c.name LIKE ?4 OR IFNULL(t.event_title,'') LIKE ?4 OR IFNULL(t.note,'') LIKE ?4 OR IFNULL(f.name,'') LIKE ?4)
              AND (?5 = 0 OR t.festival_tag_id = ?5)
              AND (
                ?6 = ''
                OR (?6 = 'none' AND (t.side IS NULL OR t.side = ''))
                OR t.side = ?6
              )
            ORDER BY t.date_gregorian DESC, t.id DESC
            LIMIT 500
            "#,
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![book_id, dir, q, like, fest, side_f], |r| {
            Ok(TxRow {
                id: r.get(0)?,
                book_id: r.get(1)?,
                contact_id: r.get(2)?,
                contact_name: r.get(3)?,
                member_id: r.get(4)?,
                member_name: r.get(5)?,
                direction: r.get(6)?,
                amount_cents: r.get(7)?,
                date_gregorian: r.get(8)?,
                event_title: r.get(9)?,
                festival_tag_id: r.get(10)?,
                festival_name: r.get(11)?,
                note: r.get(12)?,
                payment_method: r.get(13)?,
                gift_note: r.get(14)?,
                relation_tag_id: r.get(15)?,
                relation_name: r.get(16)?,
                side: r.get(17)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

pub fn create_transaction(conn: &Connection, input: TxInput) -> Result<TxRow, String> {
    if input.amount_cents <= 0 {
        return Err("金额必须大于 0".into());
    }
    if input.direction != "in" && input.direction != "out" {
        return Err("类型无效".into());
    }
    let contact_id = ensure_contact(
        conn,
        input.book_id,
        input.contact_id,
        &input.contact_name,
        input.relation_tag_id,
        input.name_pinyin.as_deref(),
        input.name_initials.as_deref(),
        input.force_new_contact.unwrap_or(false),
    )?;
    if let Some(tag_id) = input.relation_tag_id {
        conn.execute(
            "UPDATE contacts SET relation_tag_id = ?1, updated_at = ?2 WHERE id = ?3",
            params![tag_id, now_str(), contact_id],
        )
        .ok();
    }
    let now = now_str();
    conn.execute(
        r#"
        INSERT INTO transactions (
          book_id, contact_id, member_id, direction, amount_cents, date_gregorian,
          event_title, festival_tag_id, note, payment_method, gift_note, side, created_at, updated_at
        ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)
        "#,
        params![
            input.book_id,
            contact_id,
            input.member_id,
            input.direction,
            input.amount_cents,
            input.date_gregorian,
            input.event_title,
            input.festival_tag_id,
            input.note,
            input.payment_method,
            input.gift_note,
            normalize_side(&input.side),
            now,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();

    if input.create_reminder.unwrap_or(false) {
        let title = format!("还礼提醒 · {}", input.contact_name.trim());
        let days = 30_i64;
        let trigger = add_days(&input.date_gregorian, days).unwrap_or_else(|_| today_str());
        conn.execute(
            r#"
            INSERT INTO reminders (
              book_id, contact_id, transaction_id, type, trigger_date, days_param, title,
              is_important, is_completed, created_at
            ) VALUES (?1,?2,?3,'after_receive_days',?4,?5,?6,0,0,?7)
            "#,
            params![input.book_id, contact_id, id, trigger, days, title, now],
        )
        .map_err(|e| e.to_string())?;
    }

    list_transactions(conn, input.book_id, None, None, None, None)?
        .into_iter()
        .find(|t| t.id == id)
        .ok_or_else(|| "保存成功但读取失败".into())
}

pub fn update_transaction(conn: &Connection, id: i64, input: TxInput) -> Result<TxRow, String> {
    if input.amount_cents <= 0 {
        return Err("金额必须大于 0".into());
    }
    let contact_id = ensure_contact(
        conn,
        input.book_id,
        input.contact_id,
        &input.contact_name,
        input.relation_tag_id,
        input.name_pinyin.as_deref(),
        input.name_initials.as_deref(),
        input.force_new_contact.unwrap_or(false),
    )?;
    let n = conn
        .execute(
            r#"
            UPDATE transactions SET
              contact_id=?1, member_id=?2, direction=?3, amount_cents=?4, date_gregorian=?5,
              event_title=?6, festival_tag_id=?7, note=?8, payment_method=?9, gift_note=?10,
              side=?11, updated_at=?12
            WHERE id=?13 AND book_id=?14 AND deleted_at IS NULL
            "#,
            params![
                contact_id,
                input.member_id,
                input.direction,
                input.amount_cents,
                input.date_gregorian,
                input.event_title,
                input.festival_tag_id,
                input.note,
                input.payment_method,
                input.gift_note,
                normalize_side(&input.side),
                now_str(),
                id,
                input.book_id
            ],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("流水不存在".into());
    }
    list_transactions(conn, input.book_id, None, None, None, None)?
        .into_iter()
        .find(|t| t.id == id)
        .ok_or_else(|| "更新成功但读取失败".into())
}

pub fn soft_delete_transaction(conn: &Connection, id: i64) -> Result<(), String> {
    let n = conn
        .execute(
            "UPDATE transactions SET deleted_at = ?1, updated_at = ?1 WHERE id = ?2 AND deleted_at IS NULL",
            params![now_str(), id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("流水不存在或已删除".into());
    }
    Ok(())
}

pub fn get_summary(conn: &Connection, book_id: i64) -> Result<SummaryCard, String> {
    let now = Local::now();
    let month_prefix = now.format("%Y-%m").to_string();
    let year_prefix = now.format("%Y").to_string();

    let sum_dir = |prefix: &str, direction: &str| -> Result<i64, String> {
        conn.query_row(
            r#"
            SELECT IFNULL(SUM(amount_cents),0) FROM transactions
            WHERE book_id = ?1 AND deleted_at IS NULL AND direction = ?2
              AND date_gregorian LIKE ?3
            "#,
            params![book_id, direction, format!("{prefix}%")],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())
    };

    let total_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM transactions WHERE book_id=?1 AND deleted_at IS NULL",
            params![book_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let contact_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM contacts WHERE book_id=?1 AND deleted_at IS NULL",
            params![book_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let pending_count = list_pending(conn, book_id, false)?.len() as i64;

    Ok(SummaryCard {
        month_in_cents: sum_dir(&month_prefix, "in")?,
        month_out_cents: sum_dir(&month_prefix, "out")?,
        year_in_cents: sum_dir(&year_prefix, "in")?,
        year_out_cents: sum_dir(&year_prefix, "out")?,
        total_count,
        contact_count,
        pending_count,
    })
}

pub fn list_pending(
    conn: &Connection,
    book_id: i64,
    include_settled: bool,
) -> Result<Vec<PendingRow>, String> {
    let contacts = list_contacts(conn, book_id, "all", "")?;
    let mut out = Vec::new();
    for c in contacts {
        if c.balance_cents <= 0 {
            continue;
        }
        let settled = c.settled == 1;
        if settled && !include_settled {
            continue;
        }
        out.push(PendingRow {
            contact_id: c.id,
            contact_name: c.name,
            balance_cents: c.balance_cents,
            settled,
        });
    }
    out.sort_by(|a, b| b.balance_cents.cmp(&a.balance_cents));
    Ok(out)
}

pub fn settle_contact(conn: &Connection, book_id: i64, contact_id: i64) -> Result<(), String> {
    if is_settled(conn, book_id, contact_id)? {
        return Ok(());
    }
    let bal = contact_balance(conn, book_id, contact_id)?;
    conn.execute(
        "INSERT INTO contact_settle_marks (book_id, contact_id, marked_at, baseline_balance_cents) VALUES (?1,?2,?3,?4)",
        params![book_id, contact_id, now_str(), bal],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn unsettle_contact(conn: &Connection, book_id: i64, contact_id: i64) -> Result<(), String> {
    conn.execute(
        "DELETE FROM contact_settle_marks WHERE book_id=?1 AND contact_id=?2",
        params![book_id, contact_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn create_contact(conn: &Connection, input: ContactInput) -> Result<ContactRow, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("联系人姓名必填".into());
    }
    if !input.force_new.unwrap_or(false) {
        let same = find_same_name(conn, input.book_id, name)?;
        if !same.is_empty() {
            return Err("DUPLICATE_NAME".into());
        }
    }
    let id = ensure_contact(
        conn,
        input.book_id,
        None,
        name,
        input.relation_tag_id,
        input.name_pinyin.as_deref(),
        input.name_initials.as_deref(),
        true,
    )?;
    if input.note.is_some() || input.location.is_some() {
        conn.execute(
            "UPDATE contacts SET note=?1, location=?2, updated_at=?3 WHERE id=?4",
            params![input.note, input.location, now_str(), id],
        )
        .map_err(|e| e.to_string())?;
    }
    list_contacts(conn, input.book_id, "all", "")?
        .into_iter()
        .find(|c| c.id == id)
        .ok_or_else(|| "创建成功但读取失败".into())
}

pub fn update_contact(
    conn: &Connection,
    id: i64,
    input: ContactInput,
) -> Result<ContactRow, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("联系人姓名必填".into());
    }
    let n = conn
        .execute(
            r#"
            UPDATE contacts SET
              name=?1, name_pinyin=?2, name_initials=?3, relation_tag_id=?4,
              note=?5, location=?6, updated_at=?7
            WHERE id=?8 AND book_id=?9 AND deleted_at IS NULL
            "#,
            params![
                name,
                input.name_pinyin,
                input.name_initials,
                input.relation_tag_id,
                input.note,
                input.location,
                now_str(),
                id,
                input.book_id
            ],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("联系人不存在".into());
    }
    list_contacts(conn, input.book_id, "all", "")?
        .into_iter()
        .find(|c| c.id == id)
        .or_else(|| {
            list_contacts(conn, input.book_id, "stopped", "")
                .ok()
                .and_then(|v| v.into_iter().find(|c| c.id == id))
        })
        .ok_or_else(|| "更新成功但读取失败".into())
}

pub fn set_contact_stopped(conn: &Connection, id: i64, stopped: bool) -> Result<(), String> {
    let n = conn
        .execute(
            "UPDATE contacts SET is_stopped=?1, updated_at=?2 WHERE id=?3 AND deleted_at IS NULL",
            params![if stopped { 1 } else { 0 }, now_str(), id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("联系人不存在".into());
    }
    Ok(())
}

pub fn soft_delete_contact(conn: &Connection, id: i64) -> Result<(), String> {
    let open_tx: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM transactions WHERE contact_id=?1 AND deleted_at IS NULL",
            params![id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if open_tx > 0 {
        return Err(format!("该联系人还有 {open_tx} 笔未删流水，请先处理流水或合并"));
    }
    let n = conn
        .execute(
            "UPDATE contacts SET deleted_at=?1, updated_at=?1 WHERE id=?2 AND deleted_at IS NULL",
            params![now_str(), id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("联系人不存在或已删除".into());
    }
    Ok(())
}

pub fn merge_contacts(
    conn: &Connection,
    book_id: i64,
    keep_id: i64,
    merge_id: i64,
) -> Result<(), String> {
    if keep_id == merge_id {
        return Err("不能与自己合并".into());
    }
    conn.execute(
        "UPDATE transactions SET contact_id=?1 WHERE book_id=?2 AND contact_id=?3",
        params![keep_id, book_id, merge_id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE reminders SET contact_id=?1 WHERE book_id=?2 AND contact_id=?3",
        params![keep_id, book_id, merge_id],
    )
    .ok();
    conn.execute(
        "DELETE FROM contact_settle_marks WHERE book_id=?1 AND contact_id=?2",
        params![book_id, merge_id],
    )
    .ok();
    conn.execute(
        "UPDATE contacts SET merged_into_id=?1, deleted_at=?2, updated_at=?2 WHERE id=?3 AND book_id=?4",
        params![keep_id, now_str(), merge_id, book_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_recycle(conn: &Connection, book_id: i64) -> Result<Vec<RecycleItem>, String> {
    let mut out = Vec::new();
    let mut stx = conn
        .prepare(
            r#"
            SELECT t.id, IFNULL(c.name,'?') || ' · ' || IFNULL(t.event_title,''), t.deleted_at, t.amount_cents
            FROM transactions t
            LEFT JOIN contacts c ON c.id = t.contact_id
            WHERE t.book_id=?1 AND t.deleted_at IS NOT NULL
            ORDER BY t.deleted_at DESC
            "#,
        )
        .map_err(|e| e.to_string())?;
    for row in stx
        .query_map(params![book_id], |r| {
            Ok(RecycleItem {
                kind: "transaction".into(),
                id: r.get(0)?,
                title: r.get(1)?,
                deleted_at: r.get(2)?,
                amount_cents: r.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
    {
        out.push(row.map_err(|e| e.to_string())?);
    }
    let mut sc = conn
        .prepare(
            r#"
            SELECT id, name, deleted_at FROM contacts
            WHERE book_id=?1 AND deleted_at IS NOT NULL
            ORDER BY deleted_at DESC
            "#,
        )
        .map_err(|e| e.to_string())?;
    for row in sc
        .query_map(params![book_id], |r| {
            Ok(RecycleItem {
                kind: "contact".into(),
                id: r.get(0)?,
                title: r.get(1)?,
                deleted_at: r.get(2)?,
                amount_cents: None,
            })
        })
        .map_err(|e| e.to_string())?
    {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

pub fn restore_recycle(conn: &Connection, kind: &str, id: i64) -> Result<(), String> {
    let n = match kind {
        "transaction" => conn
            .execute(
                "UPDATE transactions SET deleted_at=NULL, updated_at=?1 WHERE id=?2",
                params![now_str(), id],
            )
            .map_err(|e| e.to_string())?,
        "contact" => conn
            .execute(
                "UPDATE contacts SET deleted_at=NULL, updated_at=?1 WHERE id=?2",
                params![now_str(), id],
            )
            .map_err(|e| e.to_string())?,
        _ => return Err("未知类型".into()),
    };
    if n == 0 {
        return Err("记录不存在".into());
    }
    Ok(())
}

pub fn purge_recycle(conn: &Connection, kind: &str, id: i64) -> Result<(), String> {
    let n = match kind {
        "transaction" => conn
            .execute("DELETE FROM transactions WHERE id=?1 AND deleted_at IS NOT NULL", params![id])
            .map_err(|e| e.to_string())?,
        "contact" => conn
            .execute("DELETE FROM contacts WHERE id=?1 AND deleted_at IS NOT NULL", params![id])
            .map_err(|e| e.to_string())?,
        _ => return Err("未知类型".into()),
    };
    if n == 0 {
        return Err("记录不存在".into());
    }
    Ok(())
}

/// 按保留天数永久清理过期回收站项。days<=0 表示不自动清理。
pub fn purge_expired_recycle(conn: &Connection, days: i64) -> Result<i64, String> {
    if days <= 0 {
        return Ok(0);
    }
    let cutoff = Local::now() - chrono::Duration::days(days);
    let cutoff_s = cutoff.format("%Y-%m-%d %H:%M:%S").to_string();
    let n1 = conn
        .execute(
            "DELETE FROM transactions WHERE deleted_at IS NOT NULL AND deleted_at < ?1",
            params![cutoff_s],
        )
        .map_err(|e| e.to_string())? as i64;
    let n2 = conn
        .execute(
            "DELETE FROM contacts WHERE deleted_at IS NOT NULL AND deleted_at < ?1",
            params![cutoff_s],
        )
        .map_err(|e| e.to_string())? as i64;
    Ok(n1 + n2)
}

pub fn global_search(
    conn: &Connection,
    book_id: i64,
    q: &str,
) -> Result<Vec<GlobalHit>, String> {
    let q = q.trim();
    if q.is_empty() {
        return Ok(vec![]);
    }
    let mut out = Vec::new();
    for c in search_contacts(conn, book_id, q)? {
        out.push(GlobalHit {
            kind: "contact".into(),
            id: c.id,
            title: c.name,
            subtitle: format!("余额 {}", c.balance_cents as f64 / 100.0),
        });
    }
    for t in list_transactions(conn, book_id, None, Some(q.to_string()), None, None)? {
        out.push(GlobalHit {
            kind: "transaction".into(),
            id: t.id,
            title: format!("{} · {}", t.contact_name, t.event_title.clone().unwrap_or_default()),
            subtitle: t.date_gregorian,
        });
    }
    Ok(out.into_iter().take(40).collect())
}

fn add_days(date: &str, days: i64) -> Result<String, String> {
    use chrono::NaiveDate;
    let d = NaiveDate::parse_from_str(date, "%Y-%m-%d").map_err(|e| e.to_string())?;
    let next = d
        .checked_add_signed(chrono::Duration::days(days))
        .ok_or_else(|| "日期溢出".to_string())?;
    Ok(next.format("%Y-%m-%d").to_string())
}

fn reminder_status(trigger: &Option<String>, snooze: &Option<String>, completed: i64) -> String {
    if completed == 1 {
        return "completed".into();
    }
    let today = today_str();
    let effective = match (trigger.as_deref(), snooze.as_deref()) {
        (Some(t), Some(s)) if s > t => s,
        (Some(t), _) => t,
        (None, Some(s)) => s,
        _ => return "upcoming".into(),
    };
    if effective < today.as_str() {
        "overdue".into()
    } else {
        "upcoming".into()
    }
}

pub fn list_reminders(conn: &Connection, book_id: i64) -> Result<Vec<ReminderRow>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT r.id, r.book_id, r.contact_id, c.name, r.transaction_id, r.type,
                   r.trigger_date, r.days_param, r.amount_hint_cents, r.title,
                   r.is_important, r.is_completed, r.completed_at, r.snooze_until,
                   r.festival_tag_id, f.name
            FROM reminders r
            LEFT JOIN contacts c ON c.id = r.contact_id
            LEFT JOIN festival_tags f ON f.id = r.festival_tag_id
            WHERE r.book_id = ?1 AND r.deleted_at IS NULL
            ORDER BY IFNULL(r.snooze_until, r.trigger_date) ASC, r.id DESC
            "#,
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![book_id], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, i64>(1)?,
                r.get::<_, Option<i64>>(2)?,
                r.get::<_, Option<String>>(3)?,
                r.get::<_, Option<i64>>(4)?,
                r.get::<_, String>(5)?,
                r.get::<_, Option<String>>(6)?,
                r.get::<_, Option<i64>>(7)?,
                r.get::<_, Option<i64>>(8)?,
                r.get::<_, Option<String>>(9)?,
                r.get::<_, i64>(10)?,
                r.get::<_, i64>(11)?,
                r.get::<_, Option<String>>(12)?,
                r.get::<_, Option<String>>(13)?,
                r.get::<_, Option<i64>>(14)?,
                r.get::<_, Option<String>>(15)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        let (
            id,
            bid,
            contact_id,
            contact_name,
            transaction_id,
            reminder_type,
            trigger_date,
            days_param,
            amount_hint_cents,
            title,
            is_important,
            is_completed,
            completed_at,
            snooze_until,
            festival_tag_id,
            festival_name,
        ) = row.map_err(|e| e.to_string())?;
        let status = reminder_status(&trigger_date, &snooze_until, is_completed);
        out.push(ReminderRow {
            id,
            book_id: bid,
            contact_id,
            contact_name,
            transaction_id,
            reminder_type,
            trigger_date,
            days_param,
            amount_hint_cents,
            title,
            is_important,
            is_completed,
            completed_at,
            snooze_until,
            festival_tag_id,
            festival_name,
            status,
        });
    }
    Ok(out)
}

pub fn create_reminder(conn: &Connection, input: ReminderInput) -> Result<ReminderRow, String> {
    let t = input.reminder_type.as_str();
    if !matches!(
        t,
        "fixed_date" | "after_receive_days" | "before_festival_days"
    ) {
        return Err("提醒类型无效".into());
    }
    let trigger = input.trigger_date.clone().filter(|s| !s.is_empty());
    if trigger.is_none() {
        return Err("请填写触发日期".into());
    }
    let now = now_str();
    conn.execute(
        r#"
        INSERT INTO reminders (
          book_id, contact_id, transaction_id, type, trigger_date, days_param,
          amount_hint_cents, title, is_important, is_completed, festival_tag_id, created_at
        ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,0,?10,?11)
        "#,
        params![
            input.book_id,
            input.contact_id,
            input.transaction_id,
            input.reminder_type,
            trigger,
            input.days_param,
            input.amount_hint_cents,
            input.title,
            if input.is_important.unwrap_or(false) {
                1
            } else {
                0
            },
            input.festival_tag_id,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    list_reminders(conn, input.book_id)?
        .into_iter()
        .find(|r| r.id == id)
        .ok_or_else(|| "创建成功但读取失败".into())
}

pub fn complete_reminder(conn: &Connection, id: i64) -> Result<(), String> {
    let n = conn
        .execute(
            "UPDATE reminders SET is_completed=1, completed_at=?1 WHERE id=?2 AND deleted_at IS NULL",
            params![now_str(), id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("提醒不存在".into());
    }
    Ok(())
}

pub fn snooze_reminder(conn: &Connection, id: i64, days: i64) -> Result<(), String> {
    let days = if days <= 0 { 1 } else { days };
    let until = add_days(&today_str(), days)?;
    let n = conn
        .execute(
            "UPDATE reminders SET snooze_until=?1 WHERE id=?2 AND deleted_at IS NULL AND is_completed=0",
            params![until, id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("提醒不存在或已完成".into());
    }
    Ok(())
}

pub fn delete_reminder(conn: &Connection, id: i64) -> Result<(), String> {
    let n = conn
        .execute(
            "UPDATE reminders SET deleted_at=?1 WHERE id=?2 AND deleted_at IS NULL",
            params![now_str(), id],
        )
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("提醒不存在".into());
    }
    Ok(())
}

pub fn create_festival_tag(
    conn: &Connection,
    book_id: i64,
    name: &str,
) -> Result<FestivalRow, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("节日名称必填".into());
    }
    conn.execute(
        "INSERT INTO festival_tags (book_id, name, is_builtin, sort) VALUES (?1,?2,0,100)",
        params![book_id, name],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    Ok(FestivalRow {
        id,
        book_id,
        name: name.to_string(),
        is_builtin: 0,
        sort: 100,
    })
}

pub fn rename_festival_tag(conn: &Connection, id: i64, name: &str) -> Result<(), String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("节日名称必填".into());
    }
    let n = conn
        .execute("UPDATE festival_tags SET name=?1 WHERE id=?2", params![name, id])
        .map_err(|e| e.to_string())?;
    if n == 0 {
        return Err("节日不存在".into());
    }
    Ok(())
}

pub fn delete_festival_tag(conn: &Connection, id: i64) -> Result<(), String> {
    let builtin: i64 = conn
        .query_row(
            "SELECT is_builtin FROM festival_tags WHERE id=?1",
            params![id],
            |r| r.get(0),
        )
        .map_err(|_| "节日不存在".to_string())?;
    if builtin == 1 {
        return Err("内置节日不可删除".into());
    }
    let used: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM transactions WHERE festival_tag_id=?1 AND deleted_at IS NULL",
            params![id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if used > 0 {
        return Err(format!("仍有 {used} 笔流水使用该节日，无法删除"));
    }
    conn.execute("DELETE FROM festival_tags WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_stats(conn: &Connection, q: StatsQuery) -> Result<StatsResult, String> {
    let year_prefix = format!("{:04}", q.year);
    let member = q.member_id.unwrap_or(0);
    let relation = q.relation_tag_id.unwrap_or(0);

    let (in_cents, out_cents, count): (i64, i64, i64) = conn
        .query_row(
            r#"
            SELECT
              IFNULL(SUM(CASE WHEN t.direction='in' THEN t.amount_cents ELSE 0 END),0),
              IFNULL(SUM(CASE WHEN t.direction='out' THEN t.amount_cents ELSE 0 END),0),
              COUNT(*)
            FROM transactions t
            JOIN contacts c ON c.id = t.contact_id
            WHERE t.book_id=?1 AND t.deleted_at IS NULL
              AND t.date_gregorian LIKE ?2
              AND (?3 = 0 OR t.member_id = ?3)
              AND (?4 = 0 OR c.relation_tag_id = ?4)
            "#,
            params![q.book_id, format!("{year_prefix}%"), member, relation],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    let mut monthly = Vec::new();
    for m in 1..=12 {
        let prefix = format!("{:04}-{:02}", q.year, m);
        let (mi, mo): (i64, i64) = conn
            .query_row(
                r#"
                SELECT
                  IFNULL(SUM(CASE WHEN t.direction='in' THEN t.amount_cents ELSE 0 END),0),
                  IFNULL(SUM(CASE WHEN t.direction='out' THEN t.amount_cents ELSE 0 END),0)
                FROM transactions t
                JOIN contacts c ON c.id = t.contact_id
                WHERE t.book_id=?1 AND t.deleted_at IS NULL
                  AND t.date_gregorian LIKE ?2
                  AND (?3 = 0 OR t.member_id = ?3)
                  AND (?4 = 0 OR c.relation_tag_id = ?4)
                "#,
                params![q.book_id, format!("{prefix}%"), member, relation],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .map_err(|e| e.to_string())?;
        monthly.push(MonthStat {
            month: format!("{:02}", m),
            in_cents: mi,
            out_cents: mo,
            net_cents: mi - mo,
        });
    }

    let mut stmt = conn
        .prepare(
            r#"
            SELECT IFNULL(r.name, '未分类'),
              IFNULL(SUM(CASE WHEN t.direction='in' THEN t.amount_cents ELSE 0 END),0),
              IFNULL(SUM(CASE WHEN t.direction='out' THEN t.amount_cents ELSE 0 END),0)
            FROM transactions t
            JOIN contacts c ON c.id = t.contact_id
            LEFT JOIN relation_tags r ON r.id = c.relation_tag_id
            WHERE t.book_id=?1 AND t.deleted_at IS NULL
              AND t.date_gregorian LIKE ?2
              AND (?3 = 0 OR t.member_id = ?3)
              AND (?4 = 0 OR c.relation_tag_id = ?4)
            GROUP BY IFNULL(r.name, '未分类')
            ORDER BY (SUM(CASE WHEN t.direction='in' THEN t.amount_cents ELSE 0 END)+
                      SUM(CASE WHEN t.direction='out' THEN t.amount_cents ELSE 0 END)) DESC
            "#,
        )
        .map_err(|e| e.to_string())?;
    let mut by_relation = Vec::new();
    for row in stmt
        .query_map(
            params![q.book_id, format!("{year_prefix}%"), member, relation],
            |r| {
                Ok(RelationStat {
                    relation_name: r.get(0)?,
                    in_cents: r.get(1)?,
                    out_cents: r.get(2)?,
                })
            },
        )
        .map_err(|e| e.to_string())?
    {
        by_relation.push(row.map_err(|e| e.to_string())?);
    }

    let table_rows: Vec<StatsTableRow> = monthly
        .iter()
        .filter(|m| m.in_cents > 0 || m.out_cents > 0)
        .map(|m| StatsTableRow {
            label: format!("{}-{}", q.year, m.month),
            in_cents: m.in_cents,
            out_cents: m.out_cents,
            net_cents: m.net_cents,
            count: 0,
        })
        .collect();

    // pending 不受年筛选，与待还页一致
    let pending_count = list_pending(conn, q.book_id, false)?.len() as i64;

    Ok(StatsResult {
        year: q.year,
        in_cents,
        out_cents,
        net_cents: in_cents - out_cents,
        count,
        pending_count,
        monthly,
        by_relation,
        table_rows,
    })
}

pub fn get_year_report(conn: &Connection, book_id: i64, year: i32) -> Result<YearReport, String> {
    let book_name: String = conn
        .query_row(
            "SELECT name FROM books WHERE id=?1",
            params![book_id],
            |r| r.get(0),
        )
        .unwrap_or_else(|_| "礼金簿".into());
    let stats = get_stats(
        conn,
        StatsQuery {
            book_id,
            year,
            member_id: None,
            relation_tag_id: None,
        },
    )?;
    let year_prefix = format!("{:04}", year);

    let top_dir = |direction: &str| -> Result<Vec<TopContact>, String> {
        let mut stmt = conn
            .prepare(
                r#"
                SELECT c.id, c.name, IFNULL(SUM(t.amount_cents),0) AS amt
                FROM transactions t
                JOIN contacts c ON c.id = t.contact_id
                WHERE t.book_id=?1 AND t.deleted_at IS NULL AND t.direction=?2
                  AND t.date_gregorian LIKE ?3
                  AND c.deleted_at IS NULL
                GROUP BY c.id
                ORDER BY amt DESC
                LIMIT 5
                "#,
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![book_id, direction, format!("{year_prefix}%")], |r| {
                Ok(TopContact {
                    contact_id: r.get(0)?,
                    contact_name: r.get(1)?,
                    amount_cents: r.get(2)?,
                })
            })
            .map_err(|e| e.to_string())?;
        let mut out = Vec::new();
        for row in rows {
            out.push(row.map_err(|e| e.to_string())?);
        }
        Ok(out)
    };

    let pending = list_pending(conn, book_id, false)?;
    let pending_total: i64 = pending.iter().map(|p| p.balance_cents).sum();
    let mut top_pending: Vec<TopContact> = pending
        .iter()
        .take(5)
        .map(|p| TopContact {
            contact_id: p.contact_id,
            contact_name: p.contact_name.clone(),
            amount_cents: p.balance_cents,
        })
        .collect();
    top_pending.sort_by(|a, b| b.amount_cents.cmp(&a.amount_cents));

    let mut fstmt = conn
        .prepare(
            r#"
            SELECT IFNULL(f.name, IFNULL(t.event_title,'其他')), COUNT(*), IFNULL(SUM(t.amount_cents),0)
            FROM transactions t
            LEFT JOIN festival_tags f ON f.id = t.festival_tag_id
            WHERE t.book_id=?1 AND t.deleted_at IS NULL AND t.date_gregorian LIKE ?2
            GROUP BY 1
            ORDER BY COUNT(*) DESC
            LIMIT 12
            "#,
        )
        .map_err(|e| e.to_string())?;
    let mut festival_dist = Vec::new();
    for row in fstmt
        .query_map(params![book_id, format!("{year_prefix}%")], |r| {
            Ok(FestivalDist {
                festival_name: r.get(0)?,
                count: r.get(1)?,
                amount_cents: r.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
    {
        festival_dist.push(row.map_err(|e| e.to_string())?);
    }

    let generated = today_str();
    Ok(YearReport {
        book_name,
        year,
        generated_at: generated.clone(),
        lunar_note: String::new(), // 前端用 lunar.ts 补旁注
        in_cents: stats.in_cents,
        out_cents: stats.out_cents,
        net_cents: stats.net_cents,
        count: stats.count,
        top_receive: top_dir("in")?,
        top_give: top_dir("out")?,
        top_pending,
        festival_dist,
        pending_count: pending.len() as i64,
        pending_total_cents: pending_total,
    })
}

pub fn open_folder(path: &str) -> Result<(), String> {
    let p = PathBuf::from(path);
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&p)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        // explorer 对路径更稳；不检查 exit code（成功也可能非 0）
        std::process::Command::new("explorer")
            .arg(p.as_os_str())
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
    {
        std::process::Command::new("xdg-open")
            .arg(&p)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[derive(Debug, Serialize, Clone)]
pub struct BackupInfo {
    pub path: String,
    pub exported_at: String,
    pub tx_count: i64,
}

fn table_to_json(conn: &Connection, sql: &str) -> Result<Vec<serde_json::Value>, String> {
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let col_count = stmt.column_count();
    let names: Vec<String> = (0..col_count)
        .map(|i| stmt.column_name(i).unwrap_or("").to_string())
        .collect();
    let mut rows = Vec::new();
    let mut q = stmt.query([]).map_err(|e| e.to_string())?;
    while let Some(row) = q.next().map_err(|e| e.to_string())? {
        let mut obj = serde_json::Map::new();
        for (i, name) in names.iter().enumerate() {
            let v: rusqlite::types::Value = row.get(i).map_err(|e| e.to_string())?;
            let j = match v {
                rusqlite::types::Value::Null => serde_json::Value::Null,
                rusqlite::types::Value::Integer(n) => serde_json::json!(n),
                rusqlite::types::Value::Real(n) => serde_json::json!(n),
                rusqlite::types::Value::Text(s) => serde_json::json!(s),
                rusqlite::types::Value::Blob(b) => {
                    serde_json::json!(format!("base64:{}", base64_encode(&b)))
                }
            };
            obj.insert(name.clone(), j);
        }
        rows.push(serde_json::Value::Object(obj));
    }
    Ok(rows)
}

fn base64_encode(bytes: &[u8]) -> String {
    const T: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::new();
    for chunk in bytes.chunks(3) {
        let a = chunk[0] as u32;
        let b = chunk.get(1).copied().unwrap_or(0) as u32;
        let c = chunk.get(2).copied().unwrap_or(0) as u32;
        let n = (a << 16) | (b << 8) | c;
        out.push(T[((n >> 18) & 63) as usize] as char);
        out.push(T[((n >> 12) & 63) as usize] as char);
        out.push(if chunk.len() > 1 {
            T[((n >> 6) & 63) as usize] as char
        } else {
            '='
        });
        out.push(if chunk.len() > 2 {
            T[(n & 63) as usize] as char
        } else {
            '='
        });
    }
    out
}

pub fn export_backup(conn: &Connection) -> Result<BackupInfo, String> {
    let exported_at = now_str();
    let payload = serde_json::json!({
        "version": 1,
        "exported_at": exported_at,
        "books": table_to_json(conn, "SELECT * FROM books")?,
        "members": table_to_json(conn, "SELECT * FROM members")?,
        "relation_tags": table_to_json(conn, "SELECT * FROM relation_tags")?,
        "contacts": table_to_json(conn, "SELECT * FROM contacts")?,
        "festival_tags": table_to_json(conn, "SELECT * FROM festival_tags")?,
        "transactions": table_to_json(conn, "SELECT * FROM transactions")?,
        "reminders": table_to_json(conn, "SELECT * FROM reminders")?,
        "contact_settle_marks": table_to_json(conn, "SELECT * FROM contact_settle_marks")?,
        "settings": table_to_json(conn, "SELECT * FROM settings")?,
    });
    let tx_count = payload["transactions"].as_array().map(|a| a.len()).unwrap_or(0) as i64;
    let dir = app_data_dir()?.join("backups");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let stamp = Local::now().format("%Y%m%d-%H%M%S").to_string();
    let path = dir.join(format!("lijinbu-backup-{stamp}.json"));
    // UTF-8 BOM：Windows 记事本/部分工具打开中文 JSON 不乱码
    let body = serde_json::to_string_pretty(&payload).map_err(|e| e.to_string())?;
    let mut bytes = vec![0xEFu8, 0xBB, 0xBF];
    bytes.extend(body.as_bytes());
    fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(BackupInfo {
        path: path.to_string_lossy().to_string(),
        exported_at,
        tx_count,
    })
}

pub fn list_backups() -> Result<Vec<String>, String> {
    let dir = app_data_dir()?.join("backups");
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut out = Vec::new();
    for e in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let e = e.map_err(|e| e.to_string())?;
        let p = e.path();
        if p.extension().and_then(|x| x.to_str()) == Some("json") {
            out.push(p.to_string_lossy().to_string());
        }
    }
    out.sort();
    out.reverse();
    Ok(out)
}

fn json_cell(v: &serde_json::Value) -> rusqlite::types::Value {
    match v {
        serde_json::Value::Null => rusqlite::types::Value::Null,
        serde_json::Value::Bool(b) => rusqlite::types::Value::Integer(if *b { 1 } else { 0 }),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                rusqlite::types::Value::Integer(i)
            } else if let Some(f) = n.as_f64() {
                rusqlite::types::Value::Real(f)
            } else {
                rusqlite::types::Value::Null
            }
        }
        serde_json::Value::String(s) => rusqlite::types::Value::Text(s.clone()),
        _ => rusqlite::types::Value::Text(v.to_string()),
    }
}

fn insert_rows(conn: &Connection, table: &str, rows: &[serde_json::Value]) -> Result<(), String> {
    for row in rows {
        let obj = row.as_object().ok_or_else(|| "备份行格式错误".to_string())?;
        let cols: Vec<&String> = obj.keys().collect();
        if cols.is_empty() {
            continue;
        }
        let placeholders: Vec<String> = (1..=cols.len()).map(|i| format!("?{i}")).collect();
        let sql = format!(
            "INSERT INTO {table} ({}) VALUES ({})",
            cols.iter()
                .map(|c| c.as_str())
                .collect::<Vec<_>>()
                .join(","),
            placeholders.join(",")
        );
        let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
        let values: Vec<rusqlite::types::Value> = cols.iter().map(|c| json_cell(&obj[*c])).collect();
        stmt.execute(rusqlite::params_from_iter(values))
            .map_err(|e| format!("恢复 {table} 失败: {e}"))?;
    }
    Ok(())
}

/// 从 JSON 字符串完整恢复（覆盖当前库）。调用前 UI 必须警告。
pub fn restore_backup_json(conn: &Connection, json: &str) -> Result<(), String> {
    let json = json.strip_prefix('\u{feff}').unwrap_or(json);
    let v: serde_json::Value =
        serde_json::from_str(json).map_err(|e| format!("备份 JSON 无效: {e}"))?;
    let version = v.get("version").and_then(|x| x.as_i64()).unwrap_or(0);
    if version != 1 {
        return Err("不支持的备份版本".into());
    }
    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = OFF;
        DELETE FROM contact_settle_marks;
        DELETE FROM reminders;
        DELETE FROM transactions;
        DELETE FROM contacts;
        DELETE FROM festival_tags;
        DELETE FROM relation_tags;
        DELETE FROM members;
        DELETE FROM books;
        DELETE FROM settings;
        "#,
    )
    .map_err(|e| e.to_string())?;

    let get = |key: &str| -> Vec<serde_json::Value> {
        v.get(key)
            .and_then(|x| x.as_array())
            .cloned()
            .unwrap_or_default()
    };
    insert_rows(conn, "books", &get("books"))?;
    insert_rows(conn, "members", &get("members"))?;
    insert_rows(conn, "relation_tags", &get("relation_tags"))?;
    insert_rows(conn, "contacts", &get("contacts"))?;
    insert_rows(conn, "festival_tags", &get("festival_tags"))?;
    insert_rows(conn, "transactions", &get("transactions"))?;
    insert_rows(conn, "reminders", &get("reminders"))?;
    insert_rows(conn, "contact_settle_marks", &get("contact_settle_marks"))?;
    insert_rows(conn, "settings", &get("settings"))?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn restore_backup_path(conn: &Connection, path: &str) -> Result<(), String> {
    let raw = fs::read_to_string(path).map_err(|e| format!("读取备份失败: {e}"))?;
    let json = raw.strip_prefix('\u{feff}').unwrap_or(raw.as_str());
    restore_backup_json(conn, json)
}
