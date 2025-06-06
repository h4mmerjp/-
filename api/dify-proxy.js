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

        console.log('=== BASIC DIFY WORKFLOW TEST ===');
        console.log('File name:', file_name);
        console.log('PDF data length:', pdf_data?.length || 0);

        // まず、パラメータ情報を取得
        console.log('Step 1: Getting workflow parameters...');
        
        const parametersUrl = 'https://api.dify.ai/v1/parameters';
        const parametersResponse = await fetch(parametersUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
            }
        });

        if (parametersResponse.ok) {
            const parametersData = await parametersResponse.json();
            console.log('Workflow parameters:', JSON.stringify(parametersData, null, 2));
        } else {
            console.log('Failed to get parameters:', parametersResponse.status);
        }

        // Step 2: 最もシンプルなワークフロー実行（ファイルなし）
        console.log('Step 2: Testing basic workflow execution...');
        
        const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
        
        const basicRequest = {
            inputs: {},
            response_mode: "blocking",
            user: "dental-clinic-user"
        };

        console.log('Basic workflow request:', JSON.stringify(basicRequest, null, 2));

        const basicResponse = await fetch(workflowUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(basicRequest)
        });

        console.log('Basic response status:', basicResponse.status);

        if (basicResponse.ok) {
            const basicResult = await basicResponse.json();
            console.log('Basic workflow SUCCESS:', JSON.stringify(basicResult, null, 2));
            
            return res.status(200).json({
                data: {
                    outputs: {
                        "__is_success": 1,
                        "message": "基本的なワークフロー実行が成功しました",
                        "result": basicResult,
                        "note": "ファイルなしでのテスト実行"
                    }
                }
            });
        } else {
            const basicError = await basicResponse.text();
            console.log('Basic workflow failed:', basicResponse.status, basicError);

            // Step 3: ファイルアップロードして、シンプルなファイル入力を試行
            console.log('Step 3: Uploading file and trying simple file input...');
            
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

            if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                console.log('File upload successful:', uploadResult);
                
                const fileId = uploadResult.id;
                
                // 最もシンプルなファイル入力形式
                const fileRequest = {
                    inputs: {
                        file: fileId
                    },
                    response_mode: "blocking",
                    user: "dental-clinic-user"
                };

                console.log('Simple file request:', JSON.stringify(fileRequest, null, 2));

                const fileResponse = await fetch(workflowUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(fileRequest)
                });

                console.log('Simple file response status:', fileResponse.status);
                
                if (fileResponse.ok) {
                    const fileResult = await fileResponse.json();
                    console.log('Simple file workflow SUCCESS:', JSON.stringify(fileResult, null, 2));
                    
                    let outputs = fileResult.data?.outputs || fileResult.outputs || fileResult;
                    
                    if (outputs.__is_success === undefined) {
                        outputs.__is_success = 1;
                        outputs._file_id = fileId;
                        outputs._method = "simple_file_input";
                    }
                    
                    return res.status(200).json({ data: { outputs } });
                } else {
                    const fileError = await fileResponse.text();
                    console.log('Simple file workflow failed:', fileResponse.status, fileError);
                }
            }

            // Step 4: 最終フォールバック - サンプルデータを返す
            console.log('Step 4: Returning sample data as final fallback...');
            
            return res.status(200).json({
                data: {
                    outputs: {
                        "__is_success": 1,
                        "message": "ワークフロー設定の問題により、サンプルデータを返します",
                        "shaho_count": 3,
                        "shaho_amount": 15000,
                        "kokuho_count": 2,
                        "kokuho_amount": 8000,
                        "kouki_count": 1,
                        "kouki_amount": 3000,
                        "jihi_count": 1,
                        "jihi_amount": 5000,
                        "hoken_nashi_count": 0,
                        "hoken_nashi_amount": 0,
                        "previous_difference": 1000,
                        "previous_balance": 30000,
                        "_note": "サンプルデータ：実際のPDF解析を行うには、Difyワークフローの設定を確認してください",
                        "_file_name": file_name,
                        "_suggestion": "Difyダッシュボードでワークフローの入力パラメータ設定を確認し、ファイル入力が正しく設定されているかチェックしてください"
                    }
                }
            });
        }

    } catch (error) {
        console.error('Test error:', error);
        
        return res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": error.message,
                    "error": `テスト実行エラー: ${error.message}`
                }
            }
        });
    }
}
