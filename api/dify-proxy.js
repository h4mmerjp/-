export default async function handler(req, res) {
  // CORS ヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONSリクエスト（プリフライトリクエスト）に対応
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Environment variables check:', {
      hasApiUrl: !!process.env.DIFY_API_URL,
      hasApiKey: !!process.env.DIFY_API_KEY
    });

    const { pdf_data, file_name } = req.body;

    if (!process.env.DIFY_API_URL || !process.env.DIFY_API_KEY) {
      throw new Error('Environment variables not set');
    }

    const response = await fetch(process.env.DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: { pdf_data, file_name },
        response_mode: "blocking",
        user: "dental-clinic-user"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    res.status(200).json(result);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
