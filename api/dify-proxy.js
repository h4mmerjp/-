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

        console.log('=== SIMPLIFIED DIFY WORKFLOW TEST ===');
        console.log('File name:', file_name);
        console.log('PDF data length:', pdf_data?.length || 0);
        console.log('API Key configured:', !!process.env.DIFY_API_KEY);

        if (!pdf_data || !file_name) {
            throw new Error('PDFデータまたはファイル名が不足しています');
        }

        // Step 1: ファイルをDifyにアップロード
        console.log('Step 1: Uploading file to Dify...');
        
        const uploadUrl = 'https://api.dify.ai/v1/files/upload';
        const fileBuffer = Buffer.from(pdf_data, 'base64');
        
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'application/pdf' });
        formData.append('file', blob, file_name);
        formData.append('user', 'dental-clinic-user');

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
            },
            body: formData
        });

        const uploadText = await uploadResponse.text();
        console.log('Upload response status:', uploadResponse.status);
        console.log('Upload response text:', uploadText);

        if (!uploadResponse.ok) {
            throw new Error(`ファイルアップロードに失敗しました: ${uploadResponse.status} - ${uploadText}`);
        }

        const uploadResult = JSON.parse(uploadText);
        const fileId = uploadResult.id;
        console.log('File uploaded successfully. ID:', fileId);

        // Step 2: シンプル化されたワークフローを実行
        console.log('Step 2: Executing simplified workflow...');
        
        const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
        
        // 複数のファイル入力形式を試行
        const fileInputPatterns = [
            // パターン1: ファイルオブジェクト形式
            {
                inputs: {
                    file: {
                        type: "file",
                        transfer_method: "local_file", 
                        upload_file_id: fileId
                    }
                },
                response_mode: "blocking",
                user: "dental-clinic-user"
            },
            // パターン2: upload_file_id形式
            {
                inputs: {
                    file: {
                        upload_file_id: fileId
                    }
                },
                response_mode: "blocking", 
                user: "dental-clinic-user"
            },
            // パターン3: 直接ID（従来方式）
            {
                inputs: {
                    file: fileId
                },
                response_mode: "blocking",
                user: "dental-clinic-user"
            }
        ];

        let workflowResult = null;
        let lastError = null;

        // 各パターンを順番に試行
        for (let i = 0; i < fileInputPatterns.length; i++) {
            const workflowRequest = fileInputPatterns[i];
            console.log(`Trying pattern ${i + 1}:`, JSON.stringify(workflowRequest, null, 2));

            const workflowResponse = await fetch(workflowUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(workflowRequest)
            });

            const workflowText = await workflowResponse.text();
            console.log(`Pattern ${i + 1} - Response status:`, workflowResponse.status);
            console.log(`Pattern ${i + 1} - Raw response:`, workflowText);

            if (workflowResponse.ok) {
                try {
                    workflowResult = JSON.parse(workflowText);
                    console.log(`Pattern ${i + 1} - SUCCESS!`);
                    console.log('Parsed result:', JSON.stringify(workflowResult, null, 2));
                    break; // 成功したらループを抜ける
                } catch (e) {
                    console.error(`Pattern ${i + 1} - JSON parse error:`, e);
                    lastError = `JSONパースエラー: ${e.message}`;
                    continue;
                }
            } else {
                let errorDetails = {};
                try {
                    errorDetails = JSON.parse(workflowText);
                } catch (e) {
                    errorDetails = { raw_error: workflowText };
                }
                
                lastError = `Pattern ${i + 1} failed (${workflowResponse.status}): ${errorDetails.error || errorDetails.message || workflowText}`;
                console.error(lastError);
                
                // 最後のパターンでなければ次を試行
                if (i < fileInputPatterns.length - 1) {
                    console.log(`Trying next pattern...`);
                    continue;
                }
            }
        }

        // すべてのパターンが失敗した場合
        if (!workflowResult) {
            throw new Error(`すべての入力パターンが失敗しました。最後のエラー: ${lastError}`);
        }

        console.log('Workflow execution successful!');
        console.log('Parsed result:', JSON.stringify(workflowResult, null, 2));

        // レスポンスデータの正規化
        let outputs = workflowResult.data?.outputs || workflowResult.outputs || {};
        
        // 成功フラグを確認・追加
        if (outputs.__is_success === undefined) {
            outputs.__is_success = 1;
        }
        
        // ファイル情報を追加
        outputs._file_id = fileId;
        outputs._file_name = file_name;
        outputs._workflow_simplified = true;

        console.log('Final outputs:', JSON.stringify(outputs, null, 2));

        return res.status(200).json({
            data: {
                outputs: outputs
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        console.error('Error stack:', error.stack);
        
        return res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": error.message,
                    "error": `API実行エラー: ${error.message}`,
                    "_debug_info": {
                        "api_key_configured": !!process.env.DIFY_API_KEY,
                        "workflow_simplified": true,
                        "timestamp": new Date().toISOString()
                    }
                }
            }
        });
    }
}
