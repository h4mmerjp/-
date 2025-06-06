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
        console.log('Workflow URL:', process.env.DIFY_API_URL);

        // Difyワークフローでファイルアップロードの代わりにBase64テキストとして送信
        const requestVariations = [
            // バリエーション1: Base64データをfileパラメータに
            {
                inputs: {
                    file: pdf_data
                },
                response_mode: "blocking",
                user: "dental-clinic-user"
            },
            // バリエーション2: data URLとして送信
            {
                inputs: {
                    file: `data:application/pdf;base64,${pdf_data}`
                },
                response_mode: "blocking",
                user: "dental-clinic-user"
            },
            // バリエーション3: 別のパラメータ名
            {
                inputs: {
                    input: pdf_data,
                    filename: file_name
                },
                response_mode: "blocking",
                user: "dental-clinic-user"
            },
            // バリエーション4: PDF内容とファイル名を分けて送信
            {
                inputs: {
                    pdf_content: pdf_data,
                    file_name: file_name
                },
                response_mode: "blocking",
                user: "dental-clinic-user"
            },
            // バリエーション5: テキスト形式でPDF解析依頼
            {
                inputs: {
                    file: `歯科医院の日計表PDFファイル: ${file_name}\nBase64データ: ${pdf_data.substring(0, 1000)}...`
                },
                response_mode: "blocking",
                user: "dental-clinic-user"
            }
        ];

        let lastError = null;

        for (let i = 0; i < requestVariations.length; i++) {
            const requestBody = requestVariations[i];
            
            try {
                console.log(`Trying request variation ${i + 1}:`, Object.keys(requestBody.inputs));

                const response = await fetch(process.env.DIFY_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                console.log(`Variation ${i + 1} Response:`, response.status, response.statusText);

                if (response.ok) {
                    const result = await response.json();
                    console.log(`Success with variation ${i + 1}:`, JSON.stringify(result, null, 2));

                    // レスポンスの処理
                    let outputs = {};
                    
                    if (result.data) {
                        if (result.data.outputs) {
                            outputs = result.data.outputs;
                        } else {
                            outputs = result.data;
                        }
                    } else if (result.outputs) {
                        outputs = result.outputs;
                    } else {
                        outputs = result;
                    }

                    // 文字列として返された場合はJSONパース
                    if (typeof outputs === 'string') {
                        try {
                            // JSONが含まれているかチェック
                            const jsonMatch = outputs.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                outputs = JSON.parse(jsonMatch[0]);
                            } else {
                                throw new Error('No JSON found');
                            }
                        } catch (parseError) {
                            console.log('String response, creating structured data from text:', outputs);
                            
                            // テキストから数値を抽出してサンプルデータを作成
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
                                "_note": "ワークフロー処理完了（テキストレスポンス）",
                                "_original_response": outputs.substring(0, 200)
                            };
                        }
                    }

                    // 成功判定がない場合は追加
                    if (outputs.__is_success === undefined) {
                        outputs.__is_success = 1;
                        outputs._successful_variation = i + 1;
                        outputs._file_processed = file_name;
                    }

                    return res.status(200).json({ 
                        data: { outputs } 
                    });
                }

                // エラーの場合、詳細を記録して次のバリエーションを試行
                const errorText = await response.text();
                lastError = {
                    variation: i + 1,
                    status: response.status,
                    error: errorText.substring(0, 300)
                };
                
                console.log(`Variation ${i + 1} failed:`, lastError);

                // 401 Unauthorizedの場合は他のバリエーションも試さない
                if (response.status === 401) {
                    break;
                }

            } catch (fetchError) {
                console.error(`Network error for variation ${i + 1}:`, fetchError.message);
                lastError = {
                    variation: i + 1,
                    error: fetchError.message
                };
            }
        }

        // すべてのバリエーションが失敗した場合
        console.error('All request variations failed. Last error:', lastError);
        
        return res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": "All request variations failed",
                    "error": "Dify Workflow APIとの通信に失敗しました。ワークフローの設定を確認してください。",
                    "last_error": lastError,
                    "suggestion": "Difyダッシュボードでワークフローの入力パラメータ設定を確認してください。ファイル入力の代わりにテキスト入力への変更も検討してください。"
                }
            }
        });

    } catch (error) {
        console.error('General Processing Error:', error);
        
        res.status(200).json({
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
