const socket = io();

const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const modelSelect = document.getElementById('model-size');
const subtitleContainer = document.getElementById('subtitle-editor');
const downloadSrtBtn = document.getElementById('download-srt');
const downloadVttBtn = document.getElementById('download-vtt');

let allSegments = [];

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    subtitleContainer.innerHTML = 'Đang tải lên và xử lý AI...';
    allSegments = [];
    downloadSrtBtn.style.display = 'none';
    downloadVttBtn.style.display = 'none';
    
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);

    try {
        const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await uploadRes.json();
        
        if (data.filepath) {
            subtitleContainer.innerHTML = '';
            socket.emit('start_transcription', { 
                filepath: data.filepath, 
                modelSize: modelSelect.value || 'base'
            });
        }
    } catch (err) {
        console.error("Lỗi upload:", err);
        subtitleContainer.innerHTML = 'Lỗi kết nối khi tải file lên server.';
    }
});

socket.on('subtitle_chunk', (segment) => {
    allSegments.push(segment);

    const row = document.createElement('div');
    row.className = 'subtitle-row';
    row.innerHTML = `
        <span class="time">[${segment.start}s - ${segment.end}s]</span>
        <span class="original" contenteditable="true">${segment.text}</span>
        <span class="translated" contenteditable="true">${segment.translated}</span>
    `;
    
    // Cập nhật mảng khi user chỉnh sửa trực tiếp trên giao diện
    const transSpan = row.querySelector('.translated');
    transSpan.addEventListener('input', () => {
        segment.translated = transSpan.innerText;
    });

    subtitleContainer.appendChild(row);
    subtitleContainer.scrollTop = subtitleContainer.scrollHeight;
});

socket.on('transcription_done', () => {
    console.log('Hoàn tất xử lý!');
    downloadSrtBtn.style.display = 'inline-block';
    downloadVttBtn.style.display = 'inline-block';
});

// Sự kiện tải file
downloadSrtBtn.addEventListener('click', () => {
    const srtContent = window.SubtitleHelper.toSRT(allSegments);
    window.SubtitleHelper.downloadFile('subtitles.srt', srtContent, 'text/plain');
});

downloadVttBtn.addEventListener('click', () => {
    const vttContent = window.SubtitleHelper.toVTT(allSegments);
    window.SubtitleHelper.downloadFile('subtitles.vtt', vttContent, 'text/plain');
});
