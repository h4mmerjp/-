// Difyワークフローを実行 - デバッグ強化版
async function runDifyWorkflow(fileId) {
  try {
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
    
    // 🔍 詳細デバッグ: レスポンス構造を分析
    console.log('=== WORKFLOW RESPONSE ANALYSIS ===');
    console.log('Full result:', JSON.stringify(result, null, 2));
    console.log('result.data:', result.data);
    console.log('result.data.outputs:', result.data?.outputs);
    console.log('Object.keys(result):', Object.keys(result));
    if (result.data) {
      console.log('Object.keys(result.data):', Object.keys(result.data));
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
    return {
      success: false,
      error: error.message,
      debug: `Workflow exception: ${error.message}`
    };
  }
}
