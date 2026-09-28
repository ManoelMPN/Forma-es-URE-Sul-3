export default async function handler(req, res) {
  try {
    const rawUrl = (req.query && req.query.url) || (req.body && req.body.url);
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ error: 'URL da planilha não fornecida.' });
    }

    const trimmedUrl = rawUrl.trim();

    // Fetch directly from Google Apps Script Web App /exec or spreadsheet link
    const directResp = await fetch(trimmedUrl, {
      headers: {
        Accept: 'application/json, text/csv, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; URESul3Bot/1.0)',
      },
      redirect: 'follow',
    });

    if (!directResp.ok) {
      return res.status(directResp.status).json({
        error: `Servidor da planilha respondeu com status ${directResp.status}: ${directResp.statusText}. Verifique se o link está com acesso liberado para "Qualquer pessoa".`,
      });
    }

    const contentType = directResp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const jsonData = await directResp.json();
      return res.status(200).json(jsonData);
    }

    const textData = await directResp.text();
    return res.status(200).send(textData);
  } catch (err) {
    console.error('Vercel serverless /api/fetch-sheet error:', err);
    return res.status(500).json({ error: 'Erro ao buscar planilha no Vercel: ' + (err?.message || err) });
  }
}
