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

        console.log('=== DIFY API TEST ===');
        console.log('API URL:', process.env.DIFY_API_URL);
        console.log('API Key:', process.env.DIFY_API_KEY ? 'Present' : 'Missing');
        console.log('File name:', file_name);
        console.log('PDF data length:', pdf_data?.length || 0);

        // 最もシンプルなテストリクエスト
        const testRequest = {
            inputs: {
                file: "テストデータ"
            },
            response_mode: "blocking",
            user: "test"
        };

        console.log('Sending test request:', JSON.stringify(testRequest, null, 2));

        const response = await fetch(process.env.DIFY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testRequest)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const result = await response.json();
            console.log('SUCCESS! Response:', JSON.stringify(result, null, 2));
            
            return res.status(200).json({
                data: {
                    outputs: {
                        "__is_success": 1,
                        "message": "Dify API connection successful!",
                        "response": result,
                        "test_data": {
                            "shaho_count": 2,
                            "shaho_amount": 10000,
                            "kokuho_count": 1,
                            "kokuho_amount": 5000
                        }
                    }
                }
            });
        } else {
            const errorText = await response.text();
            console.log('ERROR Response body:', errorText);
            
            return res.status(200).json({
                data: {
                    outputs: {
                        "__is_success": 0,
                        "__reason": `API Error ${response.status}`,
                        "error": "Dify API接続テストに失敗しました",
                        "debug": {
                            "status": response.status,
                            "response": errorText,
                            "url": process.env.DIFY_API_URL,
                            "has_api_key": !!process.env.DIFY_API_KEY
                        }
                    }
                }
            });
        }

    } catch (error) {
        console.error('CATCH Error:', error);
        
        return res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": error.message,
                    "error": "API接続テスト中にエラーが発生しました",
                    "debug": {
                        "error_type": error.name,
                        "error_message": error.message,
                        "stack": error.stack?.substring(0, 300)
                    }
                }
            }
        });
    }
}
