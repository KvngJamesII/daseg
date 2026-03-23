# Build Prompt: New VPS Hosting Platform (v2)

## Overview
Build a complete, production-ready VPS hosting platform as a mobile-first React + Vite web application. This is an improved successor to an existing platform. The platform lets users host **Node.js apps**, **Python apps**, **static websites** (HTML/CSS/JS), and **full-stack web projects** — each with a live public subdomain they can share anywhere.

**Tech stack:**
- React + Vite + TypeScript
- Tailwind CSS v4 (CSS variables in index.css, NO tailwind.config.js)
- Supabase (auth, PostgreSQL database, realtime subscriptions, Edge Functions)
- Paystack for payments (Nigerian Naira / Kobo pricing)
- shadcn/ui component library
- react-router-dom v6
- lucide-react icons
- JetBrains Mono / Fira Code for monospace UI elements

---

## Brand & Visual Identity

- **App name:** iHost
- UI Design has to be highly topnotch like vercel or render but way more better, you cant create design prototypes and ask me to choose

## Pages & Routes

### 1. Landing Page (`/`)
- Full-screen hero with animated terminal mockup on the right showing a fake deploy sequence
- Left side: headline `$ deploy --fast`, subtitle `# Node.js · Python · Static Sites · Full-Stack`
- Pricing anchor CTA button: "Start for ₦1,400/mo →"
- Features grid (6 cards): Live Terminal, File Manager, One-Click Deploy, Subdomain Hosting, Isolated Containers, Real-time Logs
- Social proof bar: "500+ developers · 4.9/5 rating · 99.9% uptime"
- Floating badges near the terminal: "Node.js 20", "Python 3.12", "Next.js 14", "React"
- Sticky header with logo, login/signup buttons (monospace style)
- Footer with Terms of Service link

### 2. Auth Page (`/auth`)
- Login / Signup toggle (switch between them seamlessly, no separate routes)
- Supabase email+password auth
- On signup: also creates a profile row in `profiles` table
- After login/signup → redirect to `/dashboard`
- Clean card design, no clutter

### 3. Dashboard (`/dashboard`)
- **Sticky header:** SVG avatar ring with user initials + green online dot, username, notification bell with unread badge (red dot), admin shield button (if admin), logout icon
- **Realtime notifications:** Supabase realtime subscription on `notifications` table; dropdown panel with type-colored left bar (success=green, warning=amber, info=cyan), mark-one-read on click, mark-all-read button, time ago labels
- **Stats row:** 4 metric cards — Total Panels, Running, Expires Soon (within 3 days), Panel Usage % bar — all with sparkline SVGs and colored numbers
- **Panel cards:** each card shows panel name, language/type badge (JS/PY/HTML/FS), status dot (glowing green when running), days-remaining chip (red if <3 days), "Setup" overlay if newly claimed
- **Redeem code input:** inline input with Gift icon, redeems access codes
- **Create Panel button:** disabled if user has no premium slots; if premium, opens create dialog (name + type selector: Node.js / Python / Static Site / Full-Stack)
- **Empty state:** server rack SVG illustration + "No panels yet" message + Get Started link to pricing
- **Panel setup flow:** panels created via redeem code start as `ClaimedPanel_` — clicking them opens a setup dialog to choose name, type, and entry point before navigating to the panel page
- **Auto-delete expired:** panels expired >7 days auto-delete on dashboard load with a toast

### 4. Panel Page (`/panel/:id`)
**Header:**
- Back arrow → dashboard
- Language/type badge (JS / PY / HTML / FS) in colored box
- Panel name + expiry date (red if expired, amber if <3 days)
- Status pill: Online (green glow) / Deploying (amber pulse) / Error (red) / Offline (grey)

**Expired banner (when expired):**
- Red banner: "Panel Expired — renew to start your app. Auto-deleted in 7 days."
- "Renew Now" button → `/pricing`
- Start button becomes "Renew to Start" (red, disabled for running)

**Restart limit banner:**
- Shown when app restarted >10× in 3h and was auto-stopped
- "Upgrade" link → pricing

**Action bar:**
- Start | Restart | Stop | Delete (trash icon)
- Friendly startup error parsing: ENOENT → "entry point not found"; SyntaxError → "syntax error in code"; timeout → "app crashed on launch"; EADDRINUSE → "port conflict"; OOM → "out of memory"; npm/pip failure → "dependency install failed"

**Resource metrics row (when running):**
- CPU % bar, RAM MB bar (warn red at 80%), Uptime (live-counting), Restarts (warn amber at 7+/10)

**Public URL chip (new feature):**
- Shows the panel's live subdomain: `https://panelname.yourdomain.app` — tap to open, tap copy icon to copy
- Green "Live" badge when running, grey "Offline" when stopped

**Four tabs:**

**Console tab:**
- Full dark terminal (GitHub Dark `#0d1117` background)
- macOS window dots (red/yellow/green) + `panel — bash` title
- Live app logs stream in from top (PM2 via API, refresh every 3s when LIVE)
- Single `$` prompt input at bottom — NO mode switching — user types any shell command and presses Enter
- Command output interleaved naturally below each command
- Up/Down arrow key command history (last 100 commands)
- Running spinner while command executes
- LIVE / PAUSED toggle, manual Refresh button, Clear button
- Scroll-to-bottom button appears when user has scrolled up
- `clear` command clears the display, `help` prints usage tip

**Files tab:**
- GitHub Dark `#0d1117` background, VS Code style explorer
- Colored file type badges: PY=blue+yellow, JS=yellow+dark, TS=white+blue, TSX/JSX=cyan+dark, JSON=purple, HTML=white+orange, CSS=white+blue, SCSS=white+pink, MD=light+grey, SH=black+green, ENV=black+amber, YML/YAML=white+red, SQL=white+blue, LOG=green+dark
- Breadcrumb navigation (monospace, clickable segments)
- Toolbar: New File, New Folder, Upload (multi-file), Refresh — icon buttons
- File rows: 34px height, icon + name + size; hover reveals action icons: Edit ✏ / Rename / Download / Delete (red)
- Inline create/rename input (appears in toolbar area, no dialogs)
- Click file → inline code editor (replaces list view)
- Code editor: line numbers column (left), textarea (right), GitHub Dark background, green caret, monospace font, Ctrl+S saves, Tab inserts 2 spaces, dirty indicator (yellow dot in tab bar), language-colored status bar at bottom (language name + Ln/Col + keyboard hints)
- Click folder → navigate into it; back button + breadcrumb to go up

**Startup tab:**
- Entry point file field (e.g. `index.js`, `main.py`, `index.html`)
- For static sites: just serve the root directory (no entry point needed beyond `index.html`)
- Save button

**Settings tab:**
- Rename panel
- Change language/type
- Danger zone: delete panel (with confirmation)
- Subdomain display: shows the assigned subdomain, copy button

### 5. Pricing Page (`/pricing`)
**Horizontal card carousel (mobile-first, snap scroll):**
- 4 plan cards; starts centered on "Most Popular" (Basic plan, index 1)
- Each card snaps to center; non-focused cards scale to 97% and 70% opacity
- **Auto-swipe glider:** 5-second initial delay, then advances one card every 3.5 seconds, wraps around; permanently stops the moment user touches/clicks/wheels the carousel
- Dot indicators below (active dot is wider, primary color); clickable
- Desktop: prev/next arrow buttons on sides
- Swipe hint text on mobile, arrow hint on desktop

**Plan cards (per card):**
- Colored top border bar (gradient)
- Badge chip: "Most Popular" / "Best Value" / "Power User" / none (Starter)
- Icon + plan name + tagline + price (₦ formatted, `/month`)
- Spec chips (3-column grid): RAM chip, CPU chip, Storage chip — each with icon
- Feature checklist (5 items with colored circle check marks)
- CTA button full-width: "Get [Plan Name] →" — spins when loading
- Active card has colored border glow

**Plans:**
| Plan | Price (Kobo) | RAM | CPU | Storage | Badge |
|------|-------------|-----|-----|---------|-------|
| Starter | 140,000 | 500 MB | 0.5 cores | 1 GB | — |
| Basic | 250,000 | 1 GB | 1 core | 2 GB | Most Popular |
| Standard | 420,000 | 1.5 GB | 1.5 cores | 3 GB | Best Value |
| Pro | 650,000 | 2 GB | 2 cores | 4 GB | Power User |

**Below carousel:**
- "Included in every plan" 3-icon row: Auto-restart, Instant activation, 24/7 monitoring
- Support section: WhatsApp CTA button
- Terms/FAQ links
- Payment flow: Supabase Edge Function `paystack` → `action: 'initialize'` → redirect to Paystack URL; on return with `?reference=...` → `action: 'verify'` → success toast + navigate to dashboard

### 6. Admin Panel (`/admin`) — Admin-only
Role check: `user_roles` table, `role='admin'` for the current user. Non-admins redirect to dashboard.

**7 tabs:**

**Overview tab:**
- 4 KPI cards: Total Users, Active Panels, Monthly Revenue (₦), Pending Requests
- Revenue line chart (last 30 days)
- User growth bar chart
- Panel status donut chart

**Users tab:**
- Search bar (by email/username)
- User table: avatar initials, email, username, plan badge, panel count/limit, banned badge, created date
- Per-user actions (dropdown): View Panels (modal), Ban/Unban (with reason input), Adjust panel limit (inline edit), Delete account
- View Panels modal: shows all panels for that user with status badges and expiry dates; admin can delete individual panels

**Plans tab:**
- Card grid of all 4 plans with live purchase stats (total purchases, revenue per plan)
- Plan performance bar chart

**Codes tab (Redeem Codes):**
- Generate code dialog (plan picker cards → select Starter/Basic/Standard/Pro with icon and price; duration pill buttons: 30d / 60d / 90d / 180d / 1y; max uses pill buttons: 1 / 5 / 10 / 25 / Unlimited; optional panel count override input; generate button → shows code in success view with copy button)
- Codes table: code string (monospace), plan badge, uses (current/max), panels granted, expiry duration, created date, active toggle, copy & delete actions

**Notify tab:**
- Compose form: title + message textarea + type selector (info/success/warning) + Global toggle (vs specific user)
- User search autocomplete (when not global)
- Send button → inserts into `notifications` table
- Recent notifications list

**Finance tab:**
- Transactions table: user email, plan name, amount (₦), reference, date, status badge
- Revenue chart with date range filter
- Plan performance comparison

**Panels tab:**
- All panels across all users
- Search by name or user
- Table: panel name, user email, type badge, status dot, expiry date, actions (view, delete)

---

## New Feature: Static Site & Full-Stack Hosting + Subdomains

### Panel Types
Extend panels to support 4 types:
- `nodejs` — runs Node.js via PM2
- `python` — runs Python via PM2
- `static` — serves static HTML/CSS/JS via a built-in file server (nginx or serve)
- `fullstack` — Node.js/Python backend + static frontend; entry point is the backend

### Subdomain System
- Each panel gets a unique subdomain: `{panel-slug}.{platform-domain}.app`
- The subdomain resolves to the panel's running port via reverse proxy
- Subdomain is shown prominently in the Panel header and Settings tab with a copy button and an "Open ↗" link
- When the panel is stopped, visiting the subdomain shows a friendly "Panel is offline" page with the platform branding
- Admin panel shows all subdomains in the Panels tab

### Static Site Panel
- No entry point needed — just upload `index.html` and assets
- Files tab is the primary workflow: drag-upload HTML/CSS/JS/images
- Console tab still works for shell commands (running `ls`, `cat`, etc.)
- Status shows as "Serving" (green) instead of "Running"
- Subdomain serves the root of the file system

### Full-Stack Panel
- Entry point is the backend server file (e.g. `server.js`, `app.py`)
- Frontend files live in a `/public` or `/dist` subdirectory
- Backend must serve the frontend from the same port (standard Express/Flask pattern)
- Console, Files, Startup, Settings tabs all work the same as Node.js/Python panels

---

## Database Schema (Supabase)

```sql
-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  username TEXT,
  premium_status TEXT DEFAULT 'none', -- none | pending | approved | rejected
  panels_limit INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  role TEXT DEFAULT 'user' -- user | admin
);

-- Panels (hosting instances)
CREATE TABLE panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE, -- used for subdomain: {slug}.platform.app
  language TEXT DEFAULT 'nodejs', -- nodejs | python | static | fullstack
  status TEXT DEFAULT 'stopped', -- stopped | running | deploying | error
  entry_point TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Panel activity logs
CREATE TABLE panel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id UUID REFERENCES panels(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  log_type TEXT DEFAULT 'info', -- info | success | error | warning
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info', -- info | success | warning
  is_global BOOLEAN DEFAULT false,
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  reference TEXT UNIQUE NOT NULL,
  plan_id TEXT,
  amount INTEGER, -- in kobo
  status TEXT DEFAULT 'pending',
  panels_count INTEGER DEFAULT 1,
  panel_ram_mb INTEGER,
  panel_cpu_cores NUMERIC,
  panel_storage_mb INTEGER,
  duration_months INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Redeem codes
CREATE TABLE redeem_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  plan_id TEXT, -- starter | basic | standard | pro
  panels_granted INTEGER DEFAULT 1,
  duration_hours INTEGER DEFAULT 720,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Code redemptions (prevents double-use per user)
CREATE TABLE code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES redeem_codes(id),
  user_id UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(code_id, user_id)
);

-- Site settings (key-value store for admin config)
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Enable Realtime on: `panels`, `notifications`, `panel_logs`

---

## API Layer (vmApi)

All VM operations route through a Supabase Edge Function `vm-proxy`. The frontend `vmApi` module calls:

```typescript
vmApi.deploy(panelId, language)      // install deps
vmApi.start(panelId, language, entry) // start process via PM2
vmApi.stop(panelId)
vmApi.restart(panelId)
vmApi.delete(panelId)
vmApi.getStatus(panelId)             // returns { status, cpu, memory, uptime, restarts }
vmApi.getLogs(panelId, lines)        // returns { logs: { out, err } }
vmApi.clearLogs(panelId)
vmApi.exec(panelId, command)         // run arbitrary shell command, returns { stdout, stderr }
vmApi.listFiles(panelId, path)       // returns { files: FileEntry[] }
vmApi.getFileContent(panelId, path)  // returns { content }
vmApi.syncFiles(panelId, files)      // [{ path, content }] — save one or more files
vmApi.deleteFile(panelId, path)
vmApi.createDirectory(panelId, path)
```

---

## Supabase Edge Functions

### `paystack`
- `action: 'initialize'` → creates Paystack payment link, stores pending transaction, returns `{ authorization_url }`
- `action: 'verify'` → verifies reference with Paystack API, updates transaction status, grants panel slots to user, returns `{ success, status }`

---

## Auth & Access Control

- `useAuth` hook provides: `user`, `profile`, `isAdmin`, `isPremium`, `signOut`, `loading`
- `isAdmin`: check `user_roles` table for `role='admin'`
- `isPremium`: `profile.premium_status === 'approved'`
- Route guards: redirect to `/auth` if not logged in, redirect to `/dashboard` if not admin on `/admin`
- Profile auto-created on signup via Supabase trigger or in-app insert

---

## Key UX Details

### Loading State
Full-screen centered terminal-themed loader: spinning dashed SVG ring around a Terminal icon, `CONNECTING...` text in monospace. Same on panel page.

### Toast Notifications
Use shadcn/ui `useToast` for all feedback: success (default), error (`variant: 'destructive'`).

### Panel Card States
- `ClaimedPanel_*` name → show "Setup" badge + setup dialog on click
- Expired → red countdown, "Expired" badge
- Running → green glow dot
- Error → red dot

### Expiry Logic
- `expires_at < now` → show expired banner + disable Start (show "Renew to Start")
- `expires_at < now - 7 days` → auto-delete on dashboard load and panel page load

### Friendly Startup Errors
Parse raw error strings before showing to users:
- `ENOENT` / `no such file` → "Entry point not found. Upload your code or check Startup settings."
- `SyntaxError` → "Your code has a syntax error. Check the Console for details."
- `timeout` / `timed out` → "Startup timed out. Your app may have crashed."
- `EADDRINUSE` / `port` → "Port conflict. Try Restart instead."
- `memory` / `OOM` → "Out of memory. Upgrade your plan."
- `npm` / `pip` / `ModuleNotFoundError` / `Cannot find module` → "Dependency install failed. Check your package.json / requirements.txt."

### Restart Limit
Track `restarts_recent_3h` and `restart_limit_hit` in vmApi status response. Show warning banner at 7+/10, auto-stop at 10, show upgrade CTA.

### Real-time Panel Status
Poll `vmApi.getStatus()` every 10 seconds on the panel page; sync status back to Supabase if changed.

---

## File Manager Details

- **Theme:** GitHub Dark — background `#0d1117`, card `#161b22`, border `#21262d`, green `#3fb950`
- **Font:** JetBrains Mono / Fira Code (monospace throughout)
- **File type icon system:** colored square badges (14px×14px, border-radius 3px) — color-coded by extension:
  - PY: bg `#4584b6`, label yellow
  - JS: bg `#323330`, label `#f7df1e`
  - TS: bg `#3178c6`, label white
  - JSX/TSX: bg `#20232a`, label `#61dafb`
  - JSON: bg `#1e1b4b`, label `#c4b5fd`
  - HTML: bg `#e34c26`, label white
  - CSS: bg `#264de4`, label white
  - SCSS: bg `#cc6699`, label white
  - MD: bg `#2d3748`, label light
  - SH: bg `#3fb950`, label black
  - ENV: bg `#f0b429`, label black
  - YML/YAML: bg `#cb171e`, label white
  - SQL: bg `#00b0ff`, label white
- **Folders:** amber `#e3b341` folder icon (FolderOpen when navigated into)
- **Code editor:** line numbers left column, textarea right, `#0d1117` bg, `#e6edf3` text, `#3fb950` caret
- **Status bar:** language-colored background bar at bottom — language name + Ln/Col + keyboard shortcuts hint
- **Actions appear on hover** (opacity 0 → 1): Edit (pencil), Rename (dots), Download, Delete (red)

---

## Terminal / Console Details

- **Theme:** GitHub Dark — `#0d1117` bg, `#161b22` header/input bar, `#21262d` borders
- **Font:** JetBrains Mono monospace throughout
- **Header:** macOS dots (red `#ff5f56`, yellow `#ffbd2e`, green `#27c93f`), `panel — bash` title
- **Log line colors:**
  - `log` (app output): `#d1d5db`
  - `cmd` (user command `$ ...`): `#34d399` bold
  - `out` (command output): `#e5e7eb`
  - `err` (errors): `#f87171`
  - `sys` (system events): `#fbbf24`
  - `info` (info events): `#60a5fa`
- **Input bar:** `#161b22` bg, green `$` prefix, transparent input field, green caret
- **History:** up/down arrows navigate last 100 commands; buffer saves current draft
- **`clear` command:** clears all lines
- **`help` command:** prints usage tip about piping stdin for interactive scripts
- **LIVE/PAUSED toggle:** green pill when live, grey when paused
- **Auto-scroll:** follows new lines unless user scrolled up; scroll-to-bottom FAB appears when not at bottom
- **Running spinner:** Loader2 icon spins next to input while command executes

---

## Differences from v1 (Improvements)

1. **Static site hosting** — new panel type; serve plain HTML/CSS/JS with zero config
2. **Full-stack hosting** — new panel type; backend + frontend from one panel
3. **Public subdomains** — every panel gets `panelslug.platform.app` shown prominently with copy/open buttons
4. **Better landing page** — mentions all 4 hosting types, shows subdomain in hero terminal mockup
5. **Panel type selector** in create dialog — 4 clear options with icons and descriptions
6. **Subdomain shown in panel header** — always visible, not buried in settings
7. **Dashboard panel cards** show panel type badge more clearly (HTML badge, FS badge alongside JS/PY)
8. **Pricing cards** mention static + full-stack hosting in features list
9. **Everything else** from v1 is preserved and improved

---

## Important Implementation Notes

- Tailwind v4: use CSS variables directly in `index.css`; no `tailwind.config.js` needed for theme
- Google Fonts `@import` MUST be the very first line of `index.css`
- `notifications` and `site_settings` use `(supabase as any)` if not in generated types
- All vmApi calls go through the `vm-proxy` Edge Function — never call the VM server directly from frontend
- Paystack callback URL is `${window.location.origin}/pricing` — verify on return with `?reference=`
- Admin role check uses `user_roles` table, NOT a field on `profiles`
- Panel auto-delete on load: if `expires_at < now - 7 days`, delete via vmApi + Supabase, toast, redirect
- Pricing carousel: left/right spacer divs (width = `calc((100vw - cardWidth) / 2 - gap)`) allow first/last cards to center
- Auto-swipe: `useRef` for `activeIndexRef` and `autoSwipeActive` to avoid stale closures; kill on first `touchstart`/`mousedown`/`wheel`/`pointerdown`
- File editor dirty state tracked as `code !== saved`; localStorage draft key = `fm_{panelId}_{filePath}`
- Console command history: store in `useState<string[]>`, navigate with `histIdx` ref; buffer current input before going up
