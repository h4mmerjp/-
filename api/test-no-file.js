// /api/test-no-file.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('=== NO FILE WORKFLOW TEST ===');
        
        const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
        
        // 1. 完全に空の入力
        const emptyRequest = {
            inputs: {},
            response_mode: "blocking",
            user: "test-user"
        };

        console.log('Testing empty inputs...');
        console.log('Request:', JSON.stringify(emptyRequest, null, 2));

        const emptyResponse = await fetch(workflowUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emptyRequest)
        });

        const emptyResponseText = await emptyResponse.text();
        console.log('Empty inputs response:', emptyResponse.status, emptyResponseText);

        // 2. ファイルフィールドを空文字列で指定
        const nullFileRequest = {
            inputs: {
                file: ""
            },
            response_mode: "blocking",
            user: "test-user"
        };

        console.log('Testing null file...');
        console.log('Request:', JSON.stringify(nullFileRequest, null, 2));

        const nullFileResponse = await fetch(workflowUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nullFileRequest)
        });

        const nullFileResponseText = await nullFileResponse.text();
        console.log('Null file response:', nullFileResponse.status, nullFileResponseText);

        return res.status(200).json({
            empty_inputs: {
                status: emptyResponse.status,
                ok: emptyResponse.ok,
                response: emptyResponseText,
                parsed: (() => {
                    try { return JSON.parse(emptyResponseText); } catch(e) { return null; }
                })()
            },
            null_file: {
                status: nullFileResponse.status,
                ok: nullFileResponse.ok,
                response: nullFileResponseText,
                parsed: (() => {
                    try { return JSON.parse(nullFileResponseText); } catch(e) { return null; }
                })()
            },
            analysis: {
                empty_success: emptyResponse.ok,
                null_file_success: nullFileResponse.ok,
                recommendation: emptyResponse.ok 
                    ? "ワークフローは基本的に動作します。ファイル入力の形式に問題があります。"
                    : "ワークフロー自体に問題があるか、API認証に問題があります。"
            }
        });

    } catch (error) {
        console.error('Test error:', error);
        
        return res.status(200).json({
            error: error.message,
            api_key_configured: !!process.env.DIFY_API_KEY
        });
    }
}
