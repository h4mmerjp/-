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
    console.log('PDF received successfully');
    
   // 実際のDify API呼び出し版
const response = await fetch(process.env.DIFY_API_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    inputs: { query: `PDFデータを解析: ${pdf_data}` },
    response_mode: "blocking",
    user: "dental-clinic-user"
  })
});
    
    // 1秒待機してリアルな感じを演出
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.status(200).json(mockResponse);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
