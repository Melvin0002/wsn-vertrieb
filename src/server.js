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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security & utils
app.use(helmet({ contentSecurityPolicy: false })); // allow inline styles from CDN
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use('/api/', limiter);

// Static
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1h' }));

// Mail transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined,
  logger: String(process.env.SMTP_LOG || 'false') === 'true',
  tls: (String(process.env.SMTP_ALLOW_SELF_SIGNED || 'false') === 'true') ? {
    rejectUnauthorized: false
  } : undefined
});

async function sendMail(subject, fields) {
  const to = process.env.MAIL_TO;
  const from = process.env.MAIL_FROM || 'no-reply@example.com';
  if (!to) throw new Error('MAIL_TO fehlt');

  const htmlTable = `
    <h3>${subject}</h3>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse">
      ${Object.entries(fields).map(([k,v]) => `<tr><th align="left">${k}</th><td>${String(v ?? '—')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')}</td></tr>`).join('')}
    </table>
  `;

  await transporter.sendMail({ from, to, subject, html: htmlTable });
}

// Routes
app.post('/api/project', async (req, res) => {
  try {
    const d = req.body || {};
    if (!d.name || !d.email || !d.projektart || !d.beschreibung) {
      return res.status(400).json({ ok: false, error: 'Pflichtfelder fehlen.' });
    }
    await sendMail('Neue Projektanfrage – WSN-Vertrieb', {
      Name: d.name, Email: d.email, Telefon: d.telefon || '',
      Projektart: d.projektart, Beschreibung: d.beschreibung
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('Mail error', e && (e.code || ''), e && (e.command || ''), e && (e.response || e.message || e.toString()));
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
      Name: d.name, Email: d.email, Telefon: d.telefon,
      Erfahrung: d.erfahrung || '', 'Über dich': d.ueber_dich || ''
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('Mail error', e && (e.code || ''), e && (e.command || ''), e && (e.response || e.message || e.toString()));
    res.status(500).json({ ok: false, error: 'Serverfehler' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`WSN-Vertrieb EMAIL-only server on :${port}`);
});
