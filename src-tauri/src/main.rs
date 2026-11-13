use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_updater::UpdaterExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Check for app updates in the background; failures are silent
            // (no network, no release yet) — the dashboard still loads.
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = check_for_updates(handle).await {
                    eprintln!("update check failed: {e}");
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running The Nest");
}

async fn check_for_updates(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    let update = app.updater()?.check().await?;
    if let Some(update) = update {
        // Native yes/no prompt — no silent installs. Runs on a worker
        // thread, so the blocking dialog can't stall the event loop.
        let install = app
            .dialog()
            .message(format!(
                "The Nest {} is available (you have {}). Install now? The app will restart.",
                update.version,
                app.package_info().version
            ))
            .title("The Nest — update available")
            .kind(MessageDialogKind::Info)
            .buttons(MessageDialogButtons::YesNo)
            .blocking_show();
        if install {
            update
                .download_and_install(|_, _| {}, || {})
                .await?;
            app.restart();
        }
    }
    Ok(())
}
