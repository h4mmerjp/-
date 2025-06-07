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

        console.log('=== SIMPLIFIED EXTRACTION ===');
        console.log('File name:', file_name);
        console.log('PDF data length:', pdf_data?.length || 0);

        if (!pdf_data || !file_name) {
            throw new Error('PDFデータまたはファイル名が不足しています');
        }

        // Step 1: ファイルをアップロード
        console.log('Step 1: Uploading file...');
        
        const uploadUrl = 'https://api.dify.ai/v1/files/upload';
        const fileBuffer = Buffer.from(pdf_data, 'base64');
        
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

        // Step 2: PDFから簡易的にテキスト抽出を試行
        console.log('Step 2: Simple text extraction...');
        
        let extractedText = '';
        try {
            // Base64からテキスト抽出を試行
            const pdfText = fileBuffer.toString('utf8');
            console.log('PDF text length:', pdfText.length);
            console.log('PDF text preview:', pdfText.substring(0, 200));
            
            // 意味のある行を抽出
            const lines = pdfText.split(/[\r\n]+/);
            const meaningfulLines = lines.filter(line => {
                const cleanLine = line.trim();
                return cleanLine.length > 3 && (
                    cleanLine.includes('社') || cleanLine.includes('国') || 
                    cleanLine.includes('後期') || cleanLine.includes('自費') ||
                    cleanLine.includes('保険') || cleanLine.includes('円') ||
                    cleanLine.includes('件') || cleanLine.includes('計') ||
                    /\d/.test(cleanLine) // 数字を含む行
                );
            });
            
            extractedText = meaningfulLines.join('\n');
            console.log('Meaningful lines count:', meaningfulLines.length);
            console.log('Extracted text preview:', extractedText.substring(0, 300));
            
        } catch (e) {
            console.error('Text extraction failed:', e);
            extractedText = '';
        }

        // Step 3: パターンマッチングでデータ抽出
        console.log('Step 3: Pattern matching extraction...');
        
        const extractedData = performPatternMatching(extractedText);
        console.log('Pattern matching result:', extractedData);

        // Step 4: 元のワークフローも試行
        console.log('Step 4: Trying original workflow...');
        
        const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
        const workflowRequest = {
            inputs: { file: extractedText || fileId },
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
        console.log('Workflow response status:', workflowResponse.status);
        console.log('Workflow response:', workflowText);

        let workflowData = {};
        if (workflowResponse.ok) {
            try {
                const workflowResult = JSON.parse(workflowText);
                workflowData = workflowResult.data?.outputs || workflowResult.outputs || {};
                console.log('Workflow data:', workflowData);
            } catch (e) {
                console.error('Workflow response parsing failed:', e);
            }
        }

        // Step 5: 結果をマージ
        const finalData = {
            ...extractedData,
            ...workflowData
        };

        // 標準形式に変換
        const outputs = {
            __is_success: 1,
            _file_id: fileId,
            _extraction_method: "simplified_pattern_matching",
            shaho_count: String(finalData.shaho_count || extractedData.shaho_count || "0"),
            shaho_amount: String(finalData.shaho_amount || extractedData.shaho_amount || "0"),
            kokuho_count: String(finalData.kokuho_count || extractedData.kokuho_count || "0"), 
            kokuho_amount: String(finalData.kokuho_amount || extractedData.kokuho_amount || "0"),
            kouki_count: String(finalData.kouki_count || extractedData.kouki_count || "0"),
            kouki_amount: String(finalData.kouki_amount || extractedData.kouki_amount || "0"),
            jihi_count: String(finalData.jihi_count || extractedData.jihi_count || "0"),
            jihi_amount: String(finalData.jihi_amount || extractedData.jihi_amount || "0"),
            hoken_nashi_count: String(finalData.hoken_nashi_count || extractedData.hoken_nashi_count || "0"),
            hoken_nashi_amount: String(finalData.hoken_nashi_amount || extractedData.hoken_nashi_amount || "0"),
            previous_difference: String(finalData.previous_difference || extractedData.previous_difference || "0"),
            bushan_amount: String(finalData.bushan_amount || extractedData.bushan_amount || "0"),
            bushan_note: finalData.bushan_note || extractedData.bushan_note || "物販",
            _extracted_text_length: extractedText.length,
            _pattern_matching_data: extractedData,
            _workflow_data: workflowData
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
                        "error_stack": error.stack,
                        "timestamp": new Date().toISOString()
                    }
                }
            }
        });
    }
}

// パターンマッチング関数
function performPatternMatching(text) {
    console.log('Performing pattern matching on text...');
    
    const result = {};
    
    // 数値抽出のパターン
    const patterns = [
        // 社保
        { 
            key: 'shaho_count', 
            regexes: [
                /社保[^\d]*(\d+)[件人数]/i,
                /社会保険[^\d]*(\d+)[件人数]/i,
                /社本[^\d]*(\d+)[件人数]/i
            ]
        },
        { 
            key: 'shaho_amount', 
            regexes: [
                /社保[^\d]*\d+[件人数][^\d]*(\d+(?:,\d{3})*)/i,
                /社会保険[^\d]*\d+[件人数][^\d]*(\d+(?:,\d{3})*)/i,
                /社本[^\d]*\d+[件人数][^\d]*(\d+(?:,\d{3})*)/i
            ]
        },
        
        // 国保
        { 
            key: 'kokuho_count', 
            regexes: [
                /国保[^\d]*(\d+)[件人数]/i,
                /国民[^\d]*(\d+)[件人数]/i,
                /国家[^\d]*(\d+)[件人数]/i
            ]
        },
        { 
            key: 'kokuho_amount', 
            regexes: [
                /国保[^\d]*\d+[件人数][^\d]*(\d+(?:,\d{3})*)/i,
                /国民[^\d]*\d+[件人数][^\d]*(\d+(?:,\d{3})*)/i,
                /国家[^\d]*\d+[件人数][^\d]*(\d+(?:,\d{3})*)/i
            ]
        },
        
        // 後期
        { 
            key: 'kouki_count', 
            regexes: [
                /後期[^\d]*(\d+)[件人数]/i,
                /高齢[^\d]*(\d+)[件人数]/i
            ]
        },
        { 
            key: 'kouki_amount', 
            regexes: [
                /後期[^\d]*\d+[件人数][^\d]*(\d+(?:,\d{3})*)/i,
                /高齢[^\d]*\d+[件人数][^\d]*(\d+(?:,\d{3})*)/i
            ]
        },
        
        // 自費
        { 
            key: 'jihi_count', 
            regexes: [
                /自費[^\d]*(\d+)[件人数]/i
            ]
        },
        { 
            key: 'jihi_amount', 
            regexes: [
                /自費[^\d]*\d+[件人数][^\d]*(\d+(?:,\d{3})*)/i
            ]
        },
        
        // 保険なし
        { 
            key: 'hoken_nashi_count', 
            regexes: [
                /保険なし[^\d]*(\d+)[件人数]/i,
                /保険無[^\d]*(\d+)[件人数]/i
            ]
        },
        { 
            key: 'hoken_nashi_amount', 
            regexes: [
                /保険なし[^\d]*\d+[件人数][^\d]*(\d+(?:,\d{3})*)/i,
                /保険無[^\d]*\d+[件人数][^\d]*(\d+(?:,\d{3})*)/i
            ]
        },
        
        // その他
        { 
            key: 'previous_difference', 
            regexes: [
                /前回差額[^\d\-]*(-?\d+(?:,\d{3})*)/i,
                /差額[^\d\-]*(-?\d+(?:,\d{3})*)/i
            ]
        },
        { 
            key: 'bushan_amount', 
            regexes: [
                /物販[合計]*[^\d]*(\d+(?:,\d{3})*)/i,
                /販売[合計]*[^\d]*(\d+(?:,\d{3})*)/i
            ]
        }
    ];
    
    for (const pattern of patterns) {
        let found = false;
        for (const regex of pattern.regexes) {
            const match = text.match(regex);
            if (match) {
                result[pattern.key] = match[1].replace(/,/g, '');
                console.log(`Found ${pattern.key}: ${result[pattern.key]}`);
                found = true;
                break;
            }
        }
        if (!found) {
            result[pattern.key] = "0";
        }
    }
    
    return result;
}
