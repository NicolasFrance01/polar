import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const result = await query('SELECT NOW() as now, current_database() as db');
    return res.status(200).json({
      status: 'ok',
      database: result.rows[0].db,
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
