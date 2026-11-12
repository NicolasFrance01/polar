import crypto from 'crypto';
import { query } from './db.js';

const TOKEN_SECRET = process.env.AUTH_SECRET || process.env.DATABASE_URL || 'polar-fallback-secret-2026';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function signToken(payload) {
  const data = {
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

let schemaEnsured = false;
async function ensureUsersSchemaAndMaster() {
  if (schemaEnsured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      email VARCHAR(100) UNIQUE,
      username VARCHAR(100) UNIQUE,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      phone VARCHAR(50),
      password_hash TEXT,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;`);
  await query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL;`).catch(() => {});

  // Ensure master user exists with encrypted password
  const masterCheck = await query(`SELECT id, password_hash FROM users WHERE username = 'master' OR id = 'usr-master' LIMIT 1`);
  if (masterCheck.rowCount === 0) {
    const masterHash = hashPassword('Ndf010399@');
    await query(
      `INSERT INTO users (id, username, email, name, role, phone, password_hash, active)
       VALUES ('usr-master', 'master', 'master@polar.com', 'Master Admin', 'admin', '5493512345678', $1, true)
       ON CONFLICT (id) DO UPDATE SET username = 'master', password_hash = EXCLUDED.password_hash`,
      [masterHash]
    );
  } else if (!masterCheck.rows[0].password_hash) {
    const masterHash = hashPassword('Ndf010399@');
    await query(`UPDATE users SET username = 'master', password_hash = $1 WHERE id = $2`, [masterHash, masterCheck.rows[0].id]);
  }

  // Ensure default drivers exist so they can be selected in Repartir
  const driversCheck = await query(`SELECT COUNT(*) FROM users WHERE role = 'repartidor'`);
  if (parseInt(driversCheck.rows[0].count, 10) === 0) {
    const drv1Hash = hashPassword('polar123');
    const drv2Hash = hashPassword('polar123');
    await query(
      `INSERT INTO users (id, username, email, name, role, phone, password_hash, active)
       VALUES
       ('usr-marcos', 'marcos', 'chofer1@polar.com', 'Marcos Gutiérrez', 'repartidor', '5491155550100', $1, true),
       ('usr-sofia', 'sofia', 'chofer2@polar.com', 'Sofía Ramos', 'repartidor', '5491155550200', $2, true)
       ON CONFLICT (id) DO NOTHING`,
      [drv1Hash, drv2Hash]
    );
  }

  schemaEnsured = true;
}

export default async function handler(req, res) {
  const { method } = req;

  try {
    await ensureUsersSchemaAndMaster();

    if (method === 'GET') {
      const { type, token } = req.query || {};

      // Verify token via query or Authorization header
      if (type === 'verify') {
        const authHeader = req.headers?.authorization || '';
        const rawToken = token || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '');
        const decoded = verifyToken(rawToken);
        if (!decoded) {
          return res.status(401).json({ valid: false, error: 'Sesión inválida o expirada' });
        }
        return res.status(200).json({ valid: true, user: decoded });
      }

      // List team users (without exposing password_hash)
      const result = await query(`
        SELECT id, username, email, name, role, phone, active, created_at
        FROM users
        WHERE active = true
        ORDER BY created_at ASC
      `);
      return res.status(200).json(result.rows);
    }

    if (method === 'POST') {
      const { action } = req.body || {};

      if (action === 'login') {
        const { username, password } = req.body;
        if (!username || !password) {
          return res.status(400).json({ error: 'Ingresá usuario y contraseña.' });
        }

        const lookup = String(username).trim().toLowerCase();
        const result = await query(
          `SELECT id, username, email, name, role, phone, password_hash, active
           FROM users
           WHERE (LOWER(username) = $1 OR LOWER(email) = $1) AND active = true
           LIMIT 1`,
          [lookup]
        );

        if (result.rowCount === 0) {
          return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        const user = result.rows[0];
        if (!verifyPassword(String(password), user.password_hash)) {
          return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        const userPayload = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone
        };
        const token = signToken(userPayload);
        return res.status(200).json({ success: true, token, user: userPayload });
      }

      if (action === 'verify') {
        const { token } = req.body;
        const decoded = verifyToken(token);
        if (!decoded) {
          return res.status(401).json({ valid: false, error: 'Sesión inválida o expirada' });
        }
        return res.status(200).json({ valid: true, user: decoded });
      }

      if (action === 'create_user') {
        const { username, email, name, role, phone, password } = req.body;
        if (!username || !name || !password) {
          return res.status(400).json({ error: 'Usuario, nombre y contraseña requeridos.' });
        }
        const id = `usr-${Date.now()}`;
        const passwordHash = hashPassword(password);
        const cleanUsername = String(username).trim().toLowerCase();
        const result = await query(
          `INSERT INTO users (id, username, email, name, role, phone, password_hash, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)
           RETURNING id, username, email, name, role, phone, active, created_at`,
          [id, cleanUsername, email || `${cleanUsername}@polar.com`, name, role || 'repartidor', phone || '', passwordHash]
        );
        return res.status(201).json(result.rows[0]);
      }

      return res.status(400).json({ error: 'Acción desconocida' });
    }

    if (method === 'DELETE') {
      const { id } = req.query || {};
      if (!id || id === 'usr-master') {
        return res.status(400).json({ error: 'No se puede eliminar el usuario master.' });
      }
      await query(`UPDATE users SET active = false WHERE id = $1`, [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: `Method ${method} not allowed` });
  } catch (error) {
    console.error('API auth error:', error);
    return res.status(500).json({ error: error.message });
  }
}

