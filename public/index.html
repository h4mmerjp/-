<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>歯科医院 日計表入力</title>
    <style>
        @media print { 
            @page { 
                size: B5 landscape; 
                margin: 0.3cm; 
            }
            .no-print { display: none !important; } 
            .print-block { display: block !important; } 
            body { 
                margin: 0 !important; 
                padding: 0 !important;
                background: white !important; 
                font-size: 10px !important;
                width: 100% !important;
                height: 100% !important;
                overflow: visible !important;
                font-family: 'MS Gothic', monospace !important;
            }
            input, button { 
                border: none !important; 
                background: none !important; 
                color: black !important; 
                -webkit-appearance: none !important;
                appearance: none !important;
                font-size: 9px !important;
                font-family: 'MS Gothic', monospace !important;
                font-weight: bold !important;
            } 
            .print-container { 
                max-width: 100% !important; 
                width: 100% !important;
                margin: 0 !important; 
                padding: 0 !important;
                font-size: 10px !important; 
                border: 2px solid black !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                height: 100vh !important;
                display: flex !important;
                flex-direction: column !important;
            }
            table { 
                font-size: 9px !important; 
                page-break-inside: avoid !important;
                width: 100% !important;
                table-layout: fixed !important;
                border-collapse: collapse !important;
                margin-bottom: 8px !important;
            }
            th, td { 
                padding: 2px 1px !important; 
                font-size: 9px !important;
                line-height: 1.1 !important;
                word-wrap: break-word !important;
                overflow: hidden !important;
                border: 1px solid black !important;
                text-align: center !important;
                font-family: 'MS Gothic', monospace !important;
            }
            .grid { 
                display: grid !important; 
                grid-template-columns: 40% 60% !important; 
                gap: 8px !important;
                width: 100% !important;
                height: auto !important;
                flex: 1 !important;
            }
            .print-header {
                font-size: 12px !important;
                padding: 3px !important;
                line-height: 1.2 !important;
                text-align: center !important;
                font-weight: bold !important;
                border-bottom: 2px solid black !important;
                margin-bottom: 3px !important;
            }
            .print-date {
                font-size: 9px !important;
                padding: 2px !important;
                line-height: 1.1 !important;
                text-align: center !important;
                border-bottom: 1px solid black !important;
                margin-bottom: 5px !important;
            }
            .print-input-s { width: 25px !important; font-size: 8px !important; text-align: right !important; }
            .print-input-m { width: 35px !important; font-size: 8px !important; text-align: right !important; }
            .print-input-l { width: 50px !important; font-size: 8px !important; text-align: right !important; }
            .print-input-center { text-align: center !important; }
            
            .left-section, .right-section {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            .spacer {
                display: none !important;
            }
            
            .total-row {
                background-color: #e8e8e8 !important;
                font-weight: bold !important;
            }
            
            .data-row {
                background-color: #f8f8f8 !important;
            }
            
            th {
                background-color: #d0d0d0 !important;
                font-weight: bold !important;
            }
            
            .compact-table {
                margin-bottom: 4px !important;
            }
            
            .col-item { width: 30% !important; }
            .col-count { width: 25% !important; }
            .col-amount { width: 45% !important; }
            .col-subject { width: 20% !important; }
            .col-dest { width: 25% !important; }
            .col-note { width: 25% !important; }
            .col-value { width: 30% !important; }
            
            .difference-controls {
                display: none !important;
            }
            
            .difference-btn-single {
                display: none !important;
            }
            
            .balance-check {
                background-color: #ffffcc !important;
                border: 2px solid #ff0000 !important;
                font-weight: bold !important;
            }
            
            .balance-check.match {
                background-color: #ccffcc !important;
                border-color: #00aa00 !important;
            }

            /* 印刷時の符号表示 */
            .print-sign {
                display: inline !important;
                font-weight: bold !important;
                font-size: 9px !important;
                margin: 0 2px !important;
            }
        }
        
        body {
            font-family: 'MS Gothic', monospace, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
        }
        
        .app-container {
            font-family: 'MS Gothic', monospace, sans-serif;
            font-size: 12px;
            background-color: white;
            border: 2px solid black;
            max-width: 1200px;
            margin: 10px auto;
            padding: 0 8px;
        }
        
        .header {
            background-color: #e0e0e0;
            padding: 15px;
            text-align: center;
            font-weight: bold;
            border-bottom: 2px solid black;
            font-size: 16px;
        }
        
        .print-date-section {
            display: none;
            text-align: center;
            padding: 4px;
            font-size: 12px;
            font-weight: bold;
            border-bottom: 1px solid black;
        }
        
        .date-input-section {
            text-align: center;
            margin: 10px 0;
            font-size: 14px;
            padding: 0 8px;
        }
        
        .date-input {
            font-size: 14px;
            padding: 5px;
            border: 1px solid black;
            font-family: monospace;
        }
        
        .today-btn {
            margin-left: 10px;
            padding: 3px 8px;
            font-size: 12px;
            border: 1px solid black;
            background-color: #f0f0f0;
            cursor: pointer;
        }
        
        .today-btn:hover {
            background-color: #d0d0d0;
        }
        
        .date-display {
            margin-left: 10px;
        }

        /* PDFアップロード機能のスタイル */
        .pdf-upload-section {
            background-color: #f8f8f8;
            border: 2px solid #007bff;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            text-align: center;
        }

        .pdf-upload-section h3 {
            color: #007bff;
            margin-top: 0;
            margin-bottom: 15px;
        }

        .file-input-wrapper {
            position: relative;
            display: inline-block;
            margin-bottom: 10px;
        }

        .file-input {
            position: absolute;
            left: -9999px;
            opacity: 0;
        }

        .file-input-label {
            display: inline-block;
            padding: 8px 20px;
            background-color: #007bff;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }

        .file-input-label:hover {
            background-color: #0056b3;
        }

        .upload-btn {
            padding: 8px 20px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-left: 10px;
        }

        .upload-btn:hover {
            background-color: #218838;
        }

        .upload-btn:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }

        .file-status {
            margin-top: 10px;
            font-size: 12px;
            color: #666;
        }

        .loading {
            color: #007bff;
            font-weight: bold;
        }

        .success {
            color: #28a745;
            font-weight: bold;
        }

        .error {
            color: #dc3545;
            font-weight: bold;
        }

        /* デバッグ情報エリア */
        .debug-section {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 15px;
            margin: 15px 0;
            font-family: monospace;
            font-size: 12px;
        }

        .debug-section h4 {
            margin-top: 0;
            color: #495057;
        }

        .debug-content {
            background-color: white;
            border: 1px solid #ced4da;
            border-radius: 4px;
            padding: 10px;
            white-space: pre-wrap;
            max-height: 200px;
            overflow-y: auto;
        }

        .debug-clear-btn {
            margin-top: 10px;
            padding: 5px 10px;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .debug-clear-btn:hover {
            background-color: #5a6268;
        }
        
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            min-height: 600px;
        }
        
        .left-section {
            border-right: 2px solid black;
            padding-right: 8px;
        }
        
        .right-section {
            padding-left: 8px;
        }
        
        .spacer {
            height: 20px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            table-layout: fixed;
            margin-bottom: 15px;
        }
        
        th, td {
            border: 1px solid black;
            padding: 4px;
            text-align: center;
        }
        
        th {
            background-color: #c0c0c0;
            font-weight: bold;
        }
        
        .data-row {
            background-color: #f8f8f8;
        }
        
        .total-row {
            background-color: #e0e0e0;
            font-weight: bold;
        }
        
        .input-field {
            border: none;
            background: transparent;
            font-family: 'MS Gothic', monospace, sans-serif;
            font-size: 11px;
            text-align: right;
            width: 100%;
        }
        
        .input-field-center {
            text-align: center;
        }
        
        .overflow-hidden {
            overflow: hidden;
        }
        
        .truncate {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .buttons-section {
            text-align: center;
            margin: 15px;
            padding: 15px;
            border-top: 2px solid black;
        }
        
        .btn {
            padding: 10px 20px;
            margin: 5px;
            font-size: 14px;
            border: 2px solid black;
            cursor: pointer;
            font-family: monospace;
        }
        
        .btn-clear {
            background-color: #ffcccc;
        }
        
        .btn-clear:hover {
            background-color: #ffaaaa;
        }
        
        .btn-print {
            background-color: #ccccff;
        }
        
        .btn-print:hover {
            background-color: #aaaaff;
        }
        
        .btn-export {
            background-color: #cccccc;
        }
        
        .btn-export:hover {
            background-color: #aaaaaa;
        }
        
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .modal-content {
            background-color: white;
            border: 2px solid black;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .modal-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 15px;
        }
        
        .btn-yes {
            padding: 8px 16px;
            background-color: #ff5555;
            color: white;
            border: 1px solid black;
            cursor: pointer;
        }
        
        .btn-yes:hover {
            background-color: #ff3333;
        }
        
        .btn-no {
            padding: 8px 16px;
            background-color: #d0d0d0;
            border: 1px solid black;
            cursor: pointer;
        }
        
        .btn-no:hover {
            background-color: #b0b0b0;
        }
        
        .message {
            position: fixed;
            top: 15px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            z-index: 1001;
        }
        
        .hidden {
            display: none;
        }
        
        .difference-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }
        
        .difference-btn-single {
            background-color: #e0e0e0;
            border: 1px solid black;
            padding: 2px 8px;
            font-size: 12px;
            cursor: pointer;
            min-width: 30px;
            font-weight: bold;
        }
        
        .difference-btn-single.positive {
            background-color: #4CAF50;
            color: white;
        }
        
        .difference-btn-single.negative {
            background-color: #f44336;
            color: white;
        }
        
        .difference-btn-single:hover {
            opacity: 0.8;
        }
        
        .balance-check {
            background-color: #ffffcc;
            border: 2px solid #ff0000;
            font-weight: bold;
            padding: 8px;
            text-align: center;
            margin: 10px 0;
            border-radius: 5px;
        }
        
        .balance-check.match {
            background-color: #ccffcc;
            border-color: #00aa00;
        }

        /* 印刷時の符号表示用 - 画面では非表示 */
        .print-sign {
            display: none;
        }
        
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
            
            .left-section {
                border-right: none;
                border-bottom: 2px solid black;
                margin-bottom: 20px;
                padding-right: 0;
            }
            
            .right-section {
                padding-left: 0;
            }
            
            .spacer {
                display: none;
            }
            
            .app-container {
                margin: 5px;
                padding: 0 4px;
            }
            
            table {
                font-size: 10px;
            }
            
            .input-field {
                font-size: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="app-container print-container">
        <!-- ヘッダー -->
        <div class="header print-header">
            歯科医院 日計表入力
        </div>

        <!-- 印刷用日付表示 -->
        <div class="print-date-section print-block print-date" id="printDate">
            日付: <span id="printDateValue"></span> <span id="printDateDisplay"></span>
        </div>

        <!-- 日付入力 -->
        <div class="date-input-section no-print">
            <label>日付: </label>
            <input type="date" id="reportDate" class="date-input">
            <button class="today-btn" onclick="setToday()">今日</button>
            <span class="date-display" id="dateDisplay"></span>
        </div>

        <!-- PDFアップロード機能 -->
        <div class="pdf-upload-section no-print">
            <h3>📄 レシートPDFから自動入力</h3>
            <div class="file-input-wrapper">
                <input type="file" id="pdfFile" class="file-input" accept=".pdf" onchange="handleFileSelect()">
                <label for="pdfFile" class="file-input-label">PDFファイルを選択</label>
            </div>
            <button class="upload-btn" id="uploadBtn" onclick="uploadPDF()" disabled>アップロード & 自動入力</button>
            <div class="file-status" id="fileStatus">PDFファイルを選択してください</div>
        </div>

        <!-- デバッグ情報エリア -->
        <div class="debug-section no-print">
            <h4>🔧 デバッグ情報</h4>
            <div class="debug-content" id="debugContent">デバッグ情報がここに表示されます...</div>
            <button class="debug-clear-btn" onclick="clearDebugInfo()">クリア</button>
        </div>

        <!-- 残高チェック表示 -->
        <div class="balance-check no-print" id="balanceCheck">
            残高チェック: 計算中...
        </div>

        <!-- 確認ダイアログ -->
        <div class="modal hidden no-print" id="confirmModal">
            <div class="modal-content">
                <p style="text-align: center; margin-bottom: 15px; font-family: monospace;">全てのデータをクリアしますか？</p>
                <div class="modal-buttons">
                    <button class="btn-yes" onclick="confirmClear()">はい</button>
                    <button class="btn-no" onclick="cancelClear()">いいえ</button>
                </div>
            </div>
        </div>

        <!-- メッセージ表示 -->
        <div class="message hidden no-print" id="messageBox"></div>

        <!-- メインレイアウト -->
        <div class="grid">
            <!-- 左側：ストックと金種 -->
            <div class="left-section">
                <div class="spacer"></div>

                <!-- ストック -->
                <table class="compact-table">
                    <thead>
                        <tr>
                            <th colspan="3">ストック</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="data-row">
                            <td class="col-item">5百円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="stock500" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="stock500Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">100円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="stock100" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="stock100Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">50円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="stock50" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="stock50Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">10円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="stock10" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="stock10Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">5円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="stock5" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="stock5Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">1円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="stock1" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="stock1Total">0</span></td>
                        </tr>
                        <tr class="total-row">
                            <td class="col-item">ストック合計</td>
                            <td class="col-count"></td>
                            <td class="col-amount"><span id="stockGrandTotal">0</span></td>
                        </tr>
                    </tbody>
                </table>

                <!-- 本日の残高金種 -->
                <table class="compact-table">
                    <thead>
                        <tr>
                            <th colspan="3">本日の残高金種</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="data-row">
                            <td class="col-item">1万円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="bill10000" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="bill10000Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">5千円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="bill5000" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="bill5000Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">2千円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="bill2000" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="bill2000Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">千円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="bill1000" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="bill1000Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">5百円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="coin500" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="coin500Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">100円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="coin100" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="coin100Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">50円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="coin50" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="coin50Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">10円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="coin10" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="coin10Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">5円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="coin5" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="coin5Total">0</span></td>
                        </tr>
                        <tr class="data-row">
                            <td class="col-item">1円</td>
                            <td class="col-count"><input type="number" class="input-field print-input-s" id="coin1" oninput="updateCalculations()">枚</td>
                            <td class="col-amount"><span id="coin1Total">0</span></td>
                        </tr>
                        <tr class="total-row">
                            <td class="col-item">金種合計</td>
                            <td class="col-count"></td>
                            <td class="col-amount"><span id="currencyTotal">0</span></td>
                        </tr>
                        <tr class="total-row">
                            <td class="col-item">総残高</td>
                            <td class="col-count"></td>
                            <td class="col-amount"><span id="totalBalance">0</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- 右側：窓口現金入出金 -->
            <div class="right-section">
                <!-- 窓口現金入金の記録 -->
                <table class="compact-table">
                    <thead>
                        <tr>
                            <th colspan="4">窓口現金入金の記録</th>
                        </tr>
                        <tr>
                            <th class="col-subject">科目</th>
                            <th class="col-dest">入金先</th>
                            <th class="col-note">摘要</th>
                            <th class="col-value">入金額</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>前回差額</td>
                            <td>繰越</td>
                            <td>
                                <div class="difference-controls">
                                    <button type="button" class="difference-btn-single" id="signBtn" onclick="toggleDifferenceSign()">+</button>
                                </div>
                                <span class="print-sign" id="printSign">+</span>
                            </td>
                            <td><input type="number" class="input-field print-input-m" id="previousDifference" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td>社保</td>
                            <td>窓口収入合計</td>
                            <td><input type="number" class="input-field print-input-s" id="shahoCount" oninput="updateCalculations()">名</td>
                            <td><input type="number" class="input-field print-input-m" id="shahoIncome" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td>国保</td>
                            <td>窓口収入合計</td>
                            <td><input type="number" class="input-field print-input-s" id="kokuhoCount" oninput="updateCalculations()">名</td>
                            <td><input type="number" class="input-field print-input-m" id="kokuhoIncome" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td>後期高齢者</td>
                            <td>窓口収入合計</td>
                            <td><input type="number" class="input-field print-input-s" id="koukiCount" oninput="updateCalculations()">名</td>
                            <td><input type="number" class="input-field print-input-m" id="koukiIncome" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td>自費</td>
                            <td>窓口収入合計</td>
                            <td><input type="number" class="input-field print-input-s" id="jihiCount" oninput="updateCalculations()">名</td>
                            <td><input type="number" class="input-field print-input-m" id="jihiIncome" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td>保険なし</td>
                            <td>窓口収入合計</td>
                            <td><input type="number" class="input-field print-input-s" id="hokenNashiCount" oninput="updateCalculations()">名</td>
                            <td><input type="number" class="input-field print-input-m" id="hokenNashiIncome" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td>物販収入</td>
                            <td>窓口収入合計</td>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="bushanNote"></td>
                            <td><input type="number" class="input-field print-input-m" id="bushanIncome" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="extraIncome1Subject"></td>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="extraIncome1Destination"></td>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="extraIncome1Note"></td>
                            <td><input type="number" class="input-field print-input-m" id="extraIncome1Amount" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="extraIncome2Subject"></td>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="extraIncome2Destination"></td>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="extraIncome2Note"></td>
                            <td><input type="number" class="input-field print-input-m" id="extraIncome2Amount" oninput="updateCalculations()"></td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3">合計</td>
                            <td><span id="incomeTotal">0</span></td>
                        </tr>
                    </tbody>
                </table>

                <!-- 窓口現金出金の記録 -->
                <table class="compact-table">
                    <thead>
                        <tr>
                            <th colspan="4">窓口現金出金の記録</th>
                        </tr>
                        <tr>
                            <th class="col-subject">科目</th>
                            <th class="col-dest">出金先</th>
                            <th class="col-note">摘要</th>
                            <th class="col-value">出金額</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="expense1Subject"></td>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="expense1Destination"></td>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="expense1Note"></td>
                            <td><input type="number" class="input-field print-input-m" id="expense1" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="expense2Subject"></td>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="expense2Destination"></td>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="expense2Note"></td>
                            <td><input type="number" class="input-field print-input-m" id="expense2" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="expense3Subject"></td>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="expense3Destination"></td>
                            <td><input type="text" class="input-field input-field-center print-input-center" id="expense3Note"></td>
                            <td><input type="number" class="input-field print-input-m" id="expense3" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td></td>
                            <td></td>
                            <td>院長へ</td>
                            <td><input type="number" class="input-field print-input-m" id="expenseDirector" oninput="updateCalculations()"></td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3">合計</td>
                            <td><span id="expenseTotal">0</span></td>
                        </tr>
                    </tbody>
                </table>

                <!-- 窓口現金出納 -->
                <table class="compact-table">
                    <thead>
                        <tr>
                            <th colspan="2">窓口現金出納</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>前日の繰越</td>
                            <td><input type="number" class="input-field print-input-l" id="previousBalance" oninput="updateCalculations()"></td>
                        </tr>
                        <tr>
                            <td>本日の現金入金</td>
                            <td><span id="todayIncome">0</span></td>
                        </tr>
                        <tr>
                            <td>本日の現金出金</td>
                            <td><span id="todayExpense">0</span></td>
                        </tr>
                        <tr class="total-row">
                            <td>本日の残高</td>
                            <td><span id="finalBalance">0</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ボタンセクション -->
        <div class="buttons-section no-print">
            <button class="btn btn-clear" onclick="clearAll()">全クリア</button>
            <button class="btn btn-print" onclick="printReport()">印刷</button>
            <button class="btn btn-export" onclick="exportData()">データエクスポート</button>
        </div>
    </div>

    <script>
        let differenceSign = '+'; // デフォルトは+
        let selectedFile = null;

        // 初期化
        document.addEventListener('DOMContentLoaded', function() {
            setToday();
            updateCalculations();
            updatePrintSign(); // 印刷用符号表示を初期化
            logDebug('アプリケーションが初期化されました');
            
            // 初期状態でボタンのクラスを設定
            const signBtn = document.getElementById('signBtn');
            signBtn.classList.add('positive');
        });

        // デバッグログ関数
        function logDebug(message) {
            const debugContent = document.getElementById('debugContent');
            const timestamp = new Date().toLocaleTimeString('ja-JP');
            const logEntry = `[${timestamp}] ${message}\n`;
            debugContent.textContent += logEntry;
            debugContent.scrollTop = debugContent.scrollHeight;
            console.log(`[DEBUG] ${message}`);
        }

        // デバッグ情報クリア
        function clearDebugInfo() {
            document.getElementById('debugContent').textContent = 'デバッグ情報がここに表示されます...\n';
            logDebug('デバッグ情報をクリアしました');
        }

        // ファイル選択ハンドラー
        function handleFileSelect() {
            const fileInput = document.getElementById('pdfFile');
            const uploadBtn = document.getElementById('uploadBtn');
            const fileStatus = document.getElementById('fileStatus');
            
            selectedFile = fileInput.files[0];
            
            if (selectedFile) {
                if (selectedFile.type !== 'application/pdf') {
                    fileStatus.textContent = '❌ PDFファイルを選択してください';
                    fileStatus.className = 'file-status error';
                    uploadBtn.disabled = true;
                    selectedFile = null;
                    logDebug(`無効なファイル形式: ${selectedFile.type}`);
                    return;
                }
                
                if (selectedFile.size > 15 * 1024 * 1024) {
                    fileStatus.textContent = '❌ ファイルサイズが15MBを超えています';
                    fileStatus.className = 'file-status error';
                    uploadBtn.disabled = true;
                    selectedFile = null;
                    logDebug(`ファイルサイズ超過: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
                    return;
                }
                
                fileStatus.textContent = `✅ ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)}KB)`;
                fileStatus.className = 'file-status success';
                uploadBtn.disabled = false;
                logDebug(`ファイル選択成功: ${selectedFile.name}, ${(selectedFile.size / 1024).toFixed(1)}KB`);
            } else {
                fileStatus.textContent = 'PDFファイルを選択してください';
                fileStatus.className = 'file-status';
                uploadBtn.disabled = true;
                logDebug('ファイル選択がキャンセルされました');
            }
        }

        // PDFアップロード処理
        async function uploadPDF() {
            if (!selectedFile) {
                showMessage('PDFファイルを選択してください');
                logDebug('エラー: ファイルが選択されていません');
                return;
            }

            const uploadBtn = document.getElementById('uploadBtn');
            const fileStatus = document.getElementById('fileStatus');
            
            // UI状態を更新
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'アップロード中...';
            fileStatus.textContent = '📤 Dify APIにアップロード中...';
            fileStatus.className = 'file-status loading';
            
            logDebug('PDFアップロード開始');

            try {
                // FormDataを作成
                const formData = new FormData();
                formData.append('file', selectedFile);
                
                logDebug(`リクエスト送信: ${selectedFile.name}`);

                // APIに送信
                const response = await fetch('/api/dify-proxy', {
                    method: 'POST',
                    body: formData
                });

                logDebug(`レスポンス受信: ${response.status} ${response.statusText}`);

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || `HTTP ${response.status}`);
                }

                if (result.success && result.data) {
                    // 抽出されたデータを入力フィールドに設定
                    populateFormWithExtractedData(result.data);
                    
                    fileStatus.textContent = '✅ データ抽出完了！';
                    fileStatus.className = 'file-status success';
                    
                    showMessage('PDFからデータを抽出して入力しました！');
                    logDebug('データ抽出成功');
                    logDebug(`抽出されたパラメータ: ${JSON.stringify(result.data, null, 2)}`);
                    
                    if (result.debug) {
                        logDebug(`API応答デバッグ情報: ${JSON.stringify(result.debug, null, 2)}`);
                    }
                    
                } else {
                    throw new Error('データ抽出に失敗しました');
                }

            } catch (error) {
                console.error('Upload error:', error);
                logDebug(`アップロードエラー: ${error.message}`);
                
                fileStatus.textContent = `❌ エラー: ${error.message}`;
                fileStatus.className = 'file-status error';
                
                showMessage(`エラー: ${error.message}`);
                
            } finally {
                // UI状態をリセット
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'アップロード & 自動入力';
                logDebug('アップロード処理完了');
            }
        }

        // 抽出されたデータをフォームに入力
        function populateFormWithExtractedData(data) {
            logDebug('フォームへのデータ入力開始');
            
            // 社保
            if (data.shaho_count) {
                document.getElementById('shahoCount').value = data.shaho_count;
                logDebug(`社保人数: ${data.shaho_count}`);
            }
            if (data.shaho_amount) {
                document.getElementById('shahoIncome').value = data.shaho_amount;
                logDebug(`社保金額: ${data.shaho_amount}`);
            }
            
            // 国保
            if (data.kokuho_count) {
                document.getElementById('kokuhoCount').value = data.kokuho_count;
                logDebug(`国保人数: ${data.kokuho_count}`);
            }
            if (data.kokuho_amount) {
                document.getElementById('kokuhoIncome').value = data.kokuho_amount;
                logDebug(`国保金額: ${data.kokuho_amount}`);
            }
            
            // 後期高齢者
            if (data.kouki_count) {
                document.getElementById('koukiCount').value = data.kouki_count;
                logDebug(`後期高齢者人数: ${data.kouki_count}`);
            }
            if (data.kouki_amount) {
                document.getElementById('koukiIncome').value = data.kouki_amount;
                logDebug(`後期高齢者金額: ${data.kouki_amount}`);
            }
            
            // 自費
            if (data.jihi_count) {
                document.getElementById('jihiCount').value = data.jihi_count;
                logDebug(`自費人数: ${data.jihi_count}`);
            }
            if (data.jihi_amount) {
                document.getElementById('jihiIncome').value = data.jihi_amount;
                logDebug(`自費金額: ${data.jihi_amount}`);
            }
            
            // 保険なし
            if (data.hoken_nashi_count) {
                document.getElementById('hokenNashiCount').value = data.hoken_nashi_count;
                logDebug(`保険なし人数: ${data.hoken_nashi_count}`);
            }
            if (data.hoken_nashi_amount) {
                document.getElementById('hokenNashiIncome').value = data.hoken_nashi_amount;
                logDebug(`保険なし金額: ${data.hoken_nashi_amount}`);
            }
            
            // 物販
            if (data.bushan_note) {
                document.getElementById('bushanNote').value = data.bushan_note;
                logDebug(`物販備考: ${data.bushan_note}`);
            }
            if (data.bushan_amount) {
                document.getElementById('bushanIncome').value = data.bushan_amount;
                logDebug(`物販金額: ${data.bushan_amount}`);
            }
            
            // 前回差額（符号を含む）
            if (data.previous_difference) {
                const diffStr = data.previous_difference.toString();
                if (diffStr.startsWith('-')) {
                    differenceSign = '-';
                    document.getElementById('previousDifference').value = diffStr.substring(1);
                    logDebug(`前回差額: ${diffStr} (負の値)`);
                } else if (diffStr.startsWith('+')) {
                    differenceSign = '+';
                    document.getElementById('previousDifference').value = diffStr.substring(1);
                    logDebug(`前回差額: ${diffStr} (正の値)`);
                } else {
                    // 符号なしの場合は正として扱う
                    differenceSign = '+';
                    document.getElementById('previousDifference').value = diffStr;
                    logDebug(`前回差額: ${diffStr} (符号なし、正として処理)`);
                }
                
                // 符号ボタンの表示を更新
                const signBtn = document.getElementById('signBtn');
                signBtn.textContent = differenceSign;
                signBtn.classList.remove('positive', 'negative');
                if (differenceSign === '+') {
                    signBtn.classList.add('positive');
                } else {
                    signBtn.classList.add('negative');
                }
                updatePrintSign();
            }
            
            // 計算を更新
            updateCalculations();
            logDebug('フォームへのデータ入力完了');
        }

        // 今日の日付を設定
        function setToday() {
            const today = new Date();
            const dateString = today.toISOString().split('T')[0];
            document.getElementById('reportDate').value = dateString;
            updateDateDisplay();
        }

        // 日付表示を更新
        function updateDateDisplay() {
            const dateInput = document.getElementById('reportDate');
            const dateDisplay = document.getElementById('dateDisplay');
            const printDateValue = document.getElementById('printDateValue');
            const printDateDisplay = document.getElementById('printDateDisplay');
            
            if (dateInput.value) {
                try {
                    const date = new Date(dateInput.value + 'T00:00:00');
                    const displayText = `(${date.toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                    })})`;
                    dateDisplay.textContent = displayText;
                    printDateValue.textContent = dateInput.value;
                    printDateDisplay.textContent = displayText;
                } catch (error) {
                    dateDisplay.textContent = '';
                    printDateDisplay.textContent = '';
                }
            }
        }

        // 日付変更時
        document.getElementById('reportDate').addEventListener('change', updateDateDisplay);

        // 印刷用符号表示を更新
        function updatePrintSign() {
            const printSign = document.getElementById('printSign');
            printSign.textContent = differenceSign;
        }

        // 前回差額の符号切り替え（1つのボタンでトグル）
        function toggleDifferenceSign() {
            // 符号を切り替え
            differenceSign = differenceSign === '+' ? '-' : '+';
            
            // ボタンの表示と色を更新
            const signBtn = document.getElementById('signBtn');
            signBtn.textContent = differenceSign;
            
            // クラスを更新
            signBtn.classList.remove('positive', 'negative');
            if (differenceSign === '+') {
                signBtn.classList.add('positive');
            } else {
                signBtn.classList.add('negative');
            }
            
            updatePrintSign(); // 印刷用符号表示を更新
            updateCalculations();
        }

        // 計算更新
        function updateCalculations() {
            // ストック計算
            const stockItems = [
                {id: 'stock500', value: 500},
                {id: 'stock100', value: 100},
                {id: 'stock50', value: 50},
                {id: 'stock10', value: 10},
                {id: 'stock5', value: 5},
                {id: 'stock1', value: 1}
            ];

            let stockTotal = 0;
            stockItems.forEach(item => {
                const count = parseInt(document.getElementById(item.id).value) || 0;
                const total = count * item.value;
                document.getElementById(item.id + 'Total').textContent = total;
                stockTotal += total;
            });
            
            document.getElementById('stockGrandTotal').textContent = stockTotal;

            // 金種計算
            const currencyItems = [
                {id: 'bill10000', value: 10000},
                {id: 'bill5000', value: 5000},
                {id: 'bill2000', value: 2000},
                {id: 'bill1000', value: 1000},
                {id: 'coin500', value: 500},
                {id: 'coin100', value: 100},
                {id: 'coin50', value: 50},
                {id: 'coin10', value: 10},
                {id: 'coin5', value: 5},
                {id: 'coin1', value: 1}
            ];

            let currencyTotal = 0;
            currencyItems.forEach(item => {
                const count = parseInt(document.getElementById(item.id).value) || 0;
                const total = count * item.value;
                document.getElementById(item.id + 'Total').textContent = total;
                currencyTotal += total;
            });
            
            document.getElementById('currencyTotal').textContent = currencyTotal;
            
            // 総残高（ストック + 金種）
            const totalBalance = stockTotal + currencyTotal;
            document.getElementById('totalBalance').textContent = totalBalance;

            // 前回差額の処理
            const previousDifferenceValue = parseInt(document.getElementById('previousDifference').value) || 0;
            const previousDifferenceAmount = differenceSign === '+' ? previousDifferenceValue : -previousDifferenceValue;

            // 収入計算（前回差額を含む）
            const incomeItems = ['shahoIncome', 'kokuhoIncome', 'koukiIncome', 'jihiIncome', 'hokenNashiIncome', 'bushanIncome', 'extraIncome1Amount', 'extraIncome2Amount'];
            let incomeTotal = previousDifferenceAmount;
            incomeItems.forEach(id => {
                incomeTotal += parseInt(document.getElementById(id).value) || 0;
            });
            document.getElementById('incomeTotal').textContent = incomeTotal;
            document.getElementById('todayIncome').textContent = incomeTotal;

            // 出金計算
            const expenseItems = ['expense1', 'expense2', 'expense3', 'expenseDirector'];
            let expenseTotal = 0;
            expenseItems.forEach(id => {
                expenseTotal += parseInt(document.getElementById(id).value) || 0;
            });
            document.getElementById('expenseTotal').textContent = expenseTotal;
            document.getElementById('todayExpense').textContent = expenseTotal;

            // 最終残高計算
            const previousBalance = parseInt(document.getElementById('previousBalance').value) || 0;
            const finalBalance = previousBalance + incomeTotal - expenseTotal;
            document.getElementById('finalBalance').textContent = finalBalance;

            // 残高チェック
            updateBalanceCheck(totalBalance, finalBalance);
        }

        // 残高チェック機能
        function updateBalanceCheck(physicalBalance, calculatedBalance) {
            const balanceCheck = document.getElementById('balanceCheck');
            const difference = physicalBalance - calculatedBalance;
            
            if (difference === 0) {
                balanceCheck.textContent = `残高チェック: ✓ 一致しています (${physicalBalance.toLocaleString()}円)`;
                balanceCheck.className = 'balance-check match no-print';
            } else {
                balanceCheck.textContent = `残高チェック: ✗ 差額 ${difference.toLocaleString()}円 (実物: ${physicalBalance.toLocaleString()}円 / 計算: ${calculatedBalance.toLocaleString()}円)`;
                balanceCheck.className = 'balance-check no-print';
            }
        }

        // 全クリア
        function clearAll() {
            document.getElementById('confirmModal').classList.remove('hidden');
        }

        function confirmClear() {
            // 全ての入力フィールドをクリア
            const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
            inputs.forEach(input => {
                if (input.id !== 'reportDate') {
                    input.value = '';
                }
            });
            
            // PDFファイル選択もクリア
            document.getElementById('pdfFile').value = '';
            selectedFile = null;
            document.getElementById('uploadBtn').disabled = true;
            document.getElementById('fileStatus').textContent = 'PDFファイルを選択してください';
            document.getElementById('fileStatus').className = 'file-status';
            
            // 前回差額の符号を+にリセット
            differenceSign = '+';
            const signBtn = document.getElementById('signBtn');
            signBtn.textContent = '+';
            signBtn.classList.remove('positive', 'negative');
            signBtn.classList.add('positive');
            updatePrintSign(); // 印刷用符号表示も更新
            
            document.getElementById('confirmModal').classList.add('hidden');
            updateCalculations();
            showMessage('全データをクリアしました。');
            logDebug('全データクリア完了');
        }

        function cancelClear() {
            document.getElementById('confirmModal').classList.add('hidden');
        }

        // 印刷
        function printReport() {
            // 印刷前にブラウザ設定のガイダンスを表示
            if (navigator.userAgent.includes('iPad') || navigator.userAgent.includes('iPhone')) {
                setTimeout(() => {
                    alert('印刷設定:\n1. 用紙サイズ：B5\n2. 方向：横向き\n3. 拡大/縮小：100%\n4. 余白：最小');
                }, 100);
            } else if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
                setTimeout(() => {
                    alert('印刷設定で「用紙サイズ：B5」「方向：横向き」「余白：最小」を選択してください。');
                }, 100);
            } else {
                setTimeout(() => {
                    alert('印刷設定:\n用紙：B5横向き\n余白：最小\n拡大/縮小：100%');
                }, 100);
            }
            
            // 印刷用日付表示を更新
            updateDateDisplay();
            
            // 印刷実行
            setTimeout(() => {
                window.print();
            }, 500);
        }

        // データエクスポート
        function exportData() {
            try {
                const data = {
                    date: document.getElementById('reportDate').value || 'no-date',
                    income: {
                        previousDifference: {
                            sign: differenceSign,
                            amount: parseInt(document.getElementById('previousDifference').value) || 0,
                            signedAmount: differenceSign === '+' ? 
                                (parseInt(document.getElementById('previousDifference').value) || 0) : 
                                -(parseInt(document.getElementById('previousDifference').value) || 0)
                        },
                        shaho: {
                            count: parseInt(document.getElementById('shahoCount').value) || 0,
                            amount: parseInt(document.getElementById('shahoIncome').value) || 0
                        },
                        kokuho: {
                            count: parseInt(document.getElementById('kokuhoCount').value) || 0,
                            amount: parseInt(document.getElementById('kokuhoIncome').value) || 0
                        },
                        kouki: {
                            count: parseInt(document.getElementById('koukiCount').value) || 0,
                            amount: parseInt(document.getElementById('koukiIncome').value) || 0
                        },
                        jihi: {
                            count: parseInt(document.getElementById('jihiCount').value) || 0,
                            amount: parseInt(document.getElementById('jihiIncome').value) || 0
                        },
                        hokenNashi: {
                            count: parseInt(document.getElementById('hokenNashiCount').value) || 0,
                            amount: parseInt(document.getElementById('hokenNashiIncome').value) || 0
                        },
                        bushan: {
                            note: document.getElementById('bushanNote').value || '',
                            amount: parseInt(document.getElementById('bushanIncome').value) || 0
                        },
                        extra1: {
                            subject: document.getElementById('extraIncome1Subject').value || '',
                            destination: document.getElementById('extraIncome1Destination').value || '',
                            note: document.getElementById('extraIncome1Note').value || '',
                            amount: parseInt(document.getElementById('extraIncome1Amount').value) || 0
                        },
                        extra2: {
                            subject: document.getElementById('extraIncome2Subject').value || '',
                            destination: document.getElementById('extraIncome2Destination').value || '',
                            note: document.getElementById('extraIncome2Note').value || '',
                            amount: parseInt(document.getElementById('extraIncome2Amount').value) || 0
                        },
                        total: parseInt(document.getElementById('incomeTotal').textContent) || 0
                    },
                    expense: {
                        expense1: {
                            subject: document.getElementById('expense1Subject').value || '',
                            destination: document.getElementById('expense1Destination').value || '',
                            note: document.getElementById('expense1Note').value || '',
                            amount: parseInt(document.getElementById('expense1').value) || 0
                        },
                        expense2: {
                            subject: document.getElementById('expense2Subject').value || '',
                            destination: document.getElementById('expense2Destination').value || '',
                            note: document.getElementById('expense2Note').value || '',
                            amount: parseInt(document.getElementById('expense2').value) || 0
                        },
                        expense3: {
                            subject: document.getElementById('expense3Subject').value || '',
                            destination: document.getElementById('expense3Destination').value || '',
                            note: document.getElementById('expense3Note').value || '',
                            amount: parseInt(document.getElementById('expense3').value) || 0
                        },
                        director: parseInt(document.getElementById('expenseDirector').value) || 0,
                        total: parseInt(document.getElementById('expenseTotal').textContent) || 0
                    },
                    balance: {
                        previous: parseInt(document.getElementById('previousBalance').value) || 0,
                        final: parseInt(document.getElementById('finalBalance').textContent) || 0
                    },
                    stock: {
                        stock500: parseInt(document.getElementById('stock500').value) || 0,
                        stock100: parseInt(document.getElementById('stock100').value) || 0,
                        stock50: parseInt(document.getElementById('stock50').value) || 0,
                        stock10: parseInt(document.getElementById('stock10').value) || 0,
                        stock5: parseInt(document.getElementById('stock5').value) || 0,
                        stock1: parseInt(document.getElementById('stock1').value) || 0,
                        total: parseInt(document.getElementById('stockGrandTotal').textContent) || 0
                    },
                    currency: {
                        bill10000: parseInt(document.getElementById('bill10000').value) || 0,
                        bill5000: parseInt(document.getElementById('bill5000').value) || 0,
                        bill2000: parseInt(document.getElementById('bill2000').value) || 0,
                        bill1000: parseInt(document.getElementById('bill1000').value) || 0,
                        coin500: parseInt(document.getElementById('coin500').value) || 0,
                        coin100: parseInt(document.getElementById('coin100').value) || 0,
                        coin50: parseInt(document.getElementById('coin50').value) || 0,
                        coin10: parseInt(document.getElementById('coin10').value) || 0,
                        coin5: parseInt(document.getElementById('coin5').value) || 0,
                        coin1: parseInt(document.getElementById('coin1').value) || 0,
                        total: parseInt(document.getElementById('currencyTotal').textContent) || 0
                    },
                    totalBalance: parseInt(document.getElementById('totalBalance').textContent) || 0,
                    balanceCheck: {
                        physicalBalance: parseInt(document.getElementById('totalBalance').textContent) || 0,
                        calculatedBalance: parseInt(document.getElementById('finalBalance').textContent) || 0,
                        difference: (parseInt(document.getElementById('totalBalance').textContent) || 0) - (parseInt(document.getElementById('finalBalance').textContent) || 0),
                        isMatched: ((parseInt(document.getElementById('totalBalance').textContent) || 0) - (parseInt(document.getElementById('finalBalance').textContent) || 0)) === 0
                    }
                };

                const dataStr = JSON.stringify(data, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `dental_daily_report_${data.date}.json`;
                a.style.display = 'none';
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                URL.revokeObjectURL(url);
                showMessage('データをエクスポートしました。');
                logDebug('データエクスポート完了');
            } catch (error) {
                console.error('エクスポート処理でエラー:', error);
                logDebug(`エクスポートエラー: ${error.message}`);
                showMessage('エクスポート処理中にエラーが発生しました。');
            }
        }

        // メッセージ表示
        function showMessage(message) {
            const messageBox = document.getElementById('messageBox');
            messageBox.textContent = message;
            messageBox.classList.remove('hidden');
            setTimeout(() => {
                messageBox.classList.add('hidden');
            }, 3000);
        }
    </script>
</body>
</html>
