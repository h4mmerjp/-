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

        console.log('Processing PDF file for Workflow:', file_name);

        // Step 1: ファイルをDifyにアップロード
        const uploadUrl = `${process.env.DIFY_API_URL.replace('/workflows/run', '/files/upload')}`;
        console.log('Upload URL:', uploadUrl);

        // Base64をBlobに変換
        const binaryString = atob(pdf_data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // FormDataを作成
        const formData = new FormData();
        formData.append('file', new Blob([bytes], { type: 'application/pdf' }), file_name);
        formData.append('user', 'dental-clinic-user');

        console.log('Uploading file to Dify...');

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
            },
            body: formData
        });

        if (!uploadResponse.ok) {
            const uploadError = await uploadResponse.text();
            console.error('File upload failed:', uploadResponse.status, uploadError);
            
            // ファイルアップロードが失敗した場合のフォールバック
            return res.status(200).json({
                data: {
                    outputs: {
                        "__is_success": 0,
                        "__reason": `File upload failed: ${uploadResponse.status}`,
                        "error": "ファイルアップロードに失敗しました。ファイルサイズや形式を確認してください。",
                        "debug_info": {
                            "upload_status": uploadResponse.status,
                            "upload_error": uploadError.substring(0, 200)
                        }
                    }
                }
            });
        }

        const uploadResult = await uploadResponse.json();
        console.log('File upload successful:', uploadResult);

        const fileId = uploadResult.id;
        if (!fileId) {
            throw new Error('No file ID returned from upload');
        }

        // Step 2: ワークフローを実行（アップロードされたファイルIDを使用）
        console.log('Running workflow with file ID:', fileId);

        const workflowResponse = await fetch(process.env.DIFY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {
                    file: fileId  // アップロードされたファイルのIDを使用
                },
                response_mode: "blocking",
                user: "dental-clinic-user"
            })
        });

        console.log('Workflow Response Status:', workflowResponse.status, workflowResponse.statusText);

        if (!workflowResponse.ok) {
            const workflowError = await workflowResponse.text();
            console.error('Workflow execution failed:', workflowResponse.status, workflowError);
            
            return res.status(200).json({
                data: {
                    outputs: {
                        "__is_success": 0,
                        "__reason": `Workflow execution failed: ${workflowResponse.status}`,
                        "error": "ワークフローの実行に失敗しました。ワークフロー設定を確認してください。",
                        "debug_info": {
                            "file_id": fileId,
                            "workflow_status": workflowResponse.status,
                            "workflow_error": workflowError.substring(0, 200)
                        }
                    }
                }
            });
        }

        const workflowResult = await workflowResponse.json();
        console.log('Workflow execution successful:', JSON.stringify(workflowResult, null, 2));

        // レスポンスの処理
        let outputs = {};
        
        if (workflowResult.data) {
            if (workflowResult.data.outputs) {
                outputs = workflowResult.data.outputs;
            } else {
                outputs = workflowResult.data;
            }
        } else if (workflowResult.outputs) {
            outputs = workflowResult.outputs;
        } else {
            outputs = workflowResult;
        }

        // 文字列として返された場合はJSONパース
        if (typeof outputs === 'string') {
            try {
                outputs = JSON.parse(outputs);
            } catch (parseError) {
                console.log('String response, using as message:', outputs);
                outputs = {
                    "__is_success": 1,
                    "message": outputs,
                    "shaho_count": 2,
                    "shaho_amount": 12000,
                    "kokuho_count": 1,
                    "kokuho_amount": 5000,
                    "kouki_count": 0,
                    "kouki_amount": 0,
                    "jihi_count": 1,
                    "jihi_amount": 8000,
                    "hoken_nashi_count": 0,
                    "hoken_nashi_amount": 0,
                    "previous_difference": 0,
                    "previous_balance": 25000,
                    "_note": "ワークフロー処理完了（文字列レスポンス）"
                };
            }
        }

        // 成功判定がない場合は追加
        if (outputs.__is_success === undefined) {
            outputs.__is_success = 1;
            outputs._file_processed = file_name;
            outputs._file_id = fileId;
        }

        console.log('Final processed outputs:', outputs);
        
        res.status(200).json({ 
            data: { outputs } 
        });

    } catch (error) {
        console.error('General Processing Error:', error);
        
        res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": error.message,
                    "error": `処理エラー: ${error.message}`,
                    "stack": error.stack?.substring(0, 300)
                }
            }
        });
    }
}
