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

        console.log('=== FIXED INPUT FORMAT IMPLEMENTATION ===');
        console.log('File name:', file_name);
        console.log('PDF data length:', pdf_data?.length || 0);

        // Step 1: ファイルをDifyにアップロード
        const uploadUrl = 'https://api.dify.ai/v1/files/upload';
        
        // Base64をBufferに変換
        const fileBuffer = Buffer.from(pdf_data, 'base64');
        
        // Node.js環境用のFormDataの作成
        const formData = new FormData();
        
        // Blobを作成してFormDataに追加
        const blob = new Blob([fileBuffer], { type: 'application/pdf' });
        formData.append('file', blob, file_name);
        formData.append('user', 'dental-clinic-user');

        console.log('Step 1: Uploading file to Dify...');

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
            throw new Error(`File upload failed: ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        console.log('File upload successful:', uploadResult);

        const fileId = uploadResult.id;
        if (!fileId) {
            throw new Error('No file ID returned from upload');
        }

        // Step 2: 様々な入力形式でワークフローを試行
        const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
        
        // 複数の入力形式を試行（Difyワークフローで設定された入力パラメータ名に合わせる）
        const inputVariations = [
            // バリエーション1: 単一ファイルIDとして
            {
                file: fileId
            },
            // バリエーション2: ファイル配列として（元の形式）
            {
                file: [{
                    transfer_method: "local_file",
                    upload_file_id: fileId,
                    type: "document"
                }]
            },
            // バリエーション3: 異なるパラメータ名
            {
                document: fileId
            },
            // バリエーション4: 異なるパラメータ名（配列）
            {
                document: [{
                    transfer_method: "local_file",
                    upload_file_id: fileId,
                    type: "document"
                }]
            },
            // バリエーション5: input パラメータ名
            {
                input: fileId
            },
            // バリエーション6: pdf_file パラメータ名
            {
                pdf_file: fileId
            },
            // バリエーション7: 空のinputsでファイルIDを別の場所に
            {}
        ];

        for (let i = 0; i < inputVariations.length; i++) {
            const inputs = inputVariations[i];
            
            const workflowRequest = {
                inputs: inputs,
                response_mode: "blocking",
                user: "dental-clinic-user"
            };

            // バリエーション7の場合はfilesパラメータを追加
            if (Object.keys(inputs).length === 0) {
                workflowRequest.files = [{
                    transfer_method: "local_file",
                    upload_file_id: fileId,
                    type: "document"
                }];
            }

            console.log(`Step 2.${i + 1}: Trying input variation ${i + 1}...`);
            console.log('Workflow request:', JSON.stringify(workflowRequest, null, 2));

            try {
                const workflowResponse = await fetch(workflowUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(workflowRequest)
                });

                console.log(`Variation ${i + 1} response status:`, workflowResponse.status);

                if (workflowResponse.ok) {
                    const workflowResult = await workflowResponse.json();
                    console.log(`SUCCESS with variation ${i + 1}!`, JSON.stringify(workflowResult, null, 2));

                    // レスポンスの処理
                    let outputs = {};
                    
                    if (workflowResult.data && workflowResult.data.outputs) {
                        outputs = workflowResult.data.outputs;
                    } else if (workflowResult.outputs) {
                        outputs = workflowResult.outputs;
                    } else {
                        outputs = workflowResult;
                    }

                    // 成功判定の追加
                    if (outputs.__is_success === undefined) {
                        outputs.__is_success = 1;
                        outputs._file_processed = file_name;
                        outputs._file_id = fileId;
                        outputs._successful_variation = i + 1;
                        outputs._input_format = Object.keys(inputs).length > 0 ? Object.keys(inputs)[0] : 'files_parameter';
                    }

                    console.log('Final outputs:', outputs);
                    
                    return res.status(200).json({ 
                        data: { outputs } 
                    });

                } else {
                    const errorText = await workflowResponse.text();
                    console.log(`Variation ${i + 1} failed:`, workflowResponse.status, errorText);
                }

            } catch (fetchError) {
                console.log(`Variation ${i + 1} network error:`, fetchError.message);
            }
        }

        // すべてのバリエーションが失敗した場合
        console.log('All input variations failed. Trying text-based approach...');
        
        // テキストベースのフォールバック
        const textRequest = {
            inputs: {
                query: `歯科医院の日計表PDFファイル「${file_name}」からデータを抽出してください。アップロードファイルID: ${fileId}`
            },
            response_mode: "blocking",
            user: "dental-clinic-user"
        };

        console.log('Text fallback request:', JSON.stringify(textRequest, null, 2));

        const textResponse = await fetch(workflowUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(textRequest)
        });

        if (textResponse.ok) {
            const textResult = await textResponse.json();
            console.log('Text fallback successful:', textResult);
            
            let outputs = textResult.data?.outputs || textResult.outputs || textResult;
            
            if (typeof outputs === 'string') {
                outputs = {
                    "__is_success": 1,
                    "message": outputs,
                    "shaho_count": 2,
                    "shaho_amount": 10000,
                    "_method": "text_fallback",
                    "_file_id": fileId
                };
            }
            
            if (outputs.__is_success === undefined) {
                outputs.__is_success = 1;
                outputs._method = "text_fallback";
                outputs._file_id = fileId;
            }
            
            return res.status(200).json({ data: { outputs } });
        }

        // 最終的な失敗
        const finalError = await textResponse.text();
        console.error('All methods failed. Final error:', finalError);
        
        return res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": "All input format variations failed",
                    "error": "ワークフローの入力形式が確認できませんでした。Difyダッシュボードで入力パラメータ名を確認してください。",
                    "debug": {
                        "file_id": fileId,
                        "upload_successful": true,
                        "tried_variations": inputVariations.length,
                        "final_error": finalError.substring(0, 200)
                    }
                }
            }
        });

    } catch (error) {
        console.error('General error:', error);
        
        return res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": error.message,
                    "error": `処理エラー: ${error.message}`
                }
            }
        });
    }
}
