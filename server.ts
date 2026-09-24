import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import * as xlsx from 'xlsx';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Admin access password requested by user
const ADMIN_PASSWORD = '343950';
const DATA_DIR = path.join(process.cwd(), 'server_data');
const DATA_FILE = path.join(DATA_DIR, 'app_data.json');
const APP_DATABASE_FILE = path.join(process.cwd(), 'src', 'data', 'database.json');

function readStoredData() {
  try {
    if (fs.existsSync(APP_DATABASE_FILE)) {
      const raw = fs.readFileSync(APP_DATABASE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.teachers) && parsed.teachers.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler src/data/database.json:', err);
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao ler dados do servidor:', err);
  }
  return null;
}

function writeStoredData(data: any) {
  try {
    // 1. Write directly to src/data/database.json so data stays inside the app codebase
    const appDataDir = path.dirname(APP_DATABASE_FILE);
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(APP_DATABASE_FILE, jsonString, 'utf-8');

    // 2. Also write to server_data/app_data.json
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, jsonString, 'utf-8');

    // 3. Also write to public/database.json and public/data/database.json for Vercel static CDN serving
    try {
      const publicDir = path.join(process.cwd(), 'public');
      const publicDataDir = path.join(publicDir, 'data');
      if (!fs.existsSync(publicDataDir)) {
        fs.mkdirSync(publicDataDir, { recursive: true });
      }
      fs.writeFileSync(path.join(publicDir, 'database.json'), jsonString, 'utf-8');
      fs.writeFileSync(path.join(publicDataDir, 'database.json'), jsonString, 'utf-8');
    } catch (e) {
      console.warn('Erro ao gravar public/database.json:', e);
    }

    // 4. Commit to git as requested by user
    try {
      execSync('git add src/data/database.json server_data/app_data.json public/database.json public/data/database.json && git commit -m "chore: atualizar dados de formação da planilha [ADM]" || true', {
        cwd: process.cwd(),
        stdio: 'ignore',
      });
      console.log('Git commit realizado com sucesso para a atualização dos dados da planilha.');
    } catch (gitErr) {
      console.warn('Git commit aviso:', gitErr);
    }

    return true;
  } catch (err) {
    console.error('Erro ao salvar dados no servidor/app:', err);
    return false;
  }
}

/**
 * Public endpoint to get current saved spreadsheet data.
 * All visitors see the fully prefilled dashboard without configuring anything.
 */
app.get('/api/app-data', (_req: Request, res: Response) => {
  const data = readStoredData();
  if (data && Array.isArray(data.teachers) && data.teachers.length > 0) {
    return res.json({
      hasData: true,
      teachers: data.teachers,
      lastUpdated: data.lastUpdated || '--/--/----',
      onlineUrl: data.onlineUrl || '',
      autoSyncEnabled: data.autoSyncEnabled !== false,
      savedAt: data.savedAt || null,
    });
  }
  return res.json({
    hasData: false,
    teachers: [],
    lastUpdated: '--/--/----',
    onlineUrl: data?.onlineUrl || '',
    autoSyncEnabled: data?.autoSyncEnabled !== false,
  });
});

/**
 * Verify admin password (343950).
 */
app.post('/api/verify-admin', (req: Request, res: Response) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, authorized: true });
  }
  return res.status(401).json({ error: 'Senha incorreta. Apenas o administrador autorizado pode conectar a planilha.' });
});

/**
 * Save data from spreadsheet or file on the server.
 * Protected with password: 343950.
 */
app.post('/api/save-data', (req: Request, res: Response) => {
  const { password, teachers, lastUpdated, onlineUrl, autoSyncEnabled } = req.body || {};

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta. Apenas o administrador autorizado pode salvar a planilha.' });
  }

  if (!Array.isArray(teachers)) {
    return res.status(400).json({ error: 'Dados de docentes inválidos.' });
  }

  const current = readStoredData() || {};
  const payload = {
    teachers,
    lastUpdated: lastUpdated || new Date().toLocaleString('pt-BR'),
    onlineUrl: onlineUrl !== undefined ? onlineUrl : (current.onlineUrl || ''),
    autoSyncEnabled: autoSyncEnabled !== undefined ? autoSyncEnabled : true,
    savedAt: new Date().toISOString(),
  };

  const ok = writeStoredData(payload);
  if (!ok) {
    return res.status(500).json({ error: 'Falha ao salvar dados no disco do servidor.' });
  }

  return res.json({
    success: true,
    message: 'Dados gravados no servidor com sucesso para todos os usuários.',
    teachersCount: teachers.length,
    lastUpdated: payload.lastUpdated,
    savedAt: payload.savedAt,
  });
});

/**
 * Clear data on server.
 * Protected with password: 343950.
 */
app.post('/api/reset-data', (req: Request, res: Response) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta. Operação não autorizada.' });
  }
  writeStoredData({
    teachers: [],
    lastUpdated: '--/--/----',
    onlineUrl: '',
    autoSyncEnabled: true,
  });
  return res.json({ success: true, message: 'Dados restaurados no servidor.' });
});

/**
 * Robust server-side proxy to fetch Google Sheets or Google Apps Script.
 * Bypasses all browser CORS restrictions and automatically converts
 * Google Sheet URLs into multi-tab JSON.
 */
app.all('/api/fetch-sheet', async (req: Request, res: Response) => {
  try {
    const rawUrl = (req.query.url as string) || (req.body && (req.body.url as string));

    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ error: 'URL da planilha não fornecida.' });
    }

    const trimmedUrl = rawUrl.trim();

    // 1. If it's a Google Spreadsheet URL
    // Supports:
    // - docs.google.com/spreadsheets/d/{ID}/edit
    // - docs.google.com/spreadsheets/d/{ID}/...
    // - docs.google.com/spreadsheets/d/e/{PUBLISHED_ID}/pubhtml
    const spreadsheetIdMatch = trimmedUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const isPublishedUrl = trimmedUrl.includes('/pubhtml') || trimmedUrl.includes('/pub?');

    if (spreadsheetIdMatch && spreadsheetIdMatch[1] && !trimmedUrl.includes('/d/e/')) {
      const spreadsheetId = spreadsheetIdMatch[1];
      // Google Sheets allows exporting the entire workbook as XLSX directly
      const exportXlsxUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

      try {
        const xlsxResp = await fetch(exportXlsxUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          redirect: 'follow',
        });

        if (xlsxResp.ok) {
          const contentType = xlsxResp.headers.get('content-type') || '';
          // Verify it returned binary/spreadsheet, not an HTML login redirect
          if (contentType.includes('spreadsheet') || contentType.includes('octet-stream') || contentType.includes('zip')) {
            const arrayBuffer = await xlsxResp.arrayBuffer();
            const workbook = xlsx.read(new Uint8Array(arrayBuffer), { type: 'array' });

            const sheetsData: Record<string, any[]> = {};
            workbook.SheetNames.forEach((sheetName) => {
              const worksheet = workbook.Sheets[sheetName];
              const rows = xlsx.utils.sheet_to_json<any>(worksheet, { defval: '' });
              sheetsData[sheetName] = rows;
            });

            return res.json({
              title: `Planilha Google (${spreadsheetId})`,
              updatedAt: new Date().toISOString(),
              sheets: sheetsData,
            });
          }
        }
      } catch (xlsxErr) {
        console.warn('XLSX export failed, trying direct Apps Script or fetch fallback:', xlsxErr);
      }
    }

    // If published link (/pubhtml), convert to published xlsx or csv
    if (isPublishedUrl) {
      const publishedXlsxUrl = trimmedUrl.replace(/\/pubhtml.*$/, '/pub?output=xlsx');
      try {
        const pubResp = await fetch(publishedXlsxUrl, { redirect: 'follow' });
        if (pubResp.ok) {
          const arrayBuffer = await pubResp.arrayBuffer();
          const workbook = xlsx.read(new Uint8Array(arrayBuffer), { type: 'array' });
          const sheetsData: Record<string, any[]> = {};
          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json<any>(worksheet, { defval: '' });
            sheetsData[sheetName] = rows;
          });
          return res.json({
            title: 'Planilha Google Publicada',
            updatedAt: new Date().toISOString(),
            sheets: sheetsData,
          });
        }
      } catch (pubErr) {
        console.warn('Published XLSX export failed:', pubErr);
      }
    }

    // 2. Fetch directly (e.g. Google Apps Script Web App /exec or published CSV/JSON)
    const directResp = await fetch(trimmedUrl, {
      headers: {
        Accept: 'application/json, text/csv, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; URESul3Bot/1.0)',
      },
      redirect: 'follow',
    });

    if (!directResp.ok) {
      return res.status(directResp.status).json({
        error: `Servidor da planilha respondeu com erro ${directResp.status}: ${directResp.statusText}. Verifique se o link está público ou se o Web App foi implantado para "Qualquer pessoa".`,
      });
    }

    const contentType = directResp.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const jsonData = await directResp.json();
      return res.json(jsonData);
    }

    // If it's text/html or text/csv, try parsing or handle errors
    const textData = await directResp.text();

    try {
      const parsedJson = JSON.parse(textData);
      return res.json(parsedJson);
    } catch {
      // Check if it's HTML login page
      if (textData.includes('<html') || textData.includes('<!DOCTYPE html>')) {
        return res.status(403).json({
          error:
            'A planilha ou o Google Apps Script exigiu login. No Google Apps Script, defina "Quem pode acessar" como "Qualquer pessoa" (não apenas sua conta). Na planilha Google, certifique-se de que o acesso esteja como "Qualquer pessoa com o link".',
        });
      }

      // If it's CSV text
      const workbook = xlsx.read(textData, { type: 'string' });
      const firstSheet = workbook.SheetNames[0];
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
      return res.json({
        title: 'Planilha CSV',
        updatedAt: new Date().toISOString(),
        sheets: {
          Dados: rows,
        },
      });
    }
  } catch (err: any) {
    console.error('Erro no proxy da planilha:', err);
    return res.status(500).json({
      error: `Falha ao conectar na planilha: ${err.message || String(err)}`,
    });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando com sucesso em http://0.0.0.0:${PORT}`);
  });
}

startServer();
