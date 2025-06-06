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
    
    // 模擬的なDifyレスポンス
    const mockResponse = {
      data: {
        outputs: {
          "__is_success": 1,
          "__reason": null,
          "shaho_count": "42",
          "shaho_amount": "130,500",
          "kokuho_count": "4",
          "kokuho_amount": "6,050",
          "kouki_count": "5",
          "kouki_amount": "3,390",
          "jihi_count": "1",
          "jihi_amount": "10,060",
          "bushan_note": "物販",
          "bushan_amount": "1,560",
          "previous_difference": "-700"
        }
      }
    };
    
    // 1秒待機してリアルな感じを演出
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.status(200).json(mockResponse);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
