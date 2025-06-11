// /api/pdf-test.js
// PDF専用のDify APIテスト
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
            <title>PDF Dify APIテスト</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .result { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .success { background: #d4edda; border: 1px solid #c3e6cb; }
                .error { background: #f8d7da; border: 1px solid #f5c6cb; }
                .info { background: #d1ecf1; border: 1px solid #bee5eb; }
                button { padding: 10px 20px; margin: 10px 0; }
                pre { white-space: pre-wrap; font-size: 12px; max-height: 300px; overflow-y: auto; }
            </style>
        </head>
        <body>
            <h1>PDF Dify API テスト</h1>
            
            <div class="info">
                <h3>📄 PDFファイルの要件</h3>
                <ul>
                    <li>ファイル形式：PDF (.pdf)</li>
                    <li>最大サイズ：15MB</li>
                    <li>コンテンツ：テキストが含まれているPDF</li>
                </ul>
            </div>
            
            <div>
                <input type="file" id="fileInput" accept=".pdf" />
                <button onclick="testPDFUpload()">PDFファイルをテストする</button>
            </div>
            
            <div id="result" class="result"></div>

            <script>
                async function testPDFUpload() {
                    const fileInput = document.getElementById('fileInput');
                    const resultDiv = document.getElementById('result');
                    
                    if (!fileInput.files[0]) {
                        resultDiv.className = 'result error';
                        resultDiv.innerHTML = '<h3>エラー</h3><p>PDFファイルを選択してください</p>';
                        return;
                    }
                    
                    const file = fileInput.files[0];
                    
                    // PDF形式チェック
                    if (file.type !== 'application/pdf') {
                        resultDiv.className = 'result error';
                        resultDiv.innerHTML = '<h3>エラー</h3><p>PDFファイルを選択してください。選択されたファイル: ' + file.type + '</p>';
                        return;
                    }
                    
                    // サイズチェック
                    if (file.size > 15 * 1024 * 1024) {
                        resultDiv.className = 'result error';
                        resultDiv.innerHTML = '<h3>エラー</h3><p>ファイルサイズが15MBを超えています: ' + (file.size / 1024 / 1024).toFixed(2) + 'MB</p>';
                        return;
                    }
                    
                    resultDiv.className = 'result info';
                    resultDiv.innerHTML = '<h3>処理中...</h3><p>PDFファイルを処理しています...</p>';
                    
                    try {
                        // FormDataでファイルを送信
                        const formData = new FormData();
                        formData.append('file', file);
                        
                        const response = await fetch('/api/pdf-test', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const result = await response.text();
                        
                        if (response.ok) {
                            resultDiv.className = 'result success';
                        } else {
                            resultDiv.className = 'result error';
                        }
                        resultDiv.innerHTML = result;
                        
                    } catch (error) {
                        resultDiv.className = 'result error';
                        resultDiv.innerHTML = '<h3>エラー</h3><p>' + error.message + '</p>';
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
            // FormDataを使用してファイルを受信
            const formidable = (await import('formidable')).default;
            const form = formidable({
                maxFileSize: 15 * 1024 * 1024,
                keepExtensions: true,
            });

            const [fields, files] = await form.parse(req);
            const uploadedFile = files.file?.[0];

            if (!uploadedFile) {
                return res.status(400).send('<h3>エラー</h3><p>ファイルがアップロードされませんでした</p>');
            }

            // PDFファイルの詳細チェック
            console.log('=== PDF FILE ANALYSIS ===');
            console.log('Original filename:', uploadedFile.originalFilename);
            console.log('MIME type:', uploadedFile.mimetype);
            console.log('File size:', uploadedFile.size, 'bytes');
            console.log('File extension:', uploadedFile.originalFilename?.split('.').pop());

            // MIME typeの確認
            if (uploadedFile.mimetype !== 'application/pdf') {
                return res.status(400).send(`
                    <h3>❌ ファイル形式エラー</h3>
                    <p>PDFファイルである必要があります</p>
                    <p>検出されたMIME type: ${uploadedFile.mimetype}</p>
                `);
            }

            let results = [];

            // Step 1: Difyにファイルアップロード
            console.log('Step 1: Uploading PDF to Dify...');
            
            const FormData = (await import('form-data')).default;
            const fs = (await import('fs')).default;
            
            const formData = new FormData();
            const fileStream = fs.createReadStream(uploadedFile.filepath);
            
            formData.append('file', fileStream, {
                filename: uploadedFile.originalFilename,
                contentType: 'application/pdf'  // 明示的にPDFとして指定
            });
            formData.append('user', 'pdf-test-user');

            const uploadResponse = await fetch(`${process.env.DIFY_BASE_URL}/files/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                    ...formData.getHeaders()
                },
                body: formData
            });

            const uploadText = await uploadResponse.text();
            console.log('Upload response:', uploadResponse.status, uploadText);

            results.push({
                step: 'ファイルアップロード',
                status: uploadResponse.status,
                ok: uploadResponse.ok,
                response: uploadText
            });

            if (!uploadResponse.ok) {
                return res.status(200).send(formatResults(results, uploadedFile));
            }

            const uploadResult = JSON.parse(uploadText);
            const fileId = uploadResult.id;

            // Step 2: PDF用の複数のワークフロー入力パターンをテスト
            console.log('Step 2: Testing PDF workflow patterns...');
            
            const pdfInputPatterns = [
                {
                    name: 'PDF Document Object (推奨)',
                    inputs: {
                        "orig_mail": {
                            "type": "document",
                            "transfer_method": "local_file",
                            "upload_file_id": fileId
                        }
                    }
                },
                {
                    name: 'PDF with explicit mime type',
                    inputs: {
                        "orig_mail": {
                            "type": "document",
                            "transfer_method": "local_file",
                            "upload_file_id": fileId,
                            "mime_type": "application/pdf"
                        }
                    }
                },
                {
                    name: 'File ID only',
                    inputs: {
                        "orig_mail": fileId
                    }
                },
                {
                    name: 'Alternative parameter name "file"',
                    inputs: {
                        "file": {
                            "type": "document",
                            "transfer_method": "local_file",
                            "upload_file_id": fileId
                        }
                    }
                }
            ];

            for (const pattern of pdfInputPatterns) {
                console.log(`Testing pattern: ${pattern.name}`);
                
                const workflowRequest = {
                    inputs: pattern.inputs,
                    response_mode: "blocking",
                    user: "pdf-test-user"
                };

                const workflowResponse = await fetch(`${process.env.DIFY_BASE_URL}/workflows/run`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(workflowRequest)
                });

                const workflowText = await workflowResponse.text();
                
                results.push({
                    step: `ワークフロー - ${pattern.name}`,
                    status: workflowResponse.status,
                    ok: workflowResponse.ok,
                    request: workflowRequest,
                    response: workflowText
                });

                if (workflowResponse.ok) {
                    console.log(`✅ Success with pattern: ${pattern.name}`);
                    // 成功したパターンで詳細な結果を表示
                    try {
                        const workflowResult = JSON.parse(workflowText);
                        results.push({
                            step: '成功したワークフロー結果',
                            status: 200,
                            ok: true,
                            response: JSON.stringify(workflowResult, null, 2)
                        });
                    } catch (e) {
                        // JSON解析に失敗した場合はそのまま表示
                    }
                    break;
                } else {
                    console.log(`❌ Failed with pattern: ${pattern.name} - ${workflowResponse.status}`);
                }
            }

            return res.status(200).send(formatResults(results, uploadedFile, fileId));

        } catch (error) {
            console.error('PDF Test error:', error);
            return res.status(500).send(`
                <h3>❌ システムエラー</h3>
                <p>エラー: ${error.message}</p>
                <pre>${error.stack}</pre>
            `);
        }
    }

    return res.status(405).send('<h3>Method not allowed</h3>');
}

function formatResults(results, fileInfo, fileId = null) {
    const successCount = results.filter(r => r.ok).length;
    const totalCount = results.length;
    
    return `
        <h3>📄 PDFテスト結果</h3>
        
        <div style="background: #e9ecef; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <h4>ファイル情報</h4>
            <p><strong>ファイル名:</strong> ${fileInfo.originalFilename}</p>
            <p><strong>サイズ:</strong> ${(fileInfo.size / 1024).toFixed(1)} KB</p>
            <p><strong>MIME Type:</strong> ${fileInfo.mimetype}</p>
            ${fileId ? `<p><strong>Dify File ID:</strong> ${fileId}</p>` : ''}
        </div>

        <div style="background: ${successCount > 0 ? '#d4edda' : '#f8d7da'}; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <h4>テスト結果サマリー</h4>
            <p><strong>成功:</strong> ${successCount} / ${totalCount}</p>
            <p><strong>推奨事項:</strong> ${
                successCount > 0 ? 
                '✅ 動作するパターンが見つかりました。そのパターンを本番コードで使用してください。' : 
                '❌ すべてのパターンが失敗しました。Difyワークフローの設定を確認してください。'
            }</p>
        </div>

        ${results.map((result, index) => `
            <div style="border: 1px solid #ccc; margin: 10px 0; padding: 15px; border-radius: 5px; background: ${result.ok ? '#d4edda' : '#f8d7da'};">
                <h4>${index + 1}. ${result.step} ${result.ok ? '✅' : '❌'}</h4>
                <p><strong>ステータス:</strong> ${result.status}</p>
                ${result.request ? `
                    <p><strong>リクエスト:</strong></p>
                    <pre style="background: #f8f9fa; padding: 5px; border-radius: 3px;">${JSON.stringify(result.request, null, 2)}</pre>
                ` : ''}
                <p><strong>レスポンス:</strong></p>
                <pre style="background: #f8f9fa; padding: 5px; border-radius: 3px; max-height: 200px; overflow-y: auto;">${result.response}</pre>
            </div>
        `).join('')}

        <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <h4>🔧 PDFトラブルシューティング</h4>
            <ul>
                <li>PDFにテキストコンテンツが含まれていることを確認</li>
                <li>PDFが破損していないことを確認</li>
                <li>Difyワークフローで適切なPDF処理ノードが設定されているか確認</li>
                <li>ワークフローの入力パラメータ名が正しいか確認</li>
                <li>Difyワークフローが「公開」状態になっているか確認</li>
            </ul>
        </div>
    `;
}
