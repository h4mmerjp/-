// /api/file-test.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        // テスト用HTMLページを表示
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>ファイルアップロードテスト</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .result { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
                button { padding: 10px 20px; margin: 10px 0; }
                #result { white-space: pre-wrap; }
            </style>
        </head>
        <body>
            <h1>Dify ファイルアップロードテスト</h1>
            
            <div>
                <input type="file" id="fileInput" accept=".pdf" />
                <button onclick="testFileUpload()">ファイルをテストする</button>
            </div>
            
            <div id="result" class="result"></div>

            <script>
                async function testFileUpload() {
                    const fileInput = document.getElementById('fileInput');
                    const resultDiv = document.getElementById('result');
                    
                    if (!fileInput.files[0]) {
                        resultDiv.textContent = 'ファイルを選択してください';
                        return;
                    }
                    
                    const file = fileInput.files[0];
                    resultDiv.textContent = 'ファイルを処理中...';
                    
                    try {
                        // ファイルをBase64に変換
                        const arrayBuffer = await file.arrayBuffer();
                        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                        
                        // APIに送信
                        const response = await fetch('/api/file-test', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                pdf_data: base64,
                                file_name: file.name
                            })
                        });
                        
                        const result = await response.text();
                        resultDiv.textContent = result;
                        
                    } catch (error) {
                        resultDiv.textContent = 'エラー: ' + error.message;
                    }
                }
            </script>
        </body>
        </html>
        `;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    }

    if (req.method === 'POST') {
        try {
            const { pdf_data, file_name } = req.body;
            
            console.log('=== FILE UPLOAD TEST ===');
            console.log('File name:', file_name);
            console.log('PDF data length:', pdf_data?.length || 0);

            if (!pdf_data || !file_name) {
                return res.status(200).send('エラー: PDFデータまたはファイル名が不足しています');
            }

            // Step 1: ファイルをDifyにアップロード
            console.log('Uploading file to Dify...');
            
            const uploadUrl = 'https://api.dify.ai/v1/files/upload';
            const fileBuffer = Buffer.from(pdf_data, 'base64');
            
            const formData = new FormData();
            const blob = new Blob([fileBuffer], { type: 'application/pdf' });
            formData.append('file', blob, file_name);
            formData.append('user', 'test-user');

            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': \`Bearer \${process.env.DIFY_API_KEY}\`
                },
                body: formData
            });

            const uploadText = await uploadResponse.text();
            console.log('Upload response:', uploadResponse.status, uploadText);

            if (!uploadResponse.ok) {
                return res.status(200).send(\`ファイルアップロード失敗 (\${uploadResponse.status}):\\n\${uploadText}\`);
            }

            const uploadResult = JSON.parse(uploadText);
            const fileId = uploadResult.id;

            console.log('File uploaded successfully. ID:', fileId);

            // Step 2: 複数の入力パターンでワークフローをテスト
            const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
            
            const patterns = [
                // パターン1: 直接ID
                { file: fileId },
                // パターン2: オブジェクト形式
                { file: { upload_file_id: fileId } },
                // パターン3: 詳細オブジェクト
                { file: { type: "file", transfer_method: "local_file", upload_file_id: fileId } }
            ];

            let results = [];

            for (let i = 0; i < patterns.length; i++) {
                const inputs = patterns[i];
                const request = {
                    inputs: inputs,
                    response_mode: "blocking",
                    user: "test-user"
                };

                console.log(\`Pattern \${i + 1}:\`, JSON.stringify(request, null, 2));

                const workflowResponse = await fetch(workflowUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${process.env.DIFY_API_KEY}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request)
                });

                const workflowText = await workflowResponse.text();
                
                results.push({
                    pattern: i + 1,
                    inputs: inputs,
                    status: workflowResponse.status,
                    ok: workflowResponse.ok,
                    response: workflowText,
                    parsed: (() => {
                        try { return JSON.parse(workflowText); } catch(e) { return null; }
                    })()
                });

                if (workflowResponse.ok) {
                    break; // 成功したらループを抜ける
                }
            }

            // 結果をフォーマットして返す
            let output = \`ファイルアップロードテスト結果\\n\\n\`;
            output += \`ファイル名: \${file_name}\\n\`;
            output += \`ファイルサイズ: \${Math.round(pdf_data.length * 0.75 / 1024)} KB\\n\`;
            output += \`アップロードID: \${fileId}\\n\\n\`;

            results.forEach((result, index) => {
                output += \`--- パターン \${result.pattern} ---\\n\`;
                output += \`入力: \${JSON.stringify(result.inputs, null, 2)}\\n\`;
                output += \`ステータス: \${result.status} \${result.ok ? '(成功)' : '(失敗)'}\\n\`;
                output += \`レスポンス: \${result.response}\\n\\n\`;
            });

            return res.status(200).send(output);

        } catch (error) {
            console.error('Test error:', error);
            return res.status(200).send(\`エラー: \${error.message}\\n\\nスタック:\\n\${error.stack}\`);
        }
    }

    return res.status(405).send('Method not allowed');
}
