export default async function handler(req, res) {
    // CORS設定を最初に設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24時間

    // プリフライトリクエスト（OPTIONS）への対応
    if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS preflight request');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { pdf_data, file_name } = req.body;

        console.log('=== API Request Debug ===');
        console.log('Method:', req.method);
        console.log('Origin:', req.headers.origin);
        console.log('File name:', file_name);
        console.log('PDF data length:', pdf_data?.length || 0);

        if (!pdf_data || !file_name) {
            throw new Error('PDFデータまたはファイル名が不足しています');
        }

        // Dify API キーの確認
        if (!process.env.DIFY_API_KEY) {
            throw new Error('DIFY_API_KEY environment variable is not set');
        }

        // Step 1: ファイルをDifyにアップロード
        console.log('Step 1: Uploading file to Dify...');

        const uploadUrl = 'https://api.dify.ai/v1/files/upload';
        const fileBuffer = Buffer.from(pdf_data, 'base64');

        console.log('File buffer size:', fileBuffer.length);
        console.log('Original file name:', file_name);

        // 正しいファイル名の確保
        const correctedFileName = file_name.toLowerCase().endsWith('.pdf') ? file_name : `${file_name}.pdf`;
        console.log('Corrected file name:', correctedFileName);

        // Vercel環境用のFormData作成
        const FormData = global.FormData || require('form-data');
        const formData = new FormData();

        // Blobオブジェクトを作成（ブラウザ環境のFormData用）
        if (typeof Blob !== 'undefined') {
            // ブラウザ環境またはEdge Runtime
            const blob = new Blob([fileBuffer], { type: 'application/pdf' });
            formData.append('file', blob, correctedFileName);
        } else {
            // Node.js環境の場合の代替方法
            formData.append('file', fileBuffer, {
                filename: correctedFileName,
                contentType: 'application/pdf'
            });
        }
        
        formData.append('user', 'dental-clinic-user');

        // アップロードリクエストのヘッダー設定
        const uploadHeaders = {
            'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        };

        // form-dataのgetHeaders()が利用可能な場合のみ使用
        if (formData.getHeaders && typeof formData.getHeaders === 'function') {
            Object.assign(uploadHeaders, formData.getHeaders());
        }

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: uploadHeaders,
            body: formData
        });

        const uploadText = await uploadResponse.text();
        console.log('Upload response status:', uploadResponse.status);
        console.log('Upload response body:', uploadText);

        if (!uploadResponse.ok) {
            throw new Error(`ファイルアップロードに失敗: ${uploadResponse.status} - ${uploadText}`);
        }

        const uploadResult = JSON.parse(uploadText);
        const fileId = uploadResult.id;
        console.log('File uploaded successfully. ID:', fileId);

        // Step 2: 複数のファイル入力形式を試行
        console.log('Step 2: Trying multiple file input formats...');

        const workflowUrl = 'https://api.dify.ai/v1/workflows/run';

        const inputFormats = [
            // Format 1: 最もシンプル
            {
                name: "Simple ID",
                inputs: { file: fileId }
            },
            // Format 2: オブジェクト形式
            {
                name: "Object format",
                inputs: {
                    file: {
                        upload_file_id: fileId
                    }
                }
            },
            // Format 3: 完全形式
            {
                name: "Complete format",
                inputs: {
                    file: {
                        type: "file",
                        transfer_method: "local_file",
                        upload_file_id: fileId
                    }
                }
            },
            // Format 4: URL空文字列付き
            {
                name: "With empty URL",
                inputs: {
                    file: {
                        type: "file",
                        transfer_method: "local_file", 
                        upload_file_id: fileId,
                        url: ""
                    }
                }
            }
        ];

        for (let i = 0; i < inputFormats.length; i++) {
            const format = inputFormats[i];
            console.log(`=== TRYING FORMAT ${i + 1}: ${format.name} ===`);

            const request = {
                inputs: format.inputs,
                response_mode: "blocking",
                user: "dental-clinic-user"
            };

            console.log('Request body:', JSON.stringify(request, null, 2));

            const workflowResponse = await fetch(workflowUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            });

            const workflowText = await workflowResponse.text();
            console.log(`Format ${i + 1} - Status:`, workflowResponse.status);
            console.log(`Format ${i + 1} - Response:`, workflowText);

            if (workflowResponse.ok) {
                console.log(`=== SUCCESS WITH FORMAT ${i + 1}! ===`);
                
                let parsedResponse;
                try {
                    parsedResponse = JSON.parse(workflowText);
                } catch (e) {
                    console.error('Failed to parse workflow response:', e);
                    throw new Error('ワークフローのレスポンスが無効なJSONです');
                }
                
                let outputs = parsedResponse.data?.outputs || parsedResponse.outputs || {};
                
                if (outputs.__is_success === undefined) {
                    outputs.__is_success = 1;
                }
                
                outputs._file_id = fileId;
                outputs._successful_format = format.name;
                outputs._format_number = i + 1;

                return res.status(200).json({
                    data: { outputs: outputs }
                });
            } else {
                console.log(`Format ${i + 1} failed, trying next...`);
                
                // 最後の形式でも失敗した場合
                if (i === inputFormats.length - 1) {
                    let parsedError = null;
                    try {
                        parsedError = JSON.parse(workflowText);
                    } catch (e) {
                        parsedError = { raw_error: workflowText };
                    }
                    
                    return res.status(200).json({
                        data: {
                            outputs: {
                                "__is_success": 0,
                                "__reason": `すべての入力形式が失敗しました。最後のエラー: ${parsedError.message || workflowText}`,
                                "_debug_info": {
                                    "file_id": fileId,
                                    "upload_success": true,
                                    "tried_formats": inputFormats.length,
                                    "last_error": parsedError,
                                    "upload_result": uploadResult
                                }
                            }
                        }
                    });
                }
            }
        }

    } catch (error) {
        console.error('=== CATCH ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);

        return res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": `処理中にエラーが発生しました: ${error.message}`,
                    "_debug_info": {
                        "error_type": error.constructor.name,
                        "error_message": error.message,
                        "api_key_configured": !!process.env.DIFY_API_KEY,
                        "node_env": process.env.NODE_ENV
                    }
                }
            }
        });
    }
}
