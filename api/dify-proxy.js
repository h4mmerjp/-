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

        console.log('=== PDF TEXT EXTRACTION ===');
        console.log('File name:', file_name);
        console.log('PDF data length:', pdf_data?.length || 0);

        if (!pdf_data || !file_name) {
            throw new Error('PDFデータまたはファイル名が不足しています');
        }

        const fileBuffer = Buffer.from(pdf_data, 'base64');
        console.log('File buffer size:', fileBuffer.length);

        // Step 1: ファイルをアップロードしてDifyでテキスト抽出
        console.log('Step 1: Uploading file for text extraction...');
        
        const uploadUrl = 'https://api.dify.ai/v1/files/upload';
        
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'application/pdf' });
        const correctedFileName = file_name.toLowerCase().endsWith('.pdf') ? file_name : `${file_name}.pdf`;
        
        formData.append('file', blob, correctedFileName);
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

        // Step 2: Chat APIを使用してPDF内容を抽出
        console.log('Step 2: Extracting PDF content using Chat API...');
        
        const chatUrl = 'https://api.dify.ai/v1/chat-messages';
        
        const chatRequest = {
            inputs: {},
            query: "このPDFファイルから以下の情報を抽出してJSON形式で返してください：社保の件数と金額、国保の件数と金額、後期の件数と金額、自費の件数と金額、保険なしの件数と金額、前回差額、物販合計。例：{\"shaho_count\":\"42\",\"shaho_amount\":\"130500\",\"kokuho_count\":\"4\",\"kokuho_amount\":\"6050\"}",
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

        let extractedData = {};
        
        if (chatResponse.ok) {
            const chatResult = JSON.parse(chatText);
            const answer = chatResult.answer || "";
            console.log('Chat answer:', answer);
            
            // JSONレスポンスの抽出
            try {
                // 様々なJSON形式に対応
                const jsonMatches = [
                    answer.match(/```json\s*([\s\S]*?)\s*```/),
                    answer.match(/```\s*({[\s\S]*?})\s*```/),
                    answer.match(/({[\s\S]*?})/),
                    answer.match(/"shaho_count"[\s\S]*?"}/),
                ];
                
                for (const match of jsonMatches) {
                    if (match) {
                        try {
                            const jsonStr = match[1] || match[0];
                            extractedData = JSON.parse(jsonStr);
                            console.log('Successfully extracted JSON:', extractedData);
                            break;
                        } catch (e) {
                            console.log('JSON parse attempt failed:', e.message);
                            continue;
                        }
                    }
                }
                
                // JSONが抽出できない場合、テキストから手動抽出
                if (Object.keys(extractedData).length === 0) {
                    console.log('Manual text extraction...');
                    
                    // 数値パターンを抽出
                    const numberPattern = /(\d+(?:,\d{3})*)/g;
                    const numbers = answer.match(numberPattern) || [];
                    console.log('Extracted numbers:', numbers);
                    
                    // パターンマッチングで情報抽出
                    extractedData = {
                        shaho_count: extractNumberFromText(answer, ['社保', '社会保険'], ['件', '人']) || "0",
                        shaho_amount: extractNumberFromText(answer, ['社保', '社会保険'], ['円', '金額']) || "0", 
                        kokuho_count: extractNumberFromText(answer, ['国保', '国民保険'], ['件', '人']) || "0",
                        kokuho_amount: extractNumberFromText(answer, ['国保', '国民保険'], ['円', '金額']) || "0",
                        kouki_count: extractNumberFromText(answer, ['後期', '高齢'], ['件', '人']) || "0",
                        kouki_amount: extractNumberFromText(answer, ['後期', '高齢'], ['円', '金額']) || "0",
                        jihi_count: extractNumberFromText(answer, ['自費'], ['件', '人']) || "0",
                        jihi_amount: extractNumberFromText(answer, ['自費'], ['円', '金額']) || "0",
                        hoken_nashi_count: extractNumberFromText(answer, ['保険なし', '保険無'], ['件', '人']) || "0",
                        hoken_nashi_amount: extractNumberFromText(answer, ['保険なし', '保険無'], ['円', '金額']) || "0",
                        previous_difference: extractNumberFromText(answer, ['前回', '差額'], ['円']) || "0",
                        bushan_amount: extractNumberFromText(answer, ['物販', '販売'], ['円', '合計']) || "0"
                    };
                }
                
            } catch (e) {
                console.error('Text extraction failed:', e);
                extractedData = {
                    error: "PDF内容の抽出に失敗しました",
                    raw_response: answer.substring(0, 500)
                };
            }
            
        } else {
            // Chat APIが失敗した場合、元のワークフローAPIを試行
            console.log('Chat API failed, trying original workflow...');
            
            const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
            const workflowRequest = {
                inputs: { file: fileId },
                response_mode: "blocking",
                user: "dental-clinic-user"
            };

            const workflowResponse = await fetch(workflowUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(workflowRequest)
            });

            const workflowText = await workflowResponse.text();
            console.log('Workflow fallback response:', workflowResponse.status, workflowText);

            if (workflowResponse.ok) {
                const workflowResult = JSON.parse(workflowText);
                extractedData = workflowResult.data?.outputs || workflowResult.outputs || {};
            }
        }

        // 標準形式に変換
        const outputs = {
            __is_success: 1,
            _file_id: fileId,
            _extraction_method: chatResponse.ok ? "chat_api" : "workflow_fallback",
            shaho_count: String(extractedData.shaho_count || "0"),
            shaho_amount: String(extractedData.shaho_amount || "0"),
            kokuho_count: String(extractedData.kokuho_count || "0"), 
            kokuho_amount: String(extractedData.kokuho_amount || "0"),
            kouki_count: String(extractedData.kouki_count || "0"),
            kouki_amount: String(extractedData.kouki_amount || "0"),
            jihi_count: String(extractedData.jihi_count || "0"),
            jihi_amount: String(extractedData.jihi_amount || "0"),
            hoken_nashi_count: String(extractedData.hoken_nashi_count || "0"),
            hoken_nashi_amount: String(extractedData.hoken_nashi_amount || "0"),
            previous_difference: String(extractedData.previous_difference || "0"),
            bushan_amount: String(extractedData.bushan_amount || "0"),
            bushan_note: extractedData.bushan_note || "物販",
            _raw_extracted_data: extractedData
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
                    "_debug_info": {
                        "error_type": error.constructor.name,
                        "timestamp": new Date().toISOString()
                    }
                }
            }
        });
    }
}

// ヘルパー関数：テキストから数値を抽出
function extractNumberFromText(text, keywords, suffixes) {
    for (const keyword of keywords) {
        for (const suffix of suffixes) {
            const pattern = new RegExp(`${keyword}[^\\d]*?(\\d+(?:,\\d{3})*)\\s*${suffix}`, 'i');
            const match = text.match(pattern);
            if (match) {
                return match[1].replace(/,/g, '');
            }
        }
    }
    return null;
}
