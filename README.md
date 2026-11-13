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

1. Run the installer (`The-Nest-1.1.0-x64-setup.exe`), then launch **The Nest**.
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

### 1.1.0 — auto-updater (current)
- **Installer:** `The-Nest-1.1.0-x64-setup.exe` (2.5 MB, NSIS) — also at
  `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/The Nest_1.1.0_x64-setup.exe`
- **Standalone exe:** `src-tauri/target/x86_64-pc-windows-gnu/release/nest.exe` (PE32+ x64)
- Built with Tauri CLI 2.12.4 / Tauri 2.12.5, Rust 1.100.0, target
  `x86_64-pc-windows-gnu` (MinGW linker, NSIS via makensis).
- **Auto-updater is in this build** (see below). Install 1.1.0 once by hand;
  automatic updates work from 1.1.0 onward.
- Source + releases: public repo https://github.com/SMTHN-BTFUL/nest-desktop
  (release: https://github.com/SMTHN-BTFUL/nest-desktop/releases/tag/v1.1.0).
- Verified on Linux: installer is a valid Windows PE32 NSIS binary;
  the release asset downloads (HTTP 200).
- **NOT verified:** actually launching/installing on Windows (no Windows
  machine in this VM) — Hunter is the tester. Also untested end-to-end: the
  updater actually fetching + installing an update on Windows (provable only
  once a 1.1.1+ release exists and the installed app checks for it).
- **Manifest status: `latest.json` is NOT published yet** (see
  "Publishing a future version"). The signed artifact signature file exists
  on disk at
  `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/The Nest_1.1.0_x64-setup.exe.sig`
  (git-ignored, kept with the build output). Until `latest.json` is attached
  to the release, the app's update check gets a 404 and offers nothing —
  safe no-op, dashboard unaffected.

### 1.0.0 (superseded — no updater)
- **Installer:** `The-Nest-1.0.0-x64-setup.exe` (1.6 MB, NSIS).
- **Standalone exe:** `src-tauri/target/x86_64-pc-windows-gnu/release/nest.exe` (5.8 MB, PE32+ x64)
- Verified on Linux: both files are valid Windows PE binaries; the launcher
  page (index.html, launcher.js/css, hummingbird.jpg) is embedded in
  `nest.exe` (asset filenames present in the binary; contents are
  brotli-compressed by Tauri, so plaintext URLs don't appear in `strings`).
- **NOT verified:** actually launching/installing on Windows (no Windows
  machine in this VM) — Hunter is the tester. Also untested: the bypass
  redirect end-to-end (needs a real secret + a Windows WebView2 runtime).

## Auto-updater (from 1.1.0)

- On every launch the app checks
  `https://github.com/SMTHN-BTFUL/nest-desktop/releases/latest/download/latest.json`
  for a newer version. The manifest is hosted on GitHub releases (public) —
  NOT on the Vercel site, because the Vercel Deployment Protection login
  wall would block the app's Rust-side update check.
- If an update is available, the app shows a native yes/no prompt
  ("The Nest X is available (you have Y). Install now? The app will
  restart."). No silent or forced installs — it only downloads + installs
  after Hunter clicks Yes, then restarts into the new version.
- If the check fails (no network, no manifest yet, no newer version) it
  fails silently and the dashboard loads as normal.
- Update artifacts are minisign-signed. Public key is in
  `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`); the updater
  refuses any artifact whose signature doesn't verify against it.
- **Private signing key:** `private-keys/nest.key` (0600, local only).
  It is git-ignored and must NEVER be committed, pasted into chat, or
  uploaded anywhere. If it is lost, no future update can be signed and the
  updater stops working — back it up somewhere safe off this machine.
  `private-keys/nest.key.pub` is the public key (safe to share; it is also
  embedded in `tauri.conf.json`).

## Publishing a future version (1.1.1+)

1. Bump the version in all three places: `src-tauri/Cargo.toml`,
   `src-tauri/tauri.conf.json`, `package.json`.
2. Build (signing is skipped automatically on Linux hosts — that warning is
   about Windows Authenticode, not the updater signature):
   ```sh
   export PATH="$HOME/workspace/.rust/bin:$PATH"
   ./node_modules/.bin/tauri build --target x86_64-pc-windows-gnu
   ```
3. Sign the installer for the updater (build-time signing doesn't run on
   Linux, so sign manually — bind the version):
   ```sh
   export TAURI_SIGNING_PRIVATE_KEY="$(cat private-keys/nest.key)"
   ./node_modules/.bin/tauri signer sign --app-version <VERSION> \
     "src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/The Nest_<VERSION>_x64-setup.exe"
   ```
   This writes `...-setup.exe.sig` next to the installer.
4. Copy the installer to a clean name at the repo root, e.g.
   `The-Nest-<VERSION>-x64-setup.exe`, commit + push the source changes.
5. Write `latest.json` for the new version (Tauri v2 updater manifest):
   ```json
   {
     "version": "<VERSION>",
     "notes": "<what changed>",
     "pub_date": "<RFC3339 UTC timestamp>",
     "platforms": {
       "windows-x86_64": {
         "signature": "<entire contents of the .sig file, verbatim>",
         "url": "https://github.com/SMTHN-BTFUL/nest-desktop/releases/download/v<VERSION>/The-Nest-<VERSION>-x64-setup.exe"
       }
     }
   }
   ```
   The `signature` value is the full content of the `.sig` file produced in
   step 3 (a single base64 string). The updater verifies it against the
   public key in `tauri.conf.json` before installing.
6. Create the release and attach both files:
   ```sh
   gh release create v<VERSION> --title "The Nest <VERSION>" --notes "<what changed>" \
     ./The-Nest-<VERSION>-x64-setup.exe ./latest.json
   ```
   The app's configured endpoint
   (`.../releases/latest/download/latest.json`) resolves to the `latest.json`
   asset of the newest release.
7. Verify: `curl -L https://github.com/SMTHN-BTFUL/nest-desktop/releases/latest/download/latest.json`
   returns the new version + URL, and the installer URL returns 200.
   The installed 1.1.0+ app will offer the update on its next launch;
   Hunter clicks Yes and it installs + restarts itself.

## Building (Linux → Windows x64)

Requires Rust (stable) + the `x86_64-pc-windows-gnu` target + MinGW-w64
linker + NSIS (`makensis`). The Tauri CLI is the npm one in this repo
(`@tauri-apps/cli` 2.12.4, `node_modules/.bin/tauri`) — `cargo tauri` is
NOT installed. From this repo root:

```sh
export PATH="$HOME/workspace/.rust/bin:$PATH"   # or wherever Rust lives
./node_modules/.bin/tauri build --target x86_64-pc-windows-gnu
```

Installer lands at:
`src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/The Nest_<VERSION>_x64-setup.exe`

After building, sign the installer for the updater (see "Publishing a
future version" — build-time signing is skipped on Linux hosts).

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
