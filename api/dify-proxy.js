// Vercel API Route for Dify Proxy - 完全デバッグ版
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

    // 2. ワークフロー実行
    console.log('=== STEP 2: RUN WORKFLOW ===');
    const workflowResult = await runDifyWorkflow(uploadResult.fileId);
    
    if (!workflowResult.success) {
      console.error('Workflow failed:', workflowResult);
      return res.status(500).json({
        error: 'Workflow execution failed',
        debug: workflowResult.debug,
        difyError: workflowResult.error,
        fullError: workflowResult // より詳細なエラー情報
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
        rawWorkflowResponse: workflowResult.rawResponse // デバッグ用
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

// Difyワークフローを実行 - エラーハンドリング強化版
async function runDifyWorkflow(fileId) {
  try {
    console.log('Preparing workflow request...');
    const requestBody = {
      inputs: {
        "orig_mail": {
          "type": "document",
          "transfer_method": "local_file",
          "upload_file_id": fileId
        }
      },
      response_mode: "blocking",
      user: "dental-app-user"
    };

    console.log('Workflow URL:', `${process.env.DIFY_BASE_URL}/workflows/run`);
    console.log('Sending workflow request with body:', JSON.stringify(requestBody, null, 2));

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
    console.log('Dify workflow response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Dify workflow response body (first 1000 chars):', responseText.substring(0, 1000));

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        debug: `Workflow failed with status ${response.status}. Response: ${responseText}`,
        fullResponse: responseText
      };
    }

    // JSON解析を安全に実行
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw response that failed to parse:', responseText);
      return {
        success: false,
        error: 'Invalid JSON response from Dify',
        debug: `JSON parse failed: ${parseError.message}. Raw response: ${responseText.substring(0, 200)}...`,
        fullResponse: responseText
      };
    }
    
    // 🔍 詳細デバッグ: レスポンス構造を分析
    console.log('=== WORKFLOW RESPONSE ANALYSIS ===');
    console.log('Full result keys:', Object.keys(result));
    console.log('result.data exists:', !!result.data);
    
    if (result.data) {
      console.log('result.data keys:', Object.keys(result.data));
      console.log('result.data.outputs exists:', !!result.data.outputs);
      
      if (result.data.outputs) {
        console.log('result.data.outputs keys:', Object.keys(result.data.outputs));
        console.log('result.data.outputs content:', JSON.stringify(result.data.outputs, null, 2));
      }
    }
    
    // ワークフロー結果からパラメータを抽出（複数のパターンを試行）
    let extractedData = {};
    
    // パターン1: result.data.outputs から抽出（現在の方法）
    if (result.data && result.data.outputs) {
      console.log('Pattern 1: Using result.data.outputs');
      const outputs = result.data.outputs;
      extractedData = {
        shaho_count: outputs.shaho_count || '',
        shaho_amount: outputs.shaho_amount || '',
        kokuho_count: outputs.kokuho_count || '',
        kokuho_amount: outputs.kokuho_amount || '',
        kouki_count: outputs.kouki_count || '',
        kouki_amount: outputs.kouki_amount || '',
        jihi_count: outputs.jihi_count || '',
        jihi_amount: outputs.jihi_amount || '',
        bushan_note: outputs.bushan_note || '',
        bushan_amount: outputs.bushan_amount || '',
        previous_difference: outputs.previous_difference || '',
        hoken_nashi_count: outputs.hoken_nashi_count || '',
        hoken_nashi_amount: outputs.hoken_nashi_amount || ''
      };
    }
    
    // パターン2: result から直接抽出
    if (Object.keys(extractedData).every(key => !extractedData[key]) && result.shaho_count) {
      console.log('Pattern 2: Using result directly');
      extractedData = {
        shaho_count: result.shaho_count || '',
        shaho_amount: result.shaho_amount || '',
        kokuho_count: result.kokuho_count || '',
        kokuho_amount: result.kokuho_amount || '',
        kouki_count: result.kouki_count || '',
        kouki_amount: result.kouki_amount || '',
        jihi_count: result.jihi_count || '',
        jihi_amount: result.jihi_amount || '',
        bushan_note: result.bushan_note || '',
        bushan_amount: result.bushan_amount || '',
        previous_difference: result.previous_difference || '',
        hoken_nashi_count: result.hoken_nashi_count || '',
        hoken_nashi_amount: result.hoken_nashi_amount || ''
      };
    }
    
    // パターン3: result.data から直接抽出
    if (Object.keys(extractedData).every(key => !extractedData[key]) && result.data && result.data.shaho_count) {
      console.log('Pattern 3: Using result.data directly');
      extractedData = {
        shaho_count: result.data.shaho_count || '',
        shaho_amount: result.data.shaho_amount || '',
        kokuho_count: result.data.kokuho_count || '',
        kokuho_amount: result.data.kokuho_amount || '',
        kouki_count: result.data.kouki_count || '',
        kouki_amount: result.data.kouki_amount || '',
        jihi_count: result.data.jihi_count || '',
        jihi_amount: result.data.jihi_amount || '',
        bushan_note: result.data.bushan_note || '',
        bushan_amount: result.data.bushan_amount || '',
        previous_difference: result.data.previous_difference || '',
        hoken_nashi_count: result.data.hoken_nashi_count || '',
        hoken_nashi_amount: result.data.hoken_nashi_amount || ''
      };
    }

    console.log('Final extracted data:', JSON.stringify(extractedData, null, 2));

    return {
      success: true,
      data: extractedData,
      debug: `Workflow completed. Status: ${result.data?.status}. Extracted ${Object.keys(extractedData).length} parameters.`,
      rawResponse: result // デバッグ用に生レスポンスも含める
    };

  } catch (error) {
    console.error('Workflow error:', error);
    console.error('Workflow error stack:', error.stack);
    return {
      success: false,
      error: error.message,
      debug: `Workflow exception: ${error.message}`,
      stack: error.stack
    };
  }
}
