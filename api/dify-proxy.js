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

        console.log('=== DETAILED WORKFLOW DEBUG ===');
        console.log('File name:', file_name);
        console.log('PDF data length:', pdf_data?.length || 0);

        if (!pdf_data || !file_name) {
            throw new Error('PDFデータまたはファイル名が不足しています');
        }

        // Step 1: ファイルをDifyにアップロード（修正版）
        console.log('Step 1: Uploading file to Dify with correct MIME type...');
        
        const uploadUrl = 'https://api.dify.ai/v1/files/upload';
        const fileBuffer = Buffer.from(pdf_data, 'base64');
        
        // ファイルの詳細情報をログ出力
        console.log('File buffer size:', fileBuffer.length);
        console.log('Original file name:', file_name);
        console.log('File buffer first 10 bytes:', Array.from(fileBuffer.slice(0, 10)));
        
        const formData = new FormData();
        
        // 正しいPDFファイルとして明示的に設定
        const blob = new Blob([fileBuffer], { 
            type: 'application/pdf'
        });
        
        // ファイル名の拡張子を確認・修正
        const correctedFileName = file_name.toLowerCase().endsWith('.pdf') ? file_name : `${file_name}.pdf`;
        console.log('Corrected file name:', correctedFileName);
        
        formData.append('file', blob, correctedFileName);
        formData.append('user', 'dental-clinic-user');
        
        // ファイルタイプを明示的に指定
        formData.append('type', 'application/pdf');

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
            },
            body: formData
        });

        const uploadText = await uploadResponse.text();
        console.log('Upload response status:', uploadResponse.status);

        if (!uploadResponse.ok) {
            throw new Error(`ファイルアップロードに失敗しました: ${uploadResponse.status} - ${uploadText}`);
        }

        const uploadResult = JSON.parse(uploadText);
        const fileId = uploadResult.id;
        console.log('File uploaded successfully. ID:', fileId);

        // Step 2: 詳細なWorkflow API デバッグ
        console.log('Step 2: Detailed Workflow API debugging...');
        
        const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
        
        // 最も詳細なファイル形式を試行
        const detailedRequest = {
            inputs: {
                file: {
                    type: "file",
                    transfer_method: "local_file",
                    upload_file_id: fileId,
                    url: ""
                }
            },
            response_mode: "blocking",
            user: "dental-clinic-user"
        };

        console.log('=== DETAILED REQUEST ===');
        console.log('URL:', workflowUrl);
        console.log('Headers:', {
            'Authorization': `Bearer ${process.env.DIFY_API_KEY ? process.env.DIFY_API_KEY.substring(0, 10) + '...' : 'NOT_SET'}`,
            'Content-Type': 'application/json'
        });
        console.log('Body:', JSON.stringify(detailedRequest, null, 2));

        const workflowResponse = await fetch(workflowUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(detailedRequest)
        });

        console.log('=== DETAILED RESPONSE ===');
        console.log('Status:', workflowResponse.status);
        console.log('Status Text:', workflowResponse.statusText);
        console.log('Headers:', Object.fromEntries(workflowResponse.headers.entries()));

        const workflowText = await workflowResponse.text();
        console.log('Raw Response Body:', workflowText);

        // レスポンスの詳細解析
        let parsedResponse = null;
        try {
            parsedResponse = JSON.parse(workflowText);
            console.log('Parsed Response:', JSON.stringify(parsedResponse, null, 2));
        } catch (e) {
            console.error('JSON Parse Error:', e);
            console.log('Response is not valid JSON');
        }

        if (!workflowResponse.ok) {
            // エラーの詳細分析
            console.log('=== ERROR ANALYSIS ===');
            
            if (parsedResponse) {
                console.log('Error Code:', parsedResponse.code);
                console.log('Error Message:', parsedResponse.message);
                console.log('Error Details:', parsedResponse.details || 'No details');
            }

            // 具体的なエラーメッセージを生成
            let errorMessage = `ワークフロー実行失敗 (${workflowResponse.status})`;
            if (parsedResponse?.message) {
                errorMessage += `: ${parsedResponse.message}`;
            }
            
            // エラーでも詳細情報を返す
            return res.status(200).json({
                data: {
                    outputs: {
                        "__is_success": 0,
                        "__reason": errorMessage,
                        "_debug_info": {
                            "file_id": fileId,
                            "upload_success": true,
                            "workflow_status": workflowResponse.status,
                            "workflow_response": workflowText,
                            "parsed_error": parsedResponse,
                            "api_key_configured": !!process.env.DIFY_API_KEY,
                            "api_key_prefix": process.env.DIFY_API_KEY?.substring(0, 10) || 'NOT_SET'
                        }
                    }
                }
            });
        }

        // 成功時の処理
        console.log('=== SUCCESS ===');
        console.log('Workflow executed successfully!');

        let outputs = parsedResponse.data?.outputs || parsedResponse.outputs || {};
        
        if (outputs.__is_success === undefined) {
            outputs.__is_success = 1;
        }
        
        outputs._file_id = fileId;
        outputs._debug_success = true;

        console.log('Final outputs:', JSON.stringify(outputs, null, 2));

        return res.status(200).json({
            data: { outputs: outputs }
        });

    } catch (error) {
        console.error('=== CATCH ERROR ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        
        return res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": error.message,
                    "_debug_info": {
                        "error_type": error.constructor.name,
                        "error_stack": error.stack,
                        "api_key_configured": !!process.env.DIFY_API_KEY,
                        "timestamp": new Date().toISOString()
                    }
                }
            }
        });
    }
}
