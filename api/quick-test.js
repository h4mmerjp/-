// /api/quick-test.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('=== QUICK DIFY TEST ===');
        console.log('Method:', req.method);
        console.log('API Key configured:', !!process.env.DIFY_API_KEY);
        console.log('API Key length:', process.env.DIFY_API_KEY?.length || 0);
        
        const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
        
        // 最もシンプルなリクエスト
        const request = {
            inputs: {},
            response_mode: "blocking", 
            user: "test-user"
        };

        console.log('Making request to Dify...');
        console.log('URL:', workflowUrl);
        console.log('Request body:', JSON.stringify(request, null, 2));

        const response = await fetch(workflowUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        const responseText = await response.text();
        console.log('Response text:', responseText);

        let parsedResponse = null;
        try {
            parsedResponse = JSON.parse(responseText);
        } catch (e) {
            console.log('Could not parse response as JSON');
        }

        // HTML形式で結果を表示
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dify Quick Test</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .result { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
                .success { background: #d4edda; border: 1px solid #c3e6cb; }
                .error { background: #f8d7da; border: 1px solid #f5c6cb; }
                .info { background: #d1ecf1; border: 1px solid #bee5eb; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
        </head>
        <body>
            <h1>Dify接続テスト結果</h1>
            
            <div class="result info">
                <h3>環境情報</h3>
                <p>API Key設定: ${!!process.env.DIFY_API_KEY ? '✓ 設定済み' : '✗ 未設定'}</p>
                <p>API Key長さ: ${process.env.DIFY_API_KEY?.length || 0} 文字</p>
            </div>

            <div class="result ${response.ok ? 'success' : 'error'}">
                <h3>API レスポンス</h3>
                <p>ステータス: ${response.status} ${response.ok ? '(成功)' : '(失敗)'}</p>
                <p>URL: ${workflowUrl}</p>
            </div>

            <div class="result">
                <h3>送信データ</h3>
                <pre>${JSON.stringify(request, null, 2)}</pre>
            </div>

            <div class="result">
                <h3>レスポンス詳細</h3>
                <pre>${responseText}</pre>
            </div>

            ${parsedResponse ? `
            <div class="result">
                <h3>パース済みレスポンス</h3>
                <pre>${JSON.stringify(parsedResponse, null, 2)}</pre>
            </div>
            ` : ''}

            <div class="result info">
                <h3>診断</h3>
                <ul>
                    ${response.status === 401 ? '<li>❌ API キーが無効または期限切れです</li>' : ''}
                    ${response.status === 404 ? '<li>❌ ワークフローが見つからないか、公開されていません</li>' : ''}
                    ${response.status === 422 ? '<li>❌ 入力パラメータに問題があります</li>' : ''}
                    ${response.status === 500 ? '<li>❌ Dify側でサーバーエラーが発生しています</li>' : ''}
                    ${response.ok ? '<li>✅ 基本的な接続は成功しています</li>' : ''}
                </ul>
            </div>

            <div class="result">
                <h3>次のステップ</h3>
                <p>
                    ${response.ok 
                        ? 'ワークフローとの基本接続は成功しています。ファイル入力の問題を解決しましょう。' 
                        : 'まず基本接続の問題を解決する必要があります。上記の診断を確認してください。'
                    }
                </p>
            </div>
        </body>
        </html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);

    } catch (error) {
        console.error('Test error:', error);
        
        const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dify Test Error</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .error { background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>テストエラー</h1>
            <div class="error">
                <h3>エラー詳細</h3>
                <p>${error.message}</p>
                <pre>${error.stack}</pre>
            </div>
            <p>API Key設定: ${!!process.env.DIFY_API_KEY ? '設定済み' : '未設定'}</p>
        </body>
        </html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(errorHtml);
    }
}
