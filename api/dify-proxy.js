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
        console.log('Upload response body:', uploadText);

        if (!uploadResponse.ok) {
            throw new Error(`ファイルアップロードに失敗しました: ${uploadResponse.status} - ${uploadText}`);
        }

        const uploadResult = JSON.parse(uploadText);
        const fileId = uploadResult.id;
        console.log('File uploaded successfully. ID:', fileId);
        console.log('Upload result details:', JSON.stringify(uploadResult, null, 2));

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
                
                const parsedResponse = JSON.parse(workflowText);
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
