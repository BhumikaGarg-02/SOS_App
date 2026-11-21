# Ghar-Kharcha (Chuppi-Todo) — Final Complete System

**Ghar-Kharcha** (internally *Chuppi-Todo*) is a 100% client-side, offline-first, mobile-first Progressive Web Application (PWA). It functions as a stealth personal-safety and tamper-evident documentation platform for domestic abuse and harassment survivors in India. To any family member or observer inspecting the device, the app appears and behaves identically to an everyday household utility (Grocery Expense Calculator, CGPA Attendance Buddy, or Wellness & Cycle Tracker).

---

## Architecture & Technology Stack

- **Framework**: React 18 + Vite + TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 3 (custom color palettes per cover, base 16px font, >=48px touch targets)
- **State Management**: Zustand
- **Local Database**: IndexedDB (via `idb`)
- **PWA & Offline**: `vite-plugin-pwa` with Service Worker auto-update caching and offline fallback
- **Cryptography**: Web Crypto API (PBKDF2-SHA256 with 210,000 iterations, AES-GCM-256, SHA-256 tamper-evident hash chaining)
- **Fonts**: `@fontsource/inter`, `@fontsource/poppins`, `@fontsource/noto-sans-devanagari` (100% bundled offline, zero external CDNs)
- **Audio Engine**: Web Audio API two-tone telephone synthesizer (440 Hz & 480 Hz) with vibration fallback
- **Zero Backend**: No remote servers, no analytics, no external trackers, no paid APIs. Everything works offline.

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation
```bash
npm install
```

### Development Server (HMR enabled, no CSP)
```bash
npm run dev
```

### Production Build & Preview (with Production CSP and Service Worker)
```bash
npm run build
npm run preview
```

### Type Checking
```bash
npx tsc --noEmit
```

---

## 10-Minute Viva Demo Script

Follow this step-by-step walkthrough to demonstrate all features to evaluators in ~10 minutes:

### 1. Onboarding & Gate Enforcement (0:00 - 1:30)
1. Launch the app in your browser (`http://localhost:5173` or preview).
2. **Age Gate**: Notice that clicking Continue is disabled until all three legal/safety acknowledgements are checked:
   - *Only for own safety*
   - *Not for tracking or false accusations*
   - *Alerts go to Trusted Guardians, never directly to police*
3. **Guardians**:
   - Add contact "Maa" with phone `9876543210`. Click "Send OTP".
   - Notice the OTP hint displayed in the Demo Control Bar (`1234`). Enter `1234` and click Verify.
   - Add second contact "Sister" (`9812345678`), send OTP, enter `1234`, verify.
   - Point out that Continue remains disabled until at least 2 guardians are verified. Click Continue.
4. **PIN Setup**:
   - In Demo Control Bar, click **"Fill demo PINs"** (fills Real PIN `1947` and Decoy PIN `0000`).
   - Mention that PINs are hashed using PBKDF2 with 210,000 rounds and random 16-byte salts; raw PINs are never stored. Click Continue.
5. **Choose Cover**:
   - Select **Ghar-Kharcha (Grocery Calculator)** and finish setup. The app lands on the calculator cover.

### 2. Cover Triggers & Math Evaluator (1:30 - 2:30)
1. **Normal Calculator Usage**:
   - Type `2+3×4=` → Output is `14` (demonstrating standard arithmetic precedence).
   - Add items to the bill: select "Atta", type `120`, press `+`, see the bill tally.
2. **Stealth Triggers**:
   - Type `15*1=` → Displays `15`. Notice the tiny **StealthDot** (top-left) shifts to a darker tone (`#9AA0A6`), confirming dead-man timer is armed.
   - Type `0*0=` → Displays `0`. StealthDot shifts back to light grey (`#C9CDD2`), disarming the timer.
3. **Secondary Covers (CGPA & My Cycle)**:
   - In Demo Control Bar, change active cover to `CGPA Buddy`: Roll Code `1947` + Calculate unlocks Vault; attended `0` & total `15` arms timer.
   - Change to `My Cycle`: tap center dial, enter `1947` to unlock; water count `15` arms timer.

### 3. Decoy Flow (Fake Vault & Silent SOS) (2:30 - 3:30)
1. On Ghar-Kharcha, type `0000=` (Decoy PIN).
2. The screen instantly opens **Fake Vault ("My Notes")**, displaying innocent shopping lists, recipes, and study notes.
3. Check the **Demo Control Bar Event Log**:
   - An emergency `[SOS]` alert was silently logged with GPS coordinates and simulated guardian recipients. The coercer suspects nothing.

### 4. Real Vault & Evidence Engine (3:30 - 5:00)
1. Lock or return to Ghar-Kharcha, type `1947=` to unlock the **Real Vault**.
2. **Record Tab**:
   - **Voice**: Click Record, speak into the mic, observe the live RMS level bar and timer, click Stop.
   - Select severity **High** and tag **Threat**. Click **Save Evidence**.
   - Notice the quiet inline confirmation: `Saved and sealed — [a3f9…c21]`. No loud toasts or popups.
   - Explain the cryptographic sequence: Plaintext bytes → SHA-256 hash → AES-GCM-256 encryption with the ephemeral session key → Chained to previous record's seal.

### 5. Tamper-Evident Chain & Verification (5:00 - 6:30)
1. In the Demo Control Bar, click **"Seed 8 P2"**:
   - 8 chronologically spaced records (notes, audio, photos) over the past 3 weeks are created and sealed.
2. Go to the **Timeline** tab:
   - Observe the 8-week inline SVG trend sparkline, severity distribution bar, and top tag.
3. **Verify Seal (Clean)**:
   - Tap **"Verify Seal"** on any card.
   - Observe the green badge: `100% Untampered • Valid SHA-256 Hash` (Hindi: `100% अपरिवर्तित • मान्य SHA-256 हैश`).
4. **Tamper Test**:
   - In the Demo Control Bar, click **"Tamper"** (flips 1 bit in ciphertext in IndexedDB).
   - Click **Verify Seal** on the tampered card in Timeline.
   - The badge immediately turns red: `Seal mismatch: content hash mismatch`.
5. **Restore**:
   - Click **"Restore"** in Demo Control Bar → Tap **Verify Seal** → Returns to green untampered badge.

### 6. Case Summary Packet (6:30 - 7:30)
1. In Timeline, select 2 or 3 records using "Add to Case Packet" checkboxes.
2. Tap **"Generate Case Summary Packet"**.
3. Point out:
   - "Read-only • Not for social media" banner.
   - Case ID, date range, incident count, and chain head hash.
   - Entries show timestamps, GPS, severity, content hash, and seal hash. **Zero raw media is exposed** (protecting the survivor from non-consensual media circulation).
4. Tap **"Send to Guardians"** → Logs simulated dispatch to verified contacts.

### 7. Dead-Man Timer in Viva Mode (7:30 - 8:30)
1. In Demo Control Bar, observe timer mode is set to **15 sec (Viva Demo)**.
2. Click **"Arm timer"** (or use cover trigger `15*1=` or 3-second long press on the header title).
3. Wait 15 seconds:
   - When the countdown reaches 0, the dead-man switch fires an automated emergency alert to all verified guardians with GPS location and vault access link.

### 8. Fake Call Escape (8:30 - 9:15)
1. **Trigger A (Cover Hot-Zone)**:
   - On the cover, double-tap the invisible 56x56 hot-zone in the bottom-right corner.
   - Nothing visible happens for 5 seconds (preventing suspicion).
   - After 5s, the full-screen stock Android incoming call UI appears, playing the two-tone Web Audio ringtone.
2. **Trigger B (Vault Escape Button)**:
   - In Vault Record tab, tap **"Fake Call Escape (5s Delay)"**.
   - A 5-second countdown with Cancel button appears.
3. Tap **Accept** → Transitions to **Active Call** screen with live `mm:ss` counter and decorative mute/speaker controls.
4. Tap **End Call** or **Decline** → Returns safely to the cover app.

### 9. Sahayata Tab & Offline Legal Guidance (9:15 - 9:45)
1. In Vault, switch to the **Sahayata** tab.
2. Demonstrate the 5 offline accordion guides:
   - *Helplines*: NCW (7827170170), Women Helpline (181), Sakhi Centres. Tap to copy number with visual feedback; user-tapped Call link (never auto-dial).
   - *Rights under PWDVA 2005*: Domestic violence definitions, residence rights, protection orders.
   - *Workplace POSH Act 2013*: Internal/Local Committee procedures, 3-month window, confidentiality.
   - *Digital Evidence Checklist*: Unaltered media, metadata preservation, BSA 2023 Section 63 certificate requirements.
   - *Immediate Danger Protocol*: Safe exit guidance.
3. Notice the mandatory disclaimer on every card: *"General information, not legal advice."*

### 10. Panic-Flip & Presenting Override (9:45 - 10:00)
1. Inside the Vault, switch browser tabs, press Alt-Tab, or click "Lock".
2. The screen instantly flips to the cover in **<100ms** (measured and logged in Demo Control Bar).
3. The in-memory AES session key is erased from memory; any active camera or mic recording is immediately terminated.
4. Show **"Disable auto-lock (presenting)"** switch in Demo Control Bar: explain that enabling this prevents tab-switch locks during screen sharing, while keeping manual Lock buttons active.

---

## Simulated Components Table

| Component | In Real Deployment | In This Offline Prototype | Rationale |
|---|---|---|---|
| **Guardian OTP** | SMS delivered via telecom aggregator (Twilio / Gupshup / Fast2SMS). | Auto-generated 4-digit code shown in Demo Bar (`lastOtpHint`). Entering code marks contact verified. | 100% offline requirement; evaluators can test immediately without SMS costs or network delays. |
| **Emergency SOS / Dead-Man Dispatch** | Encrypted SMS and push notification to guardians with location coordinates. | Stored in IndexedDB `alerts` store and logged in the Demo Bar Event Log with simulated payload summary. | Zero backend requirement; strictly prohibits accidental emergency service or real phone calls. |
| **GPS Geolocation** | Device hardware GPS via `navigator.geolocation`. | `navigator.geolocation` with 5s timeout; fallback to New Delhi (`28.6139, 77.2090`), overridable via Demo Bar. | Ensures tests pass in headless CI environments, desktops without GPS hardware, or permission denials. |
| **Fake Call Audio** | Native OS incoming call screen. | Web Audio API synthesizing 440 Hz & 480 Hz cadence with HTML5 canvas/DOM styling matching stock Android. | Client-side PWA capability without native platform wrappers. |

---

## Honest Limitations

1. **Tamper-Evident, Not Tamper-Proof**:
   - The cryptographic SHA-256 hash chain makes any alteration, record deletion, or re-ordering detectable upon verification (`verifySeal`). However, because the app is 100% client-side without an external distributed ledger or remote RFC 3161 timestamping authority, timestamps rely on the device clock.
2. **Browser Storage Eviction**:
   - Data is stored in IndexedDB. If the user clears browser data or the host OS faces extreme storage pressure, browser storage may be purged unless the PWA is installed and persistent storage is granted.
3. **Fixed PWA Application Name**:
   - The manifest name is set to "Ghar-Kharcha". Web standards do not allow a web app to dynamically change its home screen icon or title post-installation.
4. **No Native Background SMS Delivery**:
   - In a web browser environment, true background SMS dispatch without user confirmation is blocked by browser security sandboxes. Production deployment would require a backend relay service or native Android companion service.

---

## Browser & Hardware Compatibility Notes

- **Microphone & Camera Permissions**: Modern browsers require `localhost` or an `HTTPS` origin to grant `getUserMedia` access.
- **iOS Safari Considerations**:
  - iOS Safari has limited `MediaRecorder` codec support (uses `audio/mp4`).
  - Window `blur` events on iOS Safari may fire inconsistently on home bar gestures compared to `visibilitychange`.
- **Audio Autoplay Policy**: Browsers block audio playback without prior user interaction. The app unlocks the Web Audio context on the first user tap anywhere on the screen (`ensureAudioUnlocked`).
