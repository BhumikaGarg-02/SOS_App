# Chuppi-Todo (SOS App)

A privacy-first Progressive Web App (PWA) built to help people facing domestic abuse or coercive control record evidence and send silent distress alerts without raising suspicion.

When someone's phone is regularly checked, keeping a visible safety app or saving photos and voice recordings in the phone gallery isn't safe. Chuppi-Todo disguises itself as a normal everyday utility, encrypts captured evidence locally inside the browser, and uses dual-PIN routing to handle high-pressure situations.

## How It Works

- **Neutral Setup & Disguise Covers:** On first launch, the app appears as **Buddy**. During setup, the user picks one of three working disguises: **Ghar-Kharcha** (expense calculator), **CGPA Buddy** (GPA calculator), or **My Cycle** (period tracker). The browser tab title and favicon update dynamically to match the chosen cover and stay that way even when the hidden vault is open.
- **Dual-PIN Routing:**
  - Entering the **Real PIN** (e.g. `1947=` on the calculator) opens the encrypted **Private Vault**.
  - Entering the **Decoy PIN** (e.g. `0000=`) opens a working **Notes** app while silently logging an alert with GPS coordinates and emailing verified guardians in the background.
- **Zero-Gallery Encrypted Storage:** Photos, audio recordings, and text notes are encrypted in memory using the Web Crypto API (`AES-GCM`) and saved inside IndexedDB (`chuppi_db`). Nothing is saved to the device gallery or downloads folder.
- **SHA-256 Hash Chaining:** Each saved record generates a content hash linked to the previous record's seal hash (aligned with BSA Section 63). If anyone modifies even a single byte of stored data, verifying the seal flags a hash mismatch.
- **Quick Escape Tools:**
  - **Panic-Flip:** Automatically locks back to the active disguise screen if the user switches tabs or minimizes the window.
  - **Fake Call Escape:** Triggers an incoming call overlay with ringtone after a 5-second countdown (defaults to "Maa" or a chosen preset) and locks the screen when declined.
  - **Dead-Man Timer:** Armed via cover shortcut (`15*1=`) and cancelled via (`0*0=`). If not disarmed in time, it automatically dispatches a GPS alert email to guardians.
- **Anti-Defamation Controls:** Raw media downloads and right-click saving are disabled inside the vault. Guardians only receive read-only **Case Summary Packets** with incident timestamps, severity, location links, and SHA-256 hashes—never raw photos or audio.
- **Bilingual Support & Sahayata:** Full English and Hindi (`हिंदी | EN`) toggle across the app, along with quick reference cards for PWDVA 2005, POSH Act, BSA Section 63, and Indian helplines (112, 181, NCW, Sakhi One-Stop Centres).

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Storage & Security:** IndexedDB (`chuppi_db`), Web Crypto API (`AES-GCM`, `SHA-256`), Web Audio API
- **Alerts:** EmailJS (`@emailjs/browser`) for guardian OTP verification, silent SOS emails, and case summary packets

## Running Locally

1. Clone the repository:
   ```bash
   git clone [https://github.com/BhumikaGarg-02/SOS_App.git](https://github.com/BhumikaGarg-02/SOS_App.git)
   cd SOS_App
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root folder (see `.env.example`) and add your EmailJS keys:
   ```env
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

## EmailJS Template Setup

If you are setting up your own EmailJS account, set **To Email** to `{{to_email}}`, **Subject** to `{{subject}}`, and include these variables in the template body:
- `{{to_name}}`
- `{{alert_type}}`
- `{{timestamp}}`
- `{{message_body}}`
- `{{gps_link}}`

*Note: EmailJS is the only external network call made by the app. All evidence blobs, PINs, and keys stay strictly inside local browser storage.*

## Demo Shortcuts (Evaluator Mode)

For presentations
