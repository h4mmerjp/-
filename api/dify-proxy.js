// Vercel API Route for Dify Proxy
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
    console.log('Starting file upload process...');
    
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
    console.log('Uploading file to Dify...');
    const uploadResult = await uploadFileToDify(uploadedFile);
    
    if (!uploadResult.success) {
      return res.status(400).json({
        error: 'File upload to Dify failed',
        debug: uploadResult.debug,
        difyError: uploadResult.error
      });
    }

    console.log('File uploaded successfully, ID:', uploadResult.fileId);

    // 2. ワークフロー実行
    console.log('Running Dify workflow...');
    const workflowResult = await runDifyWorkflow(uploadResult.fileId);
    
    if (!workflowResult.success) {
      return res.status(500).json({
        error: 'Workflow execution failed',
        debug: workflowResult.debug,
        difyError: workflowResult.error
      });
    }

    console.log('Workflow completed successfully');

    // 3. 結果を返す
    res.status(200).json({
      success: true,
      data: workflowResult.data,
      debug: {
        fileId: uploadResult.fileId,
        workflowExecuted: true,
        extractedParams: workflowResult.data
      }
    });

  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      debug: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Difyにファイルをアップロード
async function uploadFileToDify(file) {
  try {
    const formData = new FormData();
    const fileStream = fs.createReadStream(file.filepath);
    
    formData.append('file', fileStream, {
      filename: file.originalFilename,
      contentType: file.mimetype
    });
    formData.append('user', 'dental-app-user');

    console.log('Sending file to Dify upload endpoint...');
    
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
      debug: `Upload exception: ${error.message}`
    };
  }
}

// Difyワークフローを実行
async function runDifyWorkflow(fileId) {
  try {
    const requestBody = {
      inputs: {
        "orig_mail": [{
          "transfer_method": "local_file",
          "upload_file_id": fileId,
          "type": "document"
        }]
      },
      response_mode: "blocking",
      user: "dental-app-user"
    };

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
    console.log('Dify workflow response body:', responseText);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        debug: `Workflow failed with status ${response.status}. Response: ${responseText}`
      };
    }

    const result = JSON.parse(responseText);
    
    // ワークフロー結果からパラメータを抽出
    let extractedData = {};
    
    if (result.data && result.data.outputs) {
      // Difyワークフローの出力から必要なパラメータを取得
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

    return {
      success: true,
      data: extractedData,
      debug: `Workflow completed. Status: ${result.data?.status}. Extracted ${Object.keys(extractedData).length} parameters.`
    };

  } catch (error) {
    console.error('Workflow error:', error);
    return {
      success: false,
      error: error.message,
      debug: `Workflow exception: ${error.message}`
    };
  }
}
