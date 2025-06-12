// Vercel API Route for Dify Proxy - DSL対応版
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      debug: `Received method: ${req.method}, expected: POST`
    });
  }

  try {
    console.log('=== HANDLER START ===');
    console.log('Starting file upload process...');
    console.log('Environment check:');
    console.log('- DIFY_API_KEY exists:', !!process.env.DIFY_API_KEY);
    console.log('- DIFY_BASE_URL:', process.env.DIFY_BASE_URL);
    
    // ファイルパース
    const form = formidable({
      maxFileSize: 15 * 1024 * 1024, // 15MB制限
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    console.log('Files parsed:', Object.keys(files));
    console.log('Fields parsed:', Object.keys(fields));

    const uploadedFile = files.file?.[0];
    if (!uploadedFile) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        debug: 'files object does not contain a file property'
      });
    }

    console.log('File details:', {
      originalFilename: uploadedFile.originalFilename,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype
    });

    // 1. Difyにファイルアップロード
    console.log('=== STEP 1: UPLOAD TO DIFY ===');
    const uploadResult = await uploadFileToDify(uploadedFile);
    
    if (!uploadResult.success) {
      console.error('Upload failed:', uploadResult);
      return res.status(400).json({
        error: 'File upload to Dify failed',
        debug: uploadResult.debug,
        difyError: uploadResult.error
      });
    }

    console.log('File uploaded successfully, ID:', uploadResult.fileId);

    // 2. ワークフロー実行（DSL対応の改良版）
    console.log('=== STEP 2: RUN WORKFLOW (DSL COMPATIBLE) ===');
    const workflowResult = await runDifyWorkflowDSL(uploadResult.fileId);
    
    if (!workflowResult.success) {
      console.error('Workflow failed:', workflowResult);
      return res.status(500).json({
        error: 'Workflow execution failed',
        debug: workflowResult.debug,
        difyError: workflowResult.error,
        rawResponse: workflowResult.rawResponse
      });
    }

    console.log('Workflow completed successfully');
    console.log('Extracted data:', workflowResult.data);

    // 3. 結果を返す
    res.status(200).json({
      success: true,
      data: workflowResult.data,
      debug: {
        fileId: uploadResult.fileId,
        workflowExecuted: true,
        extractedParams: workflowResult.data,
        rawWorkflowResponse: workflowResult.rawResponse
      }
    });

  } catch (error) {
    console.error('Handler error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      debug: error.message,
      errorType: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Difyにファイルをアップロード
async function uploadFileToDify(file) {
  try {
    console.log('Creating FormData for upload...');
    const formData = new FormData();
    const fileStream = fs.createReadStream(file.filepath);
    
    formData.append('file', fileStream, {
      filename: file.originalFilename,
      contentType: file.mimetype
    });
    formData.append('user', 'dental-app-user');

    console.log('Sending file to Dify upload endpoint...');
    console.log('Upload URL:', `${process.env.DIFY_BASE_URL}/files/upload`);
    
    const response = await fetch(`${process.env.DIFY_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData,
    });

    const responseText = await response.text();
    console.log('Dify upload response status:', response.status);
    console.log('Dify upload response body:', responseText);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        debug: `Upload failed with status ${response.status}. Response: ${responseText}`
      };
    }

    const result = JSON.parse(responseText);
    
    if (!result.id) {
      return {
        success: false,
        error: 'No file ID returned',
        debug: `Response missing ID field. Full response: ${responseText}`
      };
    }

    return {
      success: true,
      fileId: result.id,
      debug: `File uploaded successfully with ID: ${result.id}`
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message,
      debug: `Upload exception: ${error.message}`,
      stack: error.stack
    };
  }
}

// DSL対応のワークフロー実行
async function runDifyWorkflowDSL(fileId) {
  try {
    console.log('Preparing DSL-compatible workflow request...');
    
    // DSLワークフローに対応した入力形式（ファイルオブジェクトとして渡す）
    const requestBody = {
      inputs: {
        "orig_mail": {
          "type": "file",
          "transfer_method": "local_file", 
          "upload_file_id": fileId
        }
      },
      response_mode: "blocking",
      user: "dental-app-user"
    };

    console.log('Workflow URL:', `${process.env.DIFY_BASE_URL}/workflows/run`);
    console.log('Sending DSL workflow request with body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${process.env.DIFY_BASE_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Dify workflow response status:', response.status);
    console.log('Dify workflow response body (first 1000 chars):', responseText.substring(0, 1000));

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        debug: `Workflow failed with status ${response.status}. Response: ${responseText}`,
        rawResponse: responseText
      };
    }

    // JSON解析
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        success: false,
        error: 'Invalid JSON response from Dify',
        debug: `JSON parse failed: ${parseError.message}. Raw response: ${responseText.substring(0, 200)}...`,
        rawResponse: responseText
      };
    }
    
    console.log('=== WORKFLOW RESPONSE ANALYSIS (DSL) ===');
    console.log('Full result keys:', Object.keys(result));
    
    // ワークフローの状態確認
    if (result.data && result.data.status === 'failed') {
      return {
        success: false,
        error: result.data.error || 'Workflow execution failed',
        debug: `Workflow failed: ${result.data.error}. Elapsed time: ${result.data.elapsed_time}s`,
        rawResponse: result
      };
    }
    
    // DSLワークフローからのデータ抽出
    const extractedData = extractDataFromDSLResponse(result);
    
    return {
      success: true,
      data: extractedData,
      debug: `DSL Workflow completed successfully. Extracted ${Object.keys(extractedData).length} parameters.`,
      rawResponse: result
    };

  } catch (error) {
    console.error('DSL Workflow error:', error);
    return {
      success: false,
      error: error.message,
      debug: `DSL Workflow exception: ${error.message}`,
      stack: error.stack
    };
  }
}

// DSLワークフローレスポンスからデータを抽出
function extractDataFromDSLResponse(result) {
  console.log('=== DSL DATA EXTRACTION ===');
  
  let extractedData = {
    shaho_count: '',
    shaho_amount: '',
    kokuho_count: '',
    kokuho_amount: '',
    kouki_count: '',
    kouki_amount: '',
    jihi_count: '',
    jihi_amount: '',
    bushan_note: '',
    bushan_amount: '',
    previous_difference: '',
    hoken_nashi_count: '',
    hoken_nashi_amount: ''
  };
  
  // パターン1: result.data.outputs (標準的なワークフロー出力)
  if (result.data && result.data.outputs) {
    console.log('Pattern 1: Checking result.data.outputs');
    const outputs = result.data.outputs;
    console.log('Available outputs:', Object.keys(outputs));
    
    // LLMからのJSON解析を試行
    if (outputs.extraction_result || outputs.llm || outputs.text) {
      const llmOutput = outputs.extraction_result || outputs.llm || outputs.text;
      console.log('LLM output found:', typeof llmOutput, llmOutput?.substring?.(0, 200));
      
      // JSONレスポンスを解析
      if (typeof llmOutput === 'string') {
        try {
          const parsed = JSON.parse(llmOutput);
          if (typeof parsed === 'object') {
            Object.keys(extractedData).forEach(key => {
              if (parsed[key] !== undefined) {
                extractedData[key] = String(parsed[key] || '');
                console.log(`Extracted from JSON: ${key} = ${parsed[key]}`);
              }
            });
          }
        } catch (e) {
          console.log('LLM output is not JSON, treating as text');
        }
      }
    }
    
    // 直接的な出力値の確認
    Object.keys(extractedData).forEach(key => {
      if (outputs[key] !== undefined && !extractedData[key]) {
        extractedData[key] = String(outputs[key] || '');
        console.log(`Extracted directly: ${key} = ${outputs[key]}`);
      }
    });
  }
  
  // パターン2: ネストした出力構造の確認
  if (result.data && result.data.outputs && result.data.outputs.result) {
    console.log('Pattern 2: Checking nested result structure');
    const nestedResult = result.data.outputs.result;
    
    if (typeof nestedResult === 'object') {
      Object.keys(extractedData).forEach(key => {
        if (nestedResult[key] !== undefined && !extractedData[key]) {
          extractedData[key] = String(nestedResult[key] || '');
          console.log(`Extracted from nested: ${key} = ${nestedResult[key]}`);
        }
      });
    }
  }
  
  console.log('Final extracted data:', extractedData);
  return extractedData;
}
