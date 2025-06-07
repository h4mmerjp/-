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

    // 環境変数の確認
    if (!process.env.DIFY_API_URL || !process.env.DIFY_API_KEY) {
      throw new Error('Environment variables not configured');
    }

    console.log('Processing PDF:', file_name);

    // 実際のDify APIを呼び出し
    const response = await fetch(process.env.DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: { 
          query: `以下のPDFデータから歯科医院の日計表データを抽出してください。ファイル名: ${file_name}\n\nBase64データ: ${pdf_data}`
        },
        response_mode: "blocking",
        user: "dental-clinic-user"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dify API Error:', response.status, errorText);
      
      // Dify APIエラー時はフォールバック（テストデータ）
      return res.status(200).json({
        data: {
          outputs: {
            "__is_success": 0,
            "__reason": `Dify API Error: ${response.status}`,
            "error": "Dify API接続エラー。管理者に連絡してください。"
          }
        }
      });
    }

    const result = await response.json();
    console.log('Dify API Response:', JSON.stringify(result, null, 2));

    // レスポンス形式の正規化
    let outputs = result;
    if (result.data && result.data.outputs) {
      outputs = result.data.outputs;
    } else if (result.outputs) {
      outputs = result.outputs;
    }

    // 成功レスポンスの確認
    if (outputs.__is_success === 1) {
      console.log('Data extraction successful');
      res.status(200).json({ data: { outputs } });
    } else {
      console.log('Data extraction failed:', outputs.__reason);
      res.status(200).json({ data: { outputs } });
    }

  } catch (error) {
    console.error('API Processing Error:', error);
    
    // エラー時のフォールバック処理
    res.status(200).json({
      data: {
        outputs: {
          "__is_success": 0,
          "__reason": error.message,
          "error": "PDF処理中にエラーが発生しました。ファイル形式を確認してください。"
        }
      }
    });
  }
}
