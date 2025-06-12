// Vercel API Route for Dify Proxy - エラーハンドリング強化版
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
    console.log('- DIFY_WORKFLOW_ID exists:', !!process.env.DIFY_WORKFLOW_ID);
    
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

    // 2. ワークフロー実行（複数の入力パターンを試行）
    console.log('=== STEP 2: RUN WORKFLOW WITH MULTIPLE PATTERNS ===');
    const workflowResult = await runDifyWorkflowWithFallback(uploadResult.fileId);
    
    if (!workflowResult.success) {
      console.error('All workflow patterns failed:', workflowResult);
      return res.status(500).json({
        error: 'All workflow execution patterns failed',
        debug: workflowResult.debug,
        difyError: workflowResult.error,
        allAttempts: workflowResult.allAttempts // 全ての試行結果
      });
    }

    console.log('Workflow completed successfully with pattern:', workflowResult.successPattern);
    console.log('Extracted data:', workflowResult.data);

    // 3. 結果を返す
    res.status(200).json({
      success: true,
      data: workflowResult.data,
      debug: {
        fileId: uploadResult.fileId,
        workflowExecuted: true,
        successPattern: workflowResult.successPattern,
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

// 複数のワークフロー入力パターンでフォールバック実行
async function runDifyWorkflowWithFallback(fileId) {
  const patterns = [
    {
      name: 'PDF Document Object (基本)',
      inputs: {
        "orig_mail": {
          "type": "document",
          "transfer_method": "local_file",
          "upload_file_id": fileId
        }
      }
    },
    {
      name: 'Document with file metadata',
      inputs: {
        "orig_mail": {
          "type": "document",
          "transfer_method": "local_file",
          "upload_file_id": fileId,
          "mime_type": "application/pdf"
        }
      }
    },
    {
      name: 'File parameter alternative',
      inputs: {
        "file": {
          "type": "document",
          "transfer_method": "local_file", 
          "upload_file_id": fileId
        }
      }
    },
    {
      name: 'Simple file ID only',
      inputs: {
        "orig_mail": fileId
      }
    },
    {
      name: 'Document parameter alternative',
      inputs: {
        "document": {
          "type": "document",
          "transfer_method": "local_file",
          "upload_file_id": fileId
        }
      }
    },
    {
      name: 'PDF file parameter',
      inputs: {
        "pdf_file": {
          "type": "document", 
          "transfer_method": "local_file",
          "upload_file_id": fileId
        }
      }
    }
  ];

  const allAttempts = [];
  
  for (const pattern of patterns) {
    console.log(`Trying workflow pattern: ${pattern.name}`);
    
    const result = await runSingleDifyWorkflow(fileId, pattern);
    allAttempts.push({
      pattern: pattern.name,
      success: result.success,
      error: result.error,
      debug: result.debug
    });
    
    if (result.success) {
      console.log(`✅ Success with pattern: ${pattern.name}`);
      return {
        success: true,
        data: result.data,
        successPattern: pattern.name,
        rawResponse: result.rawResponse,
        allAttempts: allAttempts
      };
    } else {
      console.log(`❌ Failed with pattern: ${pattern.name} - ${result.error}`);
    }
  }
  
  // 全てのパターンが失敗した場合
  return {
    success: false,
    error: 'All workflow patterns failed',
    debug: 'Tried multiple input patterns but none succeeded',
    allAttempts: allAttempts
  };
}

// 単一のワークフローパターンを実行
async function runSingleDifyWorkflow(fileId, pattern) {
  try {
    const requestBody = {
      inputs: pattern.inputs,
      response_mode: "blocking",
      user: "dental-app-user"
    };

    console.log('Workflow URL:', `${process.env.DIFY_BASE_URL}/workflows/run`);
    console.log('Sending workflow request with pattern:', pattern.name);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${process.env.DIFY_BASE_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log(`Response status for ${pattern.name}:`, response.status);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        debug: `Workflow failed with status ${response.status}. Response: ${responseText.substring(0, 500)}...`
      };
    }

    // JSON解析
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid JSON response',
        debug: `JSON parse failed: ${parseError.message}`
      };
    }
    
    // ワークフローの状態を確認
    if (result.data && result.data.status === 'failed') {
      return {
        success: false,
        error: result.data.error || 'Workflow execution failed',
        debug: `Workflow failed: ${result.data.error}. Elapsed time: ${result.data.elapsed_time}s`
      };
    }
    
    // データ抽出を試行
    const extractedData = extractDataFromResponse(result);
    
    // 最低限のデータが抽出できたかチェック
    const hasValidData = Object.values(extractedData).some(value => value && value !== '');
    
    if (!hasValidData) {
      return {
        success: false,
        error: 'No valid data extracted',
        debug: 'Workflow completed but no extractable data found in outputs'
      };
    }

    return {
      success: true,
      data: extractedData,
      debug: `Workflow completed successfully. Extracted ${Object.keys(extractedData).length} parameters.`,
      rawResponse: result
    };

  } catch (error) {
    console.error(`Workflow error for pattern ${pattern.name}:`, error);
    return {
      success: false,
      error: error.message,
      debug: `Workflow exception: ${error.message}`
    };
  }
}

// レスポンスからデータを抽出する関数（複数の場所を探索）
function extractDataFromResponse(result) {
  console.log('=== DATA EXTRACTION ===');
  console.log('Full result structure:', Object.keys(result));
  
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
  
  // 抽出パターン1: result.data.outputs
  if (result.data && result.data.outputs && typeof result.data.outputs === 'object') {
    console.log('Pattern 1: Checking result.data.outputs');
    const outputs = result.data.outputs;
    
    Object.keys(extractedData).forEach(key => {
      if (outputs[key] !== undefined && outputs[key] !== null) {
        extractedData[key] = String(outputs[key]);
        console.log(`Found ${key}: ${outputs[key]}`);
      }
    });
  }
  
  // 抽出パターン2: result.outputs
  if (result.outputs && typeof result.outputs === 'object') {
    console.log('Pattern 2: Checking result.outputs');
    const outputs = result.outputs;
    
    Object.keys(extractedData).forEach(key => {
      if (outputs[key] !== undefined && outputs[key] !== null && !extractedData[key]) {
        extractedData[key] = String(outputs[key]);
        console.log(`Found ${key}: ${outputs[key]}`);
      }
    });
  }
  
  // 抽出パターン3: result直下
  console.log('Pattern 3: Checking result directly');
  Object.keys(extractedData).forEach(key => {
    if (result[key] !== undefined && result[key] !== null && !extractedData[key]) {
      extractedData[key] = String(result[key]);
      console.log(`Found ${key}: ${result[key]}`);
    }
  });
  
  // 抽出パターン4: result.data直下
  if (result.data && typeof result.data === 'object') {
    console.log('Pattern 4: Checking result.data directly');
    Object.keys(extractedData).forEach(key => {
      if (result.data[key] !== undefined && result.data[key] !== null && !extractedData[key]) {
        extractedData[key] = String(result.data[key]);
        console.log(`Found ${key}: ${result.data[key]}`);
      }
    });
  }
  
  console.log('Final extracted data:', extractedData);
  return extractedData;
}
