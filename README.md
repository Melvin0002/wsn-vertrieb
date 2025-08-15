# WSN-Vertrieb – EMAIL-only Version

- Externe `public/app.js` sorgt dafür, dass die Modals zuverlässig öffnen.
- Formulare posten an `/api/project` und `/api/application`, Server sendet **nur E-Mail** via SMTP (Nodemailer).

## Start
1. `cp .env.example .env` und SMTP/MAIL_* ausfüllen
2. `npm install`
3. `npm start`
4. http://localhost:3000 öffnen

## One.com SMTP Schnellwerte
- Host: `send.one.com`
- Port: `465` (SMTP_SECURE=true) **oder** `587` (SMTP_SECURE=false)
- User: volle E-Mail-Adresse
- Pass: Mail-Passwort


## Troubleshooting (Buttons öffnen kein Modal)
- Browser **Hard-Reload**: `Strg+F5` / `Cmd+Shift+R`
- DevTools → **Console**: siehst du `[WSN] app.js loaded`?
- Netzwerk-Tab: lädt **/app.js** mit Status **200**?
- Pfadkonflikt? Wenn die Seite nicht im Root liegt, setze `<script defer src="/app.js"></script>`
