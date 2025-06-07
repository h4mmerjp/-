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

        console.log('=== DIFY CHAT API APPROACH ===');
        console.log('File name:', file_name);
        console.log('PDF data length:', pdf_data?.length || 0);

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

        if (!uploadResponse.ok) {
            throw new Error(`ファイルアップロードに失敗しました: ${uploadResponse.status} - ${uploadText}`);
        }

        const uploadResult = JSON.parse(uploadText);
        const fileId = uploadResult.id;
        console.log('File uploaded successfully. ID:', fileId);

        // Step 2: まずChat APIを試行
        console.log('Step 2: Trying Chat API first...');
        
        const chatUrl = 'https://api.dify.ai/v1/chat-messages';
        
        const chatRequest = {
            inputs: {},
            query: "この日計表PDFから各保険種別（社保、国保、後期、自費、保険なし）の件数と金額の合計を抽出してください。JSON形式で回答してください。",
            response_mode: "blocking",
            conversation_id: "",
            user: "dental-clinic-user",
            files: [
                {
                    type: "file",
                    transfer_method: "local_file",
                    upload_file_id: fileId
                }
            ]
        };

        console.log('Chat API request:', JSON.stringify(chatRequest, null, 2));

        const chatResponse = await fetch(chatUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatRequest)
        });

        const chatText = await chatResponse.text();
        console.log('Chat API response status:', chatResponse.status);
        console.log('Raw chat response:', chatText);

        if (chatResponse.ok) {
            // Chat APIが成功した場合
            const chatResult = JSON.parse(chatText);
            console.log('Chat API successful!');
            
            const answer = chatResult.answer || "";
            console.log('Chat answer:', answer);
            
            // JSONレスポンスの抽出を試行
            let extractedData = {};
            try {
                // 応答からJSONを抽出
                const jsonMatch = answer.match(/```json\s*([\s\S]*?)\s*```/) || 
                                answer.match(/```\s*([\s\S]*?)\s*```/) ||
                                answer.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    const jsonStr = jsonMatch[1] || jsonMatch[0];
                    extractedData = JSON.parse(jsonStr);
                    console.log('Extracted JSON:', extractedData);
                } else {
                    // 手動でパターンマッチング
                    extractedData = {
                        note: "JSONの自動抽出に失敗しましたが、Chat APIは成功しました",
                        raw_answer: answer
                    };
                }
            } catch (e) {
                console.error('JSON extraction failed:', e);
                extractedData = {
                    note: "JSON抽出エラー",
                    raw_answer: answer,
                    extraction_error: e.message
                };
            }

            // 標準形式に変換
            const outputs = {
                __is_success: 1,
                _file_id: fileId,
                _api_method: "chat_api",
                _raw_response: answer,
                shaho_count: extractedData.shaho_count || "0",
                shaho_amount: extractedData.shaho_amount || "0",
                kokuho_count: extractedData.kokuho_count || "0",
                kokuho_amount: extractedData.kokuho_amount || "0",
                kouki_count: extractedData.kouki_count || "0",
                kouki_amount: extractedData.kouki_amount || "0",
                jihi_count: extractedData.jihi_count || "0",
                jihi_amount: extractedData.jihi_amount || "0",
                hoken_nashi_count: extractedData.hoken_nashi_count || "0",
                hoken_nashi_amount: extractedData.hoken_nashi_amount || "0",
                previous_difference: extractedData.previous_difference || "0",
                bushan_amount: extractedData.bushan_amount || "0",
                ...extractedData
            };

            console.log('Final outputs:', JSON.stringify(outputs, null, 2));

            return res.status(200).json({
                data: { outputs: outputs }
            });
        }
            // Chat APIが失敗した場合、元のWorkflow APIも試行
            console.log('Chat API failed, trying original workflow API...');
            
            const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
            
            // ファイル形式を完全に明示
            const workflowRequest = {
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

            console.log('Fallback workflow request:', JSON.stringify(workflowRequest, null, 2));

            const workflowResponse = await fetch(workflowUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(workflowRequest)
            });

            const workflowText = await workflowResponse.text();
            console.log('Fallback workflow response:', workflowResponse.status, workflowText);

            if (!workflowResponse.ok) {
                throw new Error(`両方のAPI手法が失敗しました。Chat API: ${chatResponse.status}, Workflow API: ${workflowResponse.status}`);
            }

            const workflowResult = JSON.parse(workflowText);
            
            // ワークフローAPIの結果を返す
            let outputs = workflowResult.data?.outputs || workflowResult.outputs || {};
            if (outputs.__is_success === undefined) {
                outputs.__is_success = 1;
            }
            outputs._file_id = fileId;
            outputs._api_method = "workflow_fallback";

            return res.status(200).json({
                data: { outputs: outputs }
            });
        }

        // Chat APIが成功した場合
        const chatResult = JSON.parse(chatText);
        console.log('Chat API successful:', JSON.stringify(chatResult, null, 2));

        // Chat APIの応答からデータを抽出
        const answer = chatResult.answer || "";
        
        // JSONレスポンスの抽出を試行
        let extractedData = {};
        try {
            // 応答からJSONを抽出（```json ... ``` 形式の場合）
            const jsonMatch = answer.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                extractedData = JSON.parse(jsonMatch[1]);
            } else {
                // 直接JSON形式の場合
                const directJsonMatch = answer.match(/\{[\s\S]*\}/);
                if (directJsonMatch) {
                    extractedData = JSON.parse(directJsonMatch[0]);
                }
            }
        } catch (e) {
            console.error('Could not extract JSON from chat response:', e);
            // サンプルデータをフォールバック
            extractedData = {
                shaho_count: "0",
                shaho_amount: "0",
                kokuho_count: "0", 
                kokuho_amount: "0",
                kouki_count: "0",
                kouki_amount: "0",
                jihi_count: "0",
                jihi_amount: "0",
                hoken_nashi_count: "0",
                hoken_nashi_amount: "0",
                note: "Chat APIからのJSON抽出に失敗しました"
            };
        }

        // 標準形式に変換
        const outputs = {
            __is_success: 1,
            _file_id: fileId,
            _api_method: "chat_api",
            _raw_response: answer,
            ...extractedData
        };

        console.log('Final outputs:', JSON.stringify(outputs, null, 2));

        return res.status(200).json({
            data: { outputs: outputs }
        });

    } catch (error) {
        console.error('API Error:', error);
        
        return res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": error.message,
                    "error": `API実行エラー: ${error.message}`,
                    "_debug_info": {
                        "api_key_configured": !!process.env.DIFY_API_KEY,
                        "timestamp": new Date().toISOString()
                    }
                }
            }
        });
    }
}
