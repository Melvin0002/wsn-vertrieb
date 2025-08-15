// src/server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import nodemailer from 'nodemailer';

dotenv.config();

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const port = process.env.PORT || 3000;

/* ---------- Security & Utils ---------- */
app.use(helmet({ contentSecurityPolicy: false })); // erlaubt inline Styles/CDNs
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use('/api/', limiter);

/* ---------- Static Files ---------- */
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h' }));

/* ---------- Nodemailer Transport ---------- */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true', // true = 465
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined,
  logger: String(process.env.SMTP_LOG || 'false') === 'true',
  tls: (String(process.env.SMTP_ALLOW_SELF_SIGNED || 'false') === 'true')
    ? { rejectUnauthorized: false }
    : undefined
});

async function sendMail(subject, fields) {
  const to = process.env.MAIL_TO;
  const from = process.env.MAIL_FROM || 'no-reply@wsn-vertrieb.de';
  if (!to) throw new Error('MAIL_TO fehlt');

  const rows = Object.entries(fields).map(([k, v]) => {
    const val = String(v ?? '—').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<tr><th align="left" style="padding:6px;border:1px solid #ddd">${k}</th>
            <td style="padding:6px;border:1px solid #ddd">${val}</td></tr>`;
  }).join('');

  const html = `
    <h3 style="font-family:Inter,Arial"> ${subject} </h3>
    <table style="border-collapse:collapse;border:1px solid #ddd;font-family:Inter,Arial">
      ${rows}
    </table>
  `;

  await transporter.sendMail({ from, to, subject, html });
}

/* ---------- API Routes ---------- */
app.post('/api/project', async (req, res) => {
  try {
    const d = req.body || {};
    if (!d.name || !d.email || !d.projektart || !d.beschreibung) {
      return res.status(400).json({ ok: false, error: 'Pflichtfelder fehlen.' });
    }
    await sendMail('Neue Projektanfrage – WSN-Vertrieb', {
      Name: d.name,
      Email: d.email,
      Telefon: d.telefon || '',
      Projektart: d.projektart,
      Beschreibung: d.beschreibung
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('Mail error', e?.code || '', e?.command || '', e?.response || e?.message);
    res.status(500).json({ ok: false, error: 'Serverfehler' });
  }
});

app.post('/api/application', async (req, res) => {
  try {
    const d = req.body || {};
    if (!d.name || !d.email || !d.telefon) {
      return res.status(400).json({ ok: false, error: 'Pflichtfelder fehlen.' });
    }
    await sendMail('Neue Bewerbung – WSN-Vertrieb', {
      Name: d.name,
      Email: d.email,
      Telefon: d.telefon,
      Erfahrung: d.erfahrung || '',
      'Über dich': d.ueber_dich || ''
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('Mail error', e?.code || '', e?.command || '', e?.response || e?.message);
    res.status(500).json({ ok: false, error: 'Serverfehler' });
  }
});

/* ---------- Healthcheck ---------- */
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

/* ---------- Single-Page Fallback ---------- */
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

/* ---------- Start Server (bind to 0.0.0.0!) ---------- */
app.listen(port, '0.0.0.0', () => {
  console.log(`WSN-Vertrieb server listening on ${port}`);
});

/* ---------- Graceful shutdown ---------- */
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT',  () => process.exit(0));
