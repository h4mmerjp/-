export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdf_data, file_name } = req.body;

    // Base64をBufferに変換
    const buffer = Buffer.from(pdf_data, 'base64');
    
    // FormDataを作成
    const FormData = require('form-data');
    const form = new FormData();
    
    // ファイルとして追加
    form.append('file', buffer, {
      filename: file_name || 'document.pdf',
      contentType: 'application/pdf'
    });
    
    // その他のパラメータ
    form.append('inputs', JSON.stringify({}));
    form.append('response_mode', 'blocking');
    form.append('user', 'dental-clinic-user');

    const response = await fetch(process.env.DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        ...form.getHeaders()
      },
      body: form
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
