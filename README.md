# The Nest — Windows desktop app

Tauri wrapper for **The Nest** (SMTHN.BTFUL dashboard, live at
https://today-widget-sb-54b6.vercel.app/).

## What it is

- `ui/` — a tiny local launcher page. It holds the Vercel Deployment
  Protection bypass secret (stored only in the app's own localStorage on the
  user's machine) and redirects to the live Nest with
  `?x-vercel-protection-bypass=<secret>&x-vercel-set-bypass-cookie=true`,
  so the dashboard opens straight through without the Vercel sign-in page.
- `src-tauri/` — the Tauri (Rust) shell: one window, hummingbird icon,
  NSIS installer target.

The dashboard itself is NOT bundled — the app always loads the live site, so
the hourly cron refresh, all 5 tabs (Today / TrendHooks / Ads / Reels /
Social), TrendHooks generation (`/api/trends`) and the live Ads/Store
endpoints keep working exactly as on the web.

## First run (Hunter)

1. Run the installer (`The Nest_1.0.0_x64-setup.exe`), then launch **The Nest**.
2. On first launch it asks for the **protection bypass secret**:
   Vercel dashboard → project `today-widget` → **Settings** →
   **Deployment Protection** → **Protection Bypass for Automation** → copy
   the secret (create one labelled "Nest desktop app" if none exists) →
   paste it in the app → **Save & open The Nest**.
3. The secret is saved only on that computer. The app then opens straight to
   the dashboard on every launch.
4. Wrong secret? The "Opening The Nest…" screen has a
   **Cancel — change saved secret** button (2.5 s window). If it already
   opened the Vercel sign-in page, use that button on next launch.

Without a secret the app still works — it loads the site and shows Vercel's
sign-in page, where Hunter can sign in with his Vercel account.

## Delivered (Nov 13, 2026)

- **Installer:** `The-Nest-1.0.0-x64-setup.exe` (1.6 MB, NSIS) — also at
  `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/The Nest_1.0.0_x64-setup.exe`
- **Standalone exe:** `src-tauri/target/x86_64-pc-windows-gnu/release/nest.exe` (5.8 MB, PE32+ x64)
- Built with Tauri CLI 2.12.4 / Tauri 2.12.5, Rust 1.100.0, target
  `x86_64-pc-windows-gnu` (MinGW linker, NSIS via makensis).
- Verified on Linux: both files are valid Windows PE binaries; the launcher
  page (index.html, launcher.js/css, hummingbird.jpg) is embedded in
  `nest.exe` (asset filenames present in the binary; contents are
  brotli-compressed by Tauri, so plaintext URLs don't appear in `strings`).
- **NOT verified:** actually launching/installing on Windows (no Windows
  machine in this VM) — Hunter is the tester. Also untested: the bypass
  redirect end-to-end (needs a real secret + a Windows WebView2 runtime).

## Building (Linux → Windows x64)

Requires Rust (stable) + the `x86_64-pc-windows-gnu` target + MinGW-w64
linker + NSIS (`makensis`). From this repo root:

```sh
export PATH="$HOME/workspace/.rust/bin:$PATH"   # or wherever Rust lives
cargo install tauri-cli --locked                # once; or use npx @tauri-apps/cli
cargo tauri build --target x86_64-pc-windows-gnu
```

Installer lands at:
`src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/The Nest_1.0.0_x64-setup.exe`

Notes:
- The app needs the WebView2 runtime on Windows (ships with Windows 10/11
  and Edge; the NSIS installer does not bundle it).
- On-Windows launch was NOT verified in this Linux VM — Hunter is the tester.
- Toolchain notes: rustup's own installer failed to extract the toolchain in
  this sandbox (EPERM; /tmp too small at 512 MB), so Rust 1.100.0 was
  installed from the standalone tarball into `~/workspace/.rust`, with the
  `x86_64-pc-windows-gnu` std component installed the same way. A runtime
  restart midway also wiped the apt-installed MinGW/NSIS packages; they were
  re-installed before the successful build. `~/workspace/.rust` (1.1 GB) and
  the cargo target dir are kept so rebuilds are incremental.
