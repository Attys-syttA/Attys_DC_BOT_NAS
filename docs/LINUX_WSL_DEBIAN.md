# Debian WSL2 Linux Acceptance

This project can be validated headlessly on Windows through Debian WSL2. Use this for Linux build, TypeScript, test, SQLite native-module, launcher syntax, and read-only launcher smoke checks.

It does not replace a real Linux desktop smoke test for the Python tray icon. The Tk control panel can be smoke-tested through WSLg when `WAYLAND_DISPLAY` and `DISPLAY` are present.

## Recommended Setup

Install Debian as a WSL2 distribution, then create a normal Linux user.

Inside Debian, prevent accidental use of Windows `node` or `npm` from the WSL PATH:

```bash
sudo sh -c 'printf "[interop]\nappendWindowsPath = false\n" > /etc/wsl.conf'
```

From Windows PowerShell, restart Debian so the setting takes effect:

```powershell
wsl --terminate Debian
wsl -d Debian
```

Install Linux-native Node.js 20 and build tools:

```bash
sudo apt-get update
sudo apt-get install -y curl ca-certificates gnupg git build-essential python3 make g++
sudo install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
  | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
  | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null
sudo apt-get update
sudo apt-get install -y nodejs
```

Confirm that Linux binaries are used:

```bash
which node
node -v
which npm
npm -v
```

Expected shape:

```text
/usr/bin/node
v20.x
/usr/bin/npm
10.x
```

If `node` or `npm` resolves under `/mnt/c/...`, stop and fix the WSL PATH before running project commands.

Install Codex CLI for the Linux user:

```bash
mkdir -p "$HOME/.local" "$HOME/.local/bin"
npm config set prefix "$HOME/.local"
printf '\n# User-local npm global binaries\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$HOME/.profile"
export PATH="$HOME/.local/bin:$PATH"
npm install -g @openai/codex
codex --version
```

Then sign in interactively:

```bash
codex login
codex login status
```

The current WSL setup has `codex-cli 0.141.0` installed at `/home/Attys/.local/bin/codex`, but login is intentionally a user action.

## Repo Copy

Use a Linux filesystem copy for dependency installation and native modules:

```bash
mkdir -p ~/codex_works
cd ~/codex_works
git clone /mnt/e/codex_works/Attys_DC_BOT Attys_DC_BOT
cd Attys_DC_BOT
```

Do not reuse the Windows `node_modules` folder from `/mnt/e/...`. Native modules such as `better-sqlite3` must be installed for Linux.

## Linux `.env`

Create a WSL-local `.env` from the Linux example:

```bash
cp .env.wsl.example .env
```

Fill the Discord token, guild/application IDs, and allowed user or role values locally. Do not commit `.env`.

The important Linux path difference is:

```text
BASE_PROJECT_DIR=/home/Attys/codex_works
```

Avoid Windows paths such as `C:\workspace` or `/mnt/e/...` for Linux runtime state.

## Acceptance Command

Run:

```bash
bash scripts/linux-wsl-acceptance.sh
```

The script checks:

- Linux-native Node.js and npm
- Node.js 20+
- shell script syntax for `install.sh` and `linux-start.sh`
- Python syntax for Linux tray/control panel sources
- read-only launcher commands
- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run check`
- `npm run safe-update:status`

## Current Proven Baseline

Verified on Debian WSL2 with:

- Node.js `v20.20.2`
- npm `10.8.2`
- Linux repo copy under `~/codex_works/Attys_DC_BOT`
- `37` test files passing
- `247` tests passing

Remaining Linux platform work:

- real Linux desktop tray smoke with `pystray` and `Pillow`
- richer WSLg control panel behavior checks beyond start/stop/restart
