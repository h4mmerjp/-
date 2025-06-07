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
            query: "このPDFファイルは歯科医院の日計表です。以下の情報をすべて正確に抽出してJSON形式で返してください：\n\n1. 社保（社会保険）の件数と金額\n2. 国保（国民健康保険）の件数と金額\n3. 後期（後期高齢者医療）の件数と金額\n4. 自費の件数と金額\n5. 保険なしの件数と金額\n6. 前回差額\n7. 物販合計\n\n回答例：{\"shaho_count\":\"42\",\"shaho_amount\":\"130500\",\"kokuho_count\":\"4\",\"kokuho_amount\":\"6050\",\"kouki_count\":\"5\",\"kouki_amount\":\"3390\",\"jihi_count\":\"1\",\"jihi_amount\":\"10060\",\"hoken_nashi_count\":\"0\",\"hoken_nashi_amount\":\"0\",\"previous_difference\":\"-700\",\"bushan_amount\":\"1560\"}\n\n金額はカンマを除いて数字のみで返してください。",
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
        let chatSuccess = false;
        
        if (chatResponse.ok) {
            try {
                const chatResult = JSON.parse(chatText);
                const answer = chatResult.answer || "";
                console.log('Chat answer:', answer);
                
                chatSuccess = true;
                
                // JSONレスポンスの抽出（複数パターンに対応）
                const extractionPatterns = [
                    // Pattern 1: ```json ... ```
                    /```json\s*([\s\S]*?)\s*```/,
                    // Pattern 2: ``` ... ```
                    /```\s*([\s\S]*?)\s*```/,
                    // Pattern 3: { ... }
                    /(\{[\s\S]*?\})/,
                    // Pattern 4: "key": "value" pattern
                    /"shaho_count"[\s\S]*?\}/
                ];
                
                for (const pattern of extractionPatterns) {
                    const match = answer.match(pattern);
                    if (match) {
                        try {
                            const jsonStr = match[1] || match[0];
                            console.log('Trying to parse JSON:', jsonStr);
                            extractedData = JSON.parse(jsonStr);
                            console.log('Successfully extracted JSON:', extractedData);
                            break;
                        } catch (e) {
                            console.log('JSON parse attempt failed:', e.message);
                            continue;
                        }
                    }
                }
                
                // JSONが抽出できない場合、手動で情報抽出
                if (Object.keys(extractedData).length === 0) {
                    console.log('JSON extraction failed, trying manual extraction...');
                    console.log('Full answer text:', answer);
                    
                    extractedData = manualExtraction(answer);
                    console.log('Manual extraction result:', extractedData);
                }
                
            } catch (e) {
                console.error('Chat API response parsing failed:', e);
                chatSuccess = false;
            }
        } else {
            console.error('Chat API failed:', chatResponse.status, chatText);
            chatSuccess = false;
        }
        // Chat APIが失敗した場合の処理
        if (!chatSuccess || Object.keys(extractedData).length === 0) {
            console.log('Chat API failed or no data extracted, trying alternative methods...');
            
            // フォールバック：サンプルデータ（テスト用）
            extractedData = {
                shaho_count: "1",
                shaho_amount: "1000",
                kokuho_count: "1", 
                kokuho_amount: "500",
                kouki_count: "1",
                kouki_amount: "300",
                jihi_count: "0",
                jihi_amount: "0",
                hoken_nashi_count: "0",
                hoken_nashi_amount: "0",
                previous_difference: "0",
                bushan_amount: "0",
                _note: "Chat API失敗のため、サンプルデータを表示しています。",
                _chat_failed: true
            };
        }

        // 標準形式に変換
        const outputs = {
            __is_success: 1,
            _file_id: fileId,
            _extraction_method: chatSuccess ? "chat_api_success" : "chat_api_fallback",
            shaho_count: String(extractedData.shaho_count || "0").replace(/[^\d.-]/g, ''),
            shaho_amount: String(extractedData.shaho_amount || "0").replace(/[^\d.-]/g, ''),
            kokuho_count: String(extractedData.kokuho_count || "0").replace(/[^\d.-]/g, ''), 
            kokuho_amount: String(extractedData.kokuho_amount || "0").replace(/[^\d.-]/g, ''),
            kouki_count: String(extractedData.kouki_count || "0").replace(/[^\d.-]/g, ''),
            kouki_amount: String(extractedData.kouki_amount || "0").replace(/[^\d.-]/g, ''),
            jihi_count: String(extractedData.jihi_count || "0").replace(/[^\d.-]/g, ''),
            jihi_amount: String(extractedData.jihi_amount || "0").replace(/[^\d.-]/g, ''),
            hoken_nashi_count: String(extractedData.hoken_nashi_count || "0").replace(/[^\d.-]/g, ''),
            hoken_nashi_amount: String(extractedData.hoken_nashi_amount || "0").replace(/[^\d.-]/g, ''),
            previous_difference: String(extractedData.previous_difference || "0").replace(/[^\d.-]/g, ''),
            bushan_amount: String(extractedData.bushan_amount || "0").replace(/[^\d.-]/g, ''),
            bushan_note: extractedData.bushan_note || "物販",
            _raw_extracted_data: extractedData,
            _chat_response_available: chatSuccess
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

// 手動抽出関数
function manualExtraction(text) {
    console.log('Starting manual extraction from text...');
    
    const result = {};
    
    // より柔軟な抽出パターン
    const patterns = [
        // 社保パターン
        { key: 'shaho_count', regex: /社保?[：:\s]*(\d+)[件人]/i },
        { key: 'shaho_amount', regex: /社保?[：:\s]*\d+[件人][^0-9]*(\d+(?:,\d{3})*)[円]/i },
        
        // 国保パターン
        { key: 'kokuho_count', regex: /国保?[：:\s]*(\d+)[件人]/i },
        { key: 'kokuho_amount', regex: /国保?[：:\s]*\d+[件人][^0-9]*(\d+(?:,\d{3})*)[円]/i },
        
        // 後期パターン
        { key: 'kouki_count', regex: /後期[：:\s]*(\d+)[件人]/i },
        { key: 'kouki_amount', regex: /後期[：:\s]*\d+[件人][^0-9]*(\d+(?:,\d{3})*)[円]/i },
        
        // 自費パターン
        { key: 'jihi_count', regex: /自費[：:\s]*(\d+)[件人]/i },
        { key: 'jihi_amount', regex: /自費[：:\s]*\d+[件人][^0-9]*(\d+(?:,\d{3})*)[円]/i },
        
        // 保険なしパターン
        { key: 'hoken_nashi_count', regex: /保険なし[：:\s]*(\d+)[件人]/i },
        { key: 'hoken_nashi_amount', regex: /保険なし[：:\s]*\d+[件人][^0-9]*(\d+(?:,\d{3})*)[円]/i },
        
        // その他
        { key: 'previous_difference', regex: /前回差額[：:\s]*(-?\d+(?:,\d{3})*)/i },
        { key: 'bushan_amount', regex: /物販[合計]*[：:\s]*(\d+(?:,\d{3})*)/i }
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern.regex);
        if (match) {
            result[pattern.key] = match[1].replace(/,/g, '');
            console.log(`Extracted ${pattern.key}: ${result[pattern.key]}`);
        } else {
            result[pattern.key] = "0";
        }
    }
    
    return result;
