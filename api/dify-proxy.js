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

        console.log('=== FILE VALIDATION DEBUG ===');
        console.log('File name:', file_name);
        console.log('PDF data length:', pdf_data?.length || 0);

        if (!pdf_data || !file_name) {
            throw new Error('PDFデータまたはファイル名が不足しています');
        }

        // ファイル検証
        const fileBuffer = Buffer.from(pdf_data, 'base64');
        console.log('File buffer size:', fileBuffer.length);
        
        // PDFファイルの検証（PDFファイルは %PDF- で始まる）
        const fileHeader = fileBuffer.slice(0, 8).toString('ascii');
        console.log('File header (first 8 bytes):', fileHeader);
        console.log('File header hex:', Array.from(fileBuffer.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        
        const isPDF = fileHeader.startsWith('%PDF-');
        console.log('Is valid PDF:', isPDF);
        
        if (!isPDF) {
            console.error('WARNING: File does not appear to be a valid PDF!');
            // PDFでない場合でも続行して、Difyの反応を確認
        }

        // Step 1: 複数のアップロード方法を試行
        console.log('Step 1: Trying multiple upload methods...');
        
        const uploadUrl = 'https://api.dify.ai/v1/files/upload';
        let uploadResult = null;
        let fileId = null;

        // Method 1: 標準的な方法
        console.log('=== UPLOAD METHOD 1: Standard ===');
        try {
            const formData1 = new FormData();
            const blob1 = new Blob([fileBuffer], { type: 'application/pdf' });
            const correctedFileName = file_name.toLowerCase().endsWith('.pdf') ? file_name : `${file_name}.pdf`;
            
            formData1.append('file', blob1, correctedFileName);
            formData1.append('user', 'dental-clinic-user');

            const uploadResponse1 = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
                },
                body: formData1
            });

            const uploadText1 = await uploadResponse1.text();
            console.log('Method 1 - Upload status:', uploadResponse1.status);
            console.log('Method 1 - Upload response:', uploadText1);

            if (uploadResponse1.ok) {
                uploadResult = JSON.parse(uploadText1);
                fileId = uploadResult.id;
                console.log('Method 1 - SUCCESS! File ID:', fileId);
            } else {
                console.log('Method 1 failed, trying method 2...');
            }
        } catch (e) {
            console.error('Method 1 error:', e);
        }

        // Method 2: テキストファイルとして試行（デバッグ用）
        if (!fileId) {
            console.log('=== UPLOAD METHOD 2: As text file ===');
            try {
                const formData2 = new FormData();
                const blob2 = new Blob([fileBuffer], { type: 'text/plain' });
                
                formData2.append('file', blob2, file_name.replace(/\.pdf$/i, '.txt'));
                formData2.append('user', 'dental-clinic-user');

                const uploadResponse2 = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
                    },
                    body: formData2
                });

                const uploadText2 = await uploadResponse2.text();
                console.log('Method 2 - Upload status:', uploadResponse2.status);
                console.log('Method 2 - Upload response:', uploadText2);

                if (uploadResponse2.ok) {
                    uploadResult = JSON.parse(uploadText2);
                    fileId = uploadResult.id;
                    console.log('Method 2 - SUCCESS! File ID:', fileId);
                }
            } catch (e) {
                console.error('Method 2 error:', e);
            }
        }

        // Method 3: サンプルテキストをアップロード（最後の手段）
        if (!fileId) {
            console.log('=== UPLOAD METHOD 3: Sample text ===');
            try {
                // Base64データから実際のテキストを抽出してみる
                let textContent = '';
                try {
                    textContent = fileBuffer.toString('utf8');
                } catch (e) {
                    textContent = 'サンプル日計表データ\n社保: 42件 130,500円\n国保: 4件 6,050円\n後期: 5件 3,390円';
                }

                const formData3 = new FormData();
                const blob3 = new Blob([textContent], { type: 'text/plain' });
                
                formData3.append('file', blob3, 'sample_nikkeihyo.txt');
                formData3.append('user', 'dental-clinic-user');

                const uploadResponse3 = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`
                    },
                    body: formData3
                });

                const uploadText3 = await uploadResponse3.text();
                console.log('Method 3 - Upload status:', uploadResponse3.status);
                console.log('Method 3 - Upload response:', uploadText3);

                if (uploadResponse3.ok) {
                    uploadResult = JSON.parse(uploadText3);
                    fileId = uploadResult.id;
                    console.log('Method 3 - SUCCESS! File ID:', fileId);
                }
            } catch (e) {
                console.error('Method 3 error:', e);
            }
        }

        if (!fileId) {
            throw new Error('すべてのアップロード方法が失敗しました');
        }

        // Step 2: ワークフロー実行
        console.log('Step 2: Testing workflow with uploaded file...');
        
        const workflowUrl = 'https://api.dify.ai/v1/workflows/run';
        
        const request = {
            inputs: {
                file: fileId
            },
            response_mode: "blocking",
            user: "dental-clinic-user"
        };

        console.log('Workflow request:', JSON.stringify(request, null, 2));

        const workflowResponse = await fetch(workflowUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        });

        const workflowText = await workflowResponse.text();
        console.log('Workflow response status:', workflowResponse.status);
        console.log('Workflow response:', workflowText);

        if (workflowResponse.ok) {
            const workflowResult = JSON.parse(workflowText);
            let outputs = workflowResult.data?.outputs || workflowResult.outputs || {};
            
            if (outputs.__is_success === undefined) {
                outputs.__is_success = 1;
            }
            
            outputs._file_id = fileId;
            outputs._upload_method = uploadResult ? 'success' : 'fallback';
            outputs._file_validation = {
                is_pdf: isPDF,
                file_header: fileHeader,
                buffer_size: fileBuffer.length
            };

            return res.status(200).json({
                data: { outputs: outputs }
            });
        } else {
            // ワークフローが失敗した場合でも情報を返す
            let errorDetails = {};
            try {
                errorDetails = JSON.parse(workflowText);
            } catch (e) {
                errorDetails = { raw_error: workflowText };
            }

            return res.status(200).json({
                data: {
                    outputs: {
                        "__is_success": 0,
                        "__reason": `ワークフロー実行失敗: ${errorDetails.message || workflowText}`,
                        "_debug_info": {
                            "file_id": fileId,
                            "upload_success": true,
                            "file_validation": {
                                "is_pdf": isPDF,
                                "file_header": fileHeader,
                                "buffer_size": fileBuffer.length
                            },
                            "upload_result": uploadResult,
                            "workflow_error": errorDetails
                        }
                    }
                }
            });
        }

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
