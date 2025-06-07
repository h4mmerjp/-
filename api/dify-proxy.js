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

        console.log('=== DIFY WORKFLOW EXECUTION ===');
        console.log('File name:', file_name);
        console.log('PDF data length:', pdf_data?.length || 0);

        if (!pdf_data || !file_name) {
            throw new Error('PDFデータまたはファイル名が不足しています');
        }

        // Step 1: ファイルをDifyにアップロード
        console.log('Step 1: Uploading file to Dify...');
        
        const uploadUrl = 'https://api.dify.ai/v1/files/upload';
        const fileBuffer = Buffer.from(pdf_data, 'base64');
        
        // FormDataを正しく作成
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

        console.log('Upload response status:', uploadResponse.status);

        if (!uploadResponse.ok) {
            const uploadError = await uploadResponse.text();
            console.error('File upload failed:', uploadError);
            throw new Error(`ファイルアップロードに失敗しました: ${uploadResponse.status} - ${uploadError}`);
        }

        const uploadResult = await uploadResponse.json();
        console.log('File upload successful:', uploadResult);
        
        const fileId = uploadResult.id;

        // Step 2: ワークフローを実行
        console.log('Step 2: Executing workflow with file...');
        
        const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
        
        // Difyワークフローの入力形式を複数パターンで試行
        const workflowPatterns = [
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
            // パターン2: 直接ID指定
            {
                inputs: {
                    file: fileId
                },
                response_mode: "blocking",
                user: "dental-clinic-user"
            },
            // パターン3: アップロードファイルID形式
            {
                inputs: {
                    file: {
                        upload_file_id: fileId
                    }
                },
                response_mode: "blocking",
                user: "dental-clinic-user"
            }
        ];

        // 複数パターンでワークフローを試行
        let workflowResult = null;
        let lastError = null;

        for (let i = 0; i < workflowPatterns.length; i++) {
            const workflowRequest = workflowPatterns[i];
            console.log(`Pattern ${i + 1} - Workflow request:`, JSON.stringify(workflowRequest, null, 2));

            const workflowResponse = await fetch(workflowUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(workflowRequest)
            });

            console.log(`Pattern ${i + 1} - Response status:`, workflowResponse.status);

            const responseText = await workflowResponse.text();
            console.log(`Pattern ${i + 1} - Raw response:`, responseText);

            if (workflowResponse.ok) {
                // 成功した場合
                try {
                    workflowResult = JSON.parse(responseText);
                    console.log(`Pattern ${i + 1} - SUCCESS:`, JSON.stringify(workflowResult, null, 2));
                    break; // 成功したらループを抜ける
                } catch (e) {
                    console.error(`Pattern ${i + 1} - JSON parse error:`, e);
                    lastError = `JSONパースエラー: ${e.message}`;
                    continue;
                }
            } else {
                // エラーの詳細を記録
                let errorDetails = {};
                try {
                    errorDetails = JSON.parse(responseText);
                } catch (e) {
                    errorDetails = { raw_error: responseText };
                }
                
                lastError = `Pattern ${i + 1} failed (${workflowResponse.status}): ${errorDetails.message || errorDetails.error || responseText}`;
                console.error(lastError);
                
                // 最後のパターンでなければ、次を試行
                if (i < workflowPatterns.length - 1) {
                    console.log(`Pattern ${i + 1} failed, trying next pattern...`);
                    continue;
                }
            }
        }

        // すべてのパターンが失敗した場合
        if (!workflowResult) {
            throw new Error(`すべての入力パターンが失敗しました。最後のエラー: ${lastError}`);
        }

        // レスポンスデータの正規化
        let outputs = workflowResult.data?.outputs || workflowResult.outputs || {};
        
        // 成功フラグを追加
        if (outputs.__is_success === undefined) {
            outputs.__is_success = 1;
        }
        
        // ファイル情報を追加
        outputs._file_id = fileId;
        outputs._file_name = file_name;

        return res.status(200).json({
            data: {
                outputs: outputs
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        
        return res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": error.message,
                    "error": `API実行エラー: ${error.message}`,
                    "_suggestion": "1. Dify APIキーが正しく設定されているか確認\n2. ワークフローが公開されているか確認\n3. 入力フィールドの変数名が'file'になっているか確認"
                }
            }
        });
    }
}
