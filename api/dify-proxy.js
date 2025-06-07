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
        let rawPdfText = '';
        try {
            // Base64からテキスト抽出を試行
            rawPdfText = fileBuffer.toString('utf8');
            console.log('Raw PDF text length:', rawPdfText.length);
            console.log('Raw PDF text first 500 chars:', rawPdfText.substring(0, 500));
            console.log('Raw PDF text last 500 chars:', rawPdfText.substring(Math.max(0, rawPdfText.length - 500)));
            
            // 意味のある行を抽出
            const lines = rawPdfText.split(/[\r\n]+/);
            console.log('Total lines in PDF:', lines.length);
            
            // 各行をログ出力（最初の50行）
            console.log('=== PDF LINES ANALYSIS ===');
            lines.slice(0, 50).forEach((line, index) => {
                if (line.trim().length > 0) {
                    console.log(`Line ${index}: "${line.trim()}"`);
                }
            });
            
            const meaningfulLines = lines.filter(line => {
                const cleanLine = line.trim();
                return cleanLine.length > 1 && (
                    cleanLine.includes('社') || cleanLine.includes('国') || 
                    cleanLine.includes('後期') || cleanLine.includes('自費') ||
                    cleanLine.includes('保険') || cleanLine.includes('円') ||
                    cleanLine.includes('件') || cleanLine.includes('計') ||
                    cleanLine.includes('合計') || cleanLine.includes('差額') ||
                    cleanLine.includes('物販') || 
                    /\d{2,}/.test(cleanLine) // 2桁以上の数字を含む行
                );
            });
            
            extractedText = meaningfulLines.join('\n');
            console.log('Meaningful lines count:', meaningfulLines.length);
            console.log('Meaningful lines:', meaningfulLines.slice(0, 20));
            console.log('Extracted text preview:', extractedText.substring(0, 500));
            
            // 数字パターンの検索
            const numberMatches = rawPdfText.match(/\d{1,3}(?:,\d{3})*|\d+/g) || [];
            console.log('All numbers found:', numberMatches.slice(0, 30));
            
            // 特定のキーワード周辺のテキスト抽出
            const keywords = ['社保', '国保', '後期', '自費', '保険なし', '合計', '差額', '物販'];
            keywords.forEach(keyword => {
                const index = rawPdfText.indexOf(keyword);
                if (index !== -1) {
                    const context = rawPdfText.substring(Math.max(0, index - 50), index + 100);
                    console.log(`Context around "${keyword}": "${context}"`);
                }
            });
            
        } catch (e) {
            console.error('Text extraction failed:', e);
            extractedText = '';
        }

        // Step 3: 複数のテキストソースでパターンマッチング
        console.log('Step 3: Enhanced pattern matching extraction...');
        
        const extractedData1 = performPatternMatching(rawPdfText, 'raw');
        const extractedData2 = performPatternMatching(extractedText, 'filtered');
        const extractedData3 = performAdvancedPatternMatching(rawPdfText);
        
        console.log('Raw text pattern matching result:', extractedData1);
        console.log('Filtered text pattern matching result:', extractedData2);
        console.log('Advanced pattern matching result:', extractedData3);

        // 最良の結果を選択
        const extractedData = mergeExtractionResults([extractedData1, extractedData2, extractedData3]);

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
            _raw_text_length: rawPdfText.length,
            _pattern_matching_data: extractedData,
            _workflow_data: workflowData,
            _raw_text_sample: rawPdfText.substring(0, 1000),
            _filtered_text_sample: extractedText.substring(0, 500)
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
function performPatternMatching(text, source = 'unknown') {
    console.log(`Performing pattern matching on ${source} text...`);
    
    const result = {};
    
    // より具体的な数値抽出のパターン
    const patterns = [
        // 社保 - より柔軟なパターン
        { 
            key: 'shaho_count', 
            regexes: [
                /社保.*?(\d+).*?件/i,
                /社会保険.*?(\d+).*?件/i,
                /社本.*?(\d+).*?件/i,
                /社.*?(\d+).*?件/i
            ]
        },
        { 
            key: 'shaho_amount', 
            regexes: [
                /社保.*?(\d{1,3}(?:,\d{3})+)/i,
                /社会保険.*?(\d{1,3}(?:,\d{3})+)/i,
                /社本.*?(\d{1,3}(?:,\d{3})+)/i,
                /社.*?(\d{1,3}(?:,\d{3})+)/i
            ]
        },
        
        // 国保
        { 
            key: 'kokuho_count', 
            regexes: [
                /国保.*?(\d+).*?件/i,
                /国民.*?(\d+).*?件/i,
                /国家.*?(\d+).*?件/i,
                /国.*?(\d+).*?件/i
            ]
        },
        { 
            key: 'kokuho_amount', 
            regexes: [
                /国保.*?(\d{1,3}(?:,\d{3})+)/i,
                /国民.*?(\d{1,3}(?:,\d{3})+)/i,
                /国家.*?(\d{1,3}(?:,\d{3})+)/i,
                /国.*?(\d{1,3}(?:,\d{3})+)/i
            ]
        },
        
        // 後期
        { 
            key: 'kouki_count', 
            regexes: [
                /後期.*?(\d+).*?件/i,
                /高齢.*?(\d+).*?件/i
            ]
        },
        { 
            key: 'kouki_amount', 
            regexes: [
                /後期.*?(\d{1,3}(?:,\d{3})+)/i,
                /高齢.*?(\d{1,3}(?:,\d{3})+)/i
            ]
        },
        
        // 自費
        { 
            key: 'jihi_count', 
            regexes: [
                /自費.*?(\d+).*?件/i
            ]
        },
        { 
            key: 'jihi_amount', 
            regexes: [
                /自費.*?(\d{1,3}(?:,\d{3})+)/i
            ]
        },
        
        // 保険なし
        { 
            key: 'hoken_nashi_count', 
            regexes: [
                /保険なし.*?(\d+).*?件/i,
                /保険無.*?(\d+).*?件/i
            ]
        },
        { 
            key: 'hoken_nashi_amount', 
            regexes: [
                /保険なし.*?(\d{1,3}(?:,\d{3})+)/i,
                /保険無.*?(\d{1,3}(?:,\d{3})+)/i
            ]
        },
        
        // その他
        { 
            key: 'previous_difference', 
            regexes: [
                /前回差額.*?(-?\d{1,3}(?:,\d{3})*)/i,
                /差額.*?(-?\d{1,3}(?:,\d{3})*)/i
            ]
        },
        { 
            key: 'bushan_amount', 
            regexes: [
                /物販.*?(\d{1,3}(?:,\d{3})*)/i,
                /販売.*?(\d{1,3}(?:,\d{3})*)/i
            ]
        }
    ];
    
    for (const pattern of patterns) {
        let found = false;
        for (const regex of pattern.regexes) {
            const match = text.match(regex);
            if (match) {
                result[pattern.key] = match[1].replace(/,/g, '');
                console.log(`${source} - Found ${pattern.key}: ${result[pattern.key]}`);
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

// 高度なパターンマッチング
function performAdvancedPatternMatching(text) {
    console.log('Performing advanced pattern matching...');
    
    const result = {};
    
    // 数値テーブルの解析を試行
    const lines = text.split(/[\r\n]+/);
    const numbers = [];
    
    // 各行から数値を抽出
    lines.forEach((line, index) => {
        const nums = line.match(/\d{1,3}(?:,\d{3})+|\d{3,}/g);
        if (nums) {
            nums.forEach(num => {
                numbers.push({
                    line: index,
                    value: num,
                    context: line.trim()
                });
            });
        }
    });
    
    console.log('Found numbers with context:', numbers.slice(0, 20));
    
    // 簡単なルールベース抽出
    // 通常、日計表では大きな金額（10万円以上）が社保に対応することが多い
    const largeAmounts = numbers.filter(n => parseInt(n.value.replace(/,/g, '')) > 50000);
    const mediumAmounts = numbers.filter(n => {
        const val = parseInt(n.value.replace(/,/g, ''));
        return val > 1000 && val <= 50000;
    });
    const smallAmounts = numbers.filter(n => {
        const val = parseInt(n.value.replace(/,/g, ''));
        return val > 0 && val <= 1000;
    });
    
    console.log('Large amounts:', largeAmounts);
    console.log('Medium amounts:', mediumAmounts);
    console.log('Small amounts:', smallAmounts);
    
    // 推定値を設定（実際のデータパターンに基づく）
    if (largeAmounts.length > 0) {
        result.shaho_amount = largeAmounts[0].value.replace(/,/g, '');
        result.shaho_count = "1"; // 推定
    }
    
    if (mediumAmounts.length > 0) {
        result.kokuho_amount = mediumAmounts[0].value.replace(/,/g, '');
        result.kokuho_count = "1"; // 推定
    }
    
    // デフォルト値
    Object.keys({
        shaho_count: "0", shaho_amount: "0",
        kokuho_count: "0", kokuho_amount: "0", 
        kouki_count: "0", kouki_amount: "0",
        jihi_count: "0", jihi_amount: "0",
        hoken_nashi_count: "0", hoken_nashi_amount: "0",
        previous_difference: "0", bushan_amount: "0"
    }).forEach(key => {
        if (!result[key]) {
            result[key] = "0";
        }
    });
    
    return result;
}

// 抽出結果をマージ
function mergeExtractionResults(results) {
    const merged = {};
    
    const keys = [
        'shaho_count', 'shaho_amount', 'kokuho_count', 'kokuho_amount',
        'kouki_count', 'kouki_amount', 'jihi_count', 'jihi_amount',
        'hoken_nashi_count', 'hoken_nashi_amount', 'previous_difference', 'bushan_amount'
    ];
    
    keys.forEach(key => {
        // 0以外の値を優先的に選択
        for (const result of results) {
            if (result[key] && result[key] !== "0") {
                merged[key] = result[key];
                break;
            }
        }
        if (!merged[key]) {
            merged[key] = "0";
        }
    });
    
    console.log('Merged extraction result:', merged);
    return merged;
}
