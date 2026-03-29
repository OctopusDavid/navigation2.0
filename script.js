document.addEventListener('DOMContentLoaded', () => {
    // Basic console log to confirm script execution
    console.log("Script loaded and DOMContentLoaded event fired.");

    const fileUpload = document.getElementById('fileUpload');
    const jsonInput = document.getElementById('jsonInput');
    const outputTxt = document.getElementById('outputTxt');

    // Buttons
    const generateTxtBtn = document.getElementById('generateTxtBtn');
    const generateSrtBtn = document.getElementById('generateSrtBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyResultBtn = document.getElementById('copyResultBtn');
    const saveOutputTxtBtn = document.getElementById('saveOutputTxtBtn');
    const saveOutputSrtBtn = document.getElementById('saveOutputSrtBtn');
    
    // Output controls
    const fileEncoding = document.getElementById('fileEncoding');
    const lineBreakSelect = document.getElementById('lineBreak');

    // Reward button and popup elements
    const rewardBtn = document.getElementById('rewardBtn');
    const qrCodePopup = document.getElementById('qrCodePopup');
    const closeQrCodePopupBtn = document.getElementById('closeQrCodePopup');

    // --- Element Reference Verification ---
    // Added these logs to help diagnose if elements are not found
    if (!rewardBtn) console.error("Error: 'rewardBtn' element not found.");
    if (!qrCodePopup) console.error("Error: 'qrCodePopup' element not found.");
    if (!closeQrCodePopupBtn) console.error("Error: 'closeQrCodePopupBtn' element not found.");
    // --- End Element Reference Verification ---

    // Helper function to convert total seconds (e.g., 12158.177) to SRT time format (HH:MM:SS,ms)
    function convertSecondsToSrtTime(totalSecondsStr) {
        const totalSeconds = parseFloat(totalSecondsStr);
        if (isNaN(totalSeconds) || totalSeconds < 0) {
            return "00:00:00,000"; // Default or error time
        }

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

        // Pad with leading zeros
        const pad = (num, size) => num.toString().padStart(size, '0');

        return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`;
    }

    // Helper function to parse JSON and format for TXT output (content only)
    function formatJsonToPlainTxt(jsonString, lineBreakChar = '\r\n') {
        try {
            let data = JSON.parse(jsonString);
            let bodyArray;

            if (Array.isArray(data)) {
                bodyArray = data;
            } else if (typeof data === 'object' && Array.isArray(data.body)) {
                bodyArray = data.body;
            } else {
                throw new Error("JSON应为数组或包含'body'数组以生成TXT。");
            }

            let output = '';
            bodyArray.forEach((item) => {
                output += `${item.content || ''}${lineBreakChar}`;
            });
            return output.trim();
        } catch (e) {
            console.error("JSON解析错误或格式不正确，无法生成TXT:", e);
            return 'JSON解析错误或格式不正确，无法生成TXT。';
        }
    }

    // Helper function to parse JSON and format for SRT output
    function formatJsonToSrt(jsonString, lineBreakChar = '\r\n') {
        try {
            let data = JSON.parse(jsonString);
            let bodyArray;

            if (Array.isArray(data)) {
                bodyArray = data;
            } else if (typeof data === 'object' && Array.isArray(data.body)) {
                bodyArray = data.body;
            } else {
                throw new Error("JSON应为数组或包含'body'数组以生成SRT。");
            }

            let output = '';
            bodyArray.forEach((item, index) => {
                if (typeof item.from === 'undefined' || typeof item.to === 'undefined' || item.from === null || item.to === null) {
                    console.warn(`Skipping item ${index + 1} due to missing/null 'from' or 'to' field.`, item);
                    return; 
                }
                
                output += `${index + 1}${lineBreakChar}`;
                const srtFrom = convertSecondsToSrtTime(item.from);
                const srtTo = convertSecondsToSrtTime(item.to);
                output += `${srtFrom} --> ${srtTo}${lineBreakChar}`;
                output += `${item.content || ''}${lineBreakChar}${lineBreakChar}`;
            });
            return output.trim();
        } catch (e) {
            console.error("JSON解析错误或格式不正确，无法生成SRT:", e);
            return 'JSON解析错误或格式不正确，无法生成SRT。';
        }
    }

    // Function to download text as a file
    function downloadTextFile(content, filename, mimeType, encoding) {
        if (!content) {
            alert('内容为空，无法保存。');
            return;
        }
        const blob = new Blob([content], { type: `${mimeType};charset=${encoding}` });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }

    // Event Listeners

    // File Upload
    fileUpload.addEventListener('change', (event) => {
        console.log("File selected.");
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                jsonInput.value = e.target.result;
                outputTxt.value = '';
            };
            reader.readAsText(file);
        }
    });

    // 生成TXT
    generateTxtBtn.addEventListener('click', () => {
        console.log("Generate TXT button clicked.");
        const jsonStr = jsonInput.value.trim();
        const lineBreak = lineBreakSelect.value === 'Windows' ? '\r\n' : '\n';
        if (jsonStr) {
            outputTxt.value = formatJsonToPlainTxt(jsonStr, lineBreak);
        } else {
            outputTxt.value = '请输入JSON内容以生成TXT。';
        }
    });

    // 生成SRT
    generateSrtBtn.addEventListener('click', () => {
        console.log("Generate SRT button clicked.");
        const jsonStr = jsonInput.value.trim();
        const lineBreak = lineBreakSelect.value === 'Windows' ? '\r\n' : '\n';
        if (jsonStr) {
            outputTxt.value = formatJsonToSrt(jsonStr, lineBreak);
        } else {
            outputTxt.value = '请输入JSON内容以生成SRT。';
        }
    });

    // 清空
    clearBtn.addEventListener('click', () => {
        console.log("Clear button clicked.");
        jsonInput.value = '';
        outputTxt.value = '';
        fileUpload.value = '';
    });

    // 复制结果
    copyResultBtn.addEventListener('click', () => {
        console.log("Copy Result button clicked.");
        if (outputTxt.value.trim()) {
            outputTxt.select();
            outputTxt.setSelectionRange(0, 99999);
            try {
                document.execCommand('copy');
                alert('输出内容已复制到剪贴板！');
            } catch (err) {
                console.error('无法复制文本：', err);
                alert('复制失败，请手动复制。');
            }
        } else {
            alert('输出结果为空，无法复制。');
        }
    });

    // 保存为TXT (输出结果)
    saveOutputTxtBtn.addEventListener('click', () => {
        console.log("Save TXT button clicked.");
        const txtContent = outputTxt.value.trim();
        const encoding = fileEncoding.value;
        downloadTextFile(txtContent, 'output.txt', 'text/plain', encoding);
    });

    // 保存为SRT (输出结果)
    saveOutputSrtBtn.addEventListener('click', () => {
        console.log("Save SRT button clicked.");
        const srtContent = outputTxt.value.trim();
        const encoding = fileEncoding.value;

        const isSrtOutput = srtContent.match(/^\d+\r?\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/m) && srtContent.split(/\r?\n\r?\n/).some(block => block.split(/\r?\n/).length >= 2);

        if (isSrtOutput) {
            downloadTextFile(srtContent, 'output.srt', 'text/plain', encoding);
        } else {
            alert('当前输出结果不是有效的SRT格式，请先生成SRT。');
        }
    });


    // 打赏按钮和弹出框逻辑
    rewardBtn.addEventListener('click', (event) => {
        console.log("Reward button clicked.");
        // Prevent event from bubbling up to document click listener immediately
        event.stopPropagation(); 
        qrCodePopup.classList.toggle('visible'); 
    });

    closeQrCodePopupBtn.addEventListener('click', (event) => {
        console.log("Close QR popup button clicked.");
        event.stopPropagation(); // Prevent document click from immediately reopening
        qrCodePopup.classList.remove('visible');
    });

    // Hide popup if clicking outside of it
    document.addEventListener('click', (event) => {
        // Only hide if popup is visible AND click is not on the reward button itself AND click is not inside the popup
        if (qrCodePopup.classList.contains('visible') && !rewardBtn.contains(event.target) && !qrCodePopup.contains(event.target)) {
            console.log("Clicked outside popup, hiding.");
            qrCodePopup.classList.remove('visible');
        }
    });

    // Initial state: clear input
    jsonInput.value = '';
    outputTxt.value = '';
    fileUpload.value = '';
});