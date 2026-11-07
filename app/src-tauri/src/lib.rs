mod db;

use db::{
    data_dir_string, open_connection, open_folder, BackupInfo, BookRow, BootstrapInfo, ContactInput,
    ContactRow, DbState, FestivalRow, GlobalHit, MemberRow, PendingRow, RecycleItem, ReminderInput,
    ReminderRow, StatsQuery, StatsResult, SummaryCard, TagRow, TxInput, TxRow, YearReport,
};
use std::sync::Mutex;

fn with_db<T>(
    state: &tauri::State<'_, DbState>,
    f: impl FnOnce(&rusqlite::Connection) -> Result<T, String>,
) -> Result<T, String> {
    let conn = state.0.lock().map_err(|_| "数据库锁失败".to_string())?;
    f(&conn)
}

#[tauri::command]
fn get_bootstrap(state: tauri::State<'_, DbState>) -> Result<BootstrapInfo, String> {
    with_db(&state, db::bootstrap)
}

#[tauri::command]
fn get_data_dir() -> Result<String, String> {
    data_dir_string()
}

#[tauri::command]
fn open_data_folder() -> Result<(), String> {
    let dir = data_dir_string()?;
    open_folder(&dir)
}

#[tauri::command]
fn list_books(state: tauri::State<'_, DbState>) -> Result<Vec<BookRow>, String> {
    with_db(&state, db::list_books)
}

#[tauri::command]
fn create_book(state: tauri::State<'_, DbState>, name: String) -> Result<BookRow, String> {
    with_db(&state, |c| db::create_book(c, &name))
}

#[tauri::command]
fn rename_book(state: tauri::State<'_, DbState>, id: i64, name: String) -> Result<(), String> {
    with_db(&state, |c| db::rename_book(c, id, &name))
}

#[tauri::command]
fn delete_book(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    with_db(&state, |c| db::delete_book(c, id))
}

#[tauri::command]
fn set_active_book(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    with_db(&state, |c| db::set_active_book(c, id))
}

#[tauri::command]
fn list_members(state: tauri::State<'_, DbState>, book_id: i64) -> Result<Vec<MemberRow>, String> {
    with_db(&state, |c| db::list_members(c, book_id))
}

#[tauri::command]
fn create_member(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    name: String,
) -> Result<MemberRow, String> {
    with_db(&state, |c| db::create_member(c, book_id, &name))
}

#[tauri::command]
fn rename_member(state: tauri::State<'_, DbState>, id: i64, name: String) -> Result<(), String> {
    with_db(&state, |c| db::rename_member(c, id, &name))
}

#[tauri::command]
fn delete_member(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    with_db(&state, |c| db::delete_member(c, id))
}

#[tauri::command]
fn list_relation_tags(
    state: tauri::State<'_, DbState>,
    book_id: i64,
) -> Result<Vec<TagRow>, String> {
    with_db(&state, |c| db::list_relation_tags(c, book_id))
}

#[tauri::command]
fn create_relation_tag(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    name: String,
) -> Result<TagRow, String> {
    with_db(&state, |c| db::create_relation_tag(c, book_id, &name))
}

#[tauri::command]
fn list_festival_tags(
    state: tauri::State<'_, DbState>,
    book_id: i64,
) -> Result<Vec<FestivalRow>, String> {
    with_db(&state, |c| db::list_festival_tags(c, book_id))
}

#[tauri::command]
fn list_contacts(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    tab: String,
    q: String,
) -> Result<Vec<ContactRow>, String> {
    with_db(&state, |c| db::list_contacts(c, book_id, &tab, &q))
}

#[tauri::command]
fn search_contacts(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    q: String,
) -> Result<Vec<ContactRow>, String> {
    with_db(&state, |c| db::search_contacts(c, book_id, &q))
}

#[tauri::command]
fn find_same_name(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    name: String,
) -> Result<Vec<ContactRow>, String> {
    with_db(&state, |c| db::find_same_name(c, book_id, &name))
}

#[tauri::command]
fn create_contact(
    state: tauri::State<'_, DbState>,
    input: ContactInput,
) -> Result<ContactRow, String> {
    with_db(&state, |c| db::create_contact(c, input))
}

#[tauri::command]
fn update_contact(
    state: tauri::State<'_, DbState>,
    id: i64,
    input: ContactInput,
) -> Result<ContactRow, String> {
    with_db(&state, |c| db::update_contact(c, id, input))
}

#[tauri::command]
fn set_contact_stopped(
    state: tauri::State<'_, DbState>,
    id: i64,
    stopped: bool,
) -> Result<(), String> {
    with_db(&state, |c| db::set_contact_stopped(c, id, stopped))
}

#[tauri::command]
fn soft_delete_contact(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    with_db(&state, |c| db::soft_delete_contact(c, id))
}

#[tauri::command]
fn merge_contacts(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    keep_id: i64,
    merge_id: i64,
) -> Result<(), String> {
    with_db(&state, |c| db::merge_contacts(c, book_id, keep_id, merge_id))
}

#[tauri::command]
fn list_pending(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    include_settled: bool,
) -> Result<Vec<PendingRow>, String> {
    with_db(&state, |c| db::list_pending(c, book_id, include_settled))
}

#[tauri::command]
fn settle_contact(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    contact_id: i64,
) -> Result<(), String> {
    with_db(&state, |c| db::settle_contact(c, book_id, contact_id))
}

#[tauri::command]
fn unsettle_contact(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    contact_id: i64,
) -> Result<(), String> {
    with_db(&state, |c| db::unsettle_contact(c, book_id, contact_id))
}

#[tauri::command]
fn list_recycle(state: tauri::State<'_, DbState>, book_id: i64) -> Result<Vec<RecycleItem>, String> {
    with_db(&state, |c| db::list_recycle(c, book_id))
}

#[tauri::command]
fn restore_recycle(
    state: tauri::State<'_, DbState>,
    kind: String,
    id: i64,
) -> Result<(), String> {
    with_db(&state, |c| db::restore_recycle(c, &kind, id))
}

#[tauri::command]
fn purge_recycle(state: tauri::State<'_, DbState>, kind: String, id: i64) -> Result<(), String> {
    with_db(&state, |c| db::purge_recycle(c, &kind, id))
}

#[tauri::command]
fn global_search(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    q: String,
) -> Result<Vec<GlobalHit>, String> {
    with_db(&state, |c| db::global_search(c, book_id, &q))
}

#[tauri::command]
fn list_transactions(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    direction: Option<String>,
    q: Option<String>,
    festival_tag_id: Option<i64>,
    side: Option<String>,
) -> Result<Vec<TxRow>, String> {
    with_db(&state, |c| {
        db::list_transactions(c, book_id, direction, q, festival_tag_id, side)
    })
}

#[tauri::command]
fn list_reminders(
    state: tauri::State<'_, DbState>,
    book_id: i64,
) -> Result<Vec<ReminderRow>, String> {
    with_db(&state, |c| db::list_reminders(c, book_id))
}

#[tauri::command]
fn create_reminder(
    state: tauri::State<'_, DbState>,
    input: ReminderInput,
) -> Result<ReminderRow, String> {
    with_db(&state, |c| db::create_reminder(c, input))
}

#[tauri::command]
fn complete_reminder(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    with_db(&state, |c| db::complete_reminder(c, id))
}

#[tauri::command]
fn snooze_reminder(state: tauri::State<'_, DbState>, id: i64, days: i64) -> Result<(), String> {
    with_db(&state, |c| db::snooze_reminder(c, id, days))
}

#[tauri::command]
fn delete_reminder(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    with_db(&state, |c| db::delete_reminder(c, id))
}

#[tauri::command]
fn create_festival_tag(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    name: String,
) -> Result<FestivalRow, String> {
    with_db(&state, |c| db::create_festival_tag(c, book_id, &name))
}

#[tauri::command]
fn rename_festival_tag(
    state: tauri::State<'_, DbState>,
    id: i64,
    name: String,
) -> Result<(), String> {
    with_db(&state, |c| db::rename_festival_tag(c, id, &name))
}

#[tauri::command]
fn delete_festival_tag(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    with_db(&state, |c| db::delete_festival_tag(c, id))
}

#[tauri::command]
fn create_transaction(state: tauri::State<'_, DbState>, input: TxInput) -> Result<TxRow, String> {
    with_db(&state, |c| db::create_transaction(c, input))
}

#[tauri::command]
fn update_transaction(
    state: tauri::State<'_, DbState>,
    id: i64,
    input: TxInput,
) -> Result<TxRow, String> {
    with_db(&state, |c| db::update_transaction(c, id, input))
}

#[tauri::command]
fn soft_delete_transaction(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    with_db(&state, |c| db::soft_delete_transaction(c, id))
}

#[tauri::command]
fn get_summary(state: tauri::State<'_, DbState>, book_id: i64) -> Result<SummaryCard, String> {
    with_db(&state, |c| db::get_summary(c, book_id))
}

#[tauri::command]
fn get_settings(
    state: tauri::State<'_, DbState>,
) -> Result<serde_json::Map<String, serde_json::Value>, String> {
    with_db(&state, db::all_settings)
}

#[tauri::command]
fn set_setting(
    state: tauri::State<'_, DbState>,
    key: String,
    value_json: String,
) -> Result<(), String> {
    with_db(&state, |c| db::set_setting(c, &key, &value_json))
}

#[tauri::command]
fn get_stats(state: tauri::State<'_, DbState>, query: StatsQuery) -> Result<StatsResult, String> {
    with_db(&state, |c| db::get_stats(c, query))
}

#[tauri::command]
fn get_year_report(
    state: tauri::State<'_, DbState>,
    book_id: i64,
    year: i32,
) -> Result<YearReport, String> {
    with_db(&state, |c| db::get_year_report(c, book_id, year))
}

#[tauri::command]
fn export_backup(state: tauri::State<'_, DbState>) -> Result<BackupInfo, String> {
    with_db(&state, db::export_backup)
}

#[tauri::command]
fn list_backups() -> Result<Vec<String>, String> {
    db::list_backups()
}

#[tauri::command]
fn restore_backup_path(
    state: tauri::State<'_, DbState>,
    path: String,
) -> Result<(), String> {
    with_db(&state, |c| db::restore_backup_path(c, &path))
}

#[tauri::command]
fn restore_backup_json(
    state: tauri::State<'_, DbState>,
    json: String,
) -> Result<(), String> {
    with_db(&state, |c| db::restore_backup_json(c, &json))
}

#[tauri::command]
fn purge_expired_recycle(
    state: tauri::State<'_, DbState>,
    days: i64,
) -> Result<i64, String> {
    with_db(&state, |c| db::purge_expired_recycle(c, days))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = open_connection().expect("初始化 SQLite 失败");
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .manage(DbState(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            get_bootstrap,
            get_data_dir,
            open_data_folder,
            list_books,
            create_book,
            rename_book,
            delete_book,
            set_active_book,
            list_members,
            create_member,
            rename_member,
            delete_member,
            list_relation_tags,
            create_relation_tag,
            list_festival_tags,
            create_festival_tag,
            rename_festival_tag,
            delete_festival_tag,
            list_contacts,
            search_contacts,
            find_same_name,
            create_contact,
            update_contact,
            set_contact_stopped,
            soft_delete_contact,
            merge_contacts,
            list_pending,
            settle_contact,
            unsettle_contact,
            list_recycle,
            restore_recycle,
            purge_recycle,
            global_search,
            list_transactions,
            create_transaction,
            update_transaction,
            soft_delete_transaction,
            list_reminders,
            create_reminder,
            complete_reminder,
            snooze_reminder,
            delete_reminder,
            get_summary,
            get_settings,
            set_setting,
            get_stats,
            get_year_report,
            export_backup,
            list_backups,
            restore_backup_path,
            restore_backup_json,
            purge_expired_recycle
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
