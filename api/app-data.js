import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const candidates = [
      path.join(process.cwd(), 'src', 'data', 'database.json'),
      path.join(process.cwd(), 'public', 'database.json'),
      path.join(process.cwd(), 'server_data', 'app_data.json'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        const raw = fs.readFileSync(candidate, 'utf-8');
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(raw);
      }
    }
  } catch (err) {
    console.error('Vercel serverless /api/app-data error:', err);
  }

  return res.status(200).json({ hasData: false, teachers: [] });
}
