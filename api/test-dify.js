// /api/test-dify.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('=== DIFY CONNECTION TEST ===');
        
        // APIキーの存在確認
        const apiKey = process.env.DIFY_API_KEY;
        console.log('API Key exists:', !!apiKey);
        console.log('API Key prefix:', apiKey ? apiKey.substring(0, 8) + '...' : 'None');

        // 1. 空のワークフロー実行テスト
        const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
        
        const testRequest = {
            inputs: {},
            response_mode: "blocking",
            user: "test-user"
        };

        console.log('Testing empty workflow execution...');

        const testResponse = await fetch(workflowUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testRequest)
        });

        console.log('Test response status:', testResponse.status);
        
        const responseText = await testResponse.text();
        console.log('Test response body:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            result = { raw: responseText };
        }

        return res.status(200).json({
            test_results: {
                api_key_configured: !!apiKey,
                workflow_response_status: testResponse.status,
                workflow_response_ok: testResponse.ok,
                workflow_response_body: result,
                suggestions: [
                    testResponse.status === 401 ? "API キーが無効です" : null,
                    testResponse.status === 404 ? "ワークフローが見つからないか、公開されていません" : null,
                    testResponse.status === 422 ? "ワークフローの入力パラメータに問題があります" : null,
                    testResponse.ok ? "基本的な接続は成功しています" : null
                ].filter(Boolean)
            }
        });

    } catch (error) {
        console.error('Test error:', error);
        
        return res.status(200).json({
            test_results: {
                error: error.message,
                api_key_configured: !!process.env.DIFY_API_KEY,
                suggestions: [
                    "環境変数 DIFY_API_KEY が正しく設定されているか確認してください",
                    "Difyワークフローが公開状態になっているか確認してください",
                    "ネットワーク接続に問題がないか確認してください"
                ]
            }
        });
    }
}
