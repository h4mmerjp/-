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

        console.log('Processing PDF:', file_name);

        // 正しいDify APIエンドポイントを使用
        const difyEndpoint = `${process.env.DIFY_API_URL}/chat-messages`;
        
        // PDFファイルを先にアップロード
        const uploadResponse = await fetch(`${process.env.DIFY_API_URL}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
            },
            body: (() => {
                const formData = new FormData();
                // Base64をBlobに変換
                const binaryString = atob(pdf_data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/pdf' });
                formData.append('file', blob, file_name);
                formData.append('user', 'dental-clinic-user');
                return formData;
            })()
        });

        let fileId = null;
        if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            fileId = uploadResult.id;
            console.log('File uploaded successfully:', fileId);
        } else {
            console.log('File upload failed, proceeding with text-only approach');
        }

        // チャットメッセージでデータ抽出を実行
        const response = await fetch(difyEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {},
                query: fileId ? 
                    `歯科医院の日計表データを抽出してください。アップロードされたPDFファイル: ${file_name}` :
                    `歯科医院の日計表データを抽出してください。PDFの内容を解析し、以下の形式でJSONデータを返してください：
                    {
                        "__is_success": 1,
                        "shaho_count": 社保患者数,
                        "shaho_amount": 社保収入額,
                        "kokuho_count": 国保患者数,
                        "kokuho_amount": 国保収入額,
                        "kouki_count": 後期高齢者患者数,
                        "kouki_amount": 後期高齢者収入額,
                        "jihi_count": 自費患者数,
                        "jihi_amount": 自費収入額,
                        "hoken_nashi_count": 保険なし患者数,
                        "hoken_nashi_amount": 保険なし収入額,
                        "previous_difference": 前回差額（符号付き整数）,
                        "previous_balance": 前日繰越額
                    }
                    
                    ファイル内容: ${pdf_data.substring(0, 1000)}...`,
                response_mode: "blocking",
                user: "dental-clinic-user",
                ...(fileId && { files: [{ type: "document", transfer_method: "local_file", upload_file_id: fileId }] })
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Dify API Error:', response.status, errorText);
            
            // Dify APIエラー時のフォールバック
            return res.status(200).json({
                data: {
                    outputs: {
                        "__is_success": 0,
                        "__reason": `Dify API Error: ${response.status} - ${errorText}`,
                        "error": "Dify API接続エラー、管理者に連絡してください。"
                    }
                }
            });
        }

        const result = await response.json();
        console.log('Dify API Response:', JSON.stringify(result, null, 2));

        // レスポンス形式の正規化
        let outputs = result;
        
        // Difyのレスポンス形式に応じて調整
        if (result.answer) {
            // チャットメッセージの場合、answerフィールドからJSONを抽出
            try {
                const jsonMatch = result.answer.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    outputs = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No JSON found in response');
                }
            } catch (parseError) {
                console.error('JSON parsing error:', parseError);
                outputs = {
                    "__is_success": 0,
                    "__reason": "Response parsing failed",
                    "error": "レスポンスの解析に失敗しました"
                };
            }
        } else if (result.data && result.data.outputs) {
            outputs = result.data.outputs;
        } else if (result.outputs) {
            outputs = result.outputs;
        }

        // 成功判定とレスポンス
        if (outputs.__is_success === 1) {
            console.log('Data extraction successful');
        } else {
            console.log('Data extraction failed:', outputs.__reason || 'Unknown reason');
        }

        res.status(200).json({ data: { outputs } });

    } catch (error) {
        console.error('API Processing Error:', error);
        
        // エラー時のフォールバック処理
        res.status(200).json({
            data: {
                outputs: {
                    "__is_success": 0,
                    "__reason": error.message,
                    "error": "PDF処理中にエラーが発生しました。ファイル形式やAPI設定を確認してください。"
                }
            }
        });
    }
}
