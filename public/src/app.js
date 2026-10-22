const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const targetLangSelect = document.getElementById('target-lang');
const subtitleContainer = document.getElementById('subtitle-editor');
const downloadSrtBtn = document.getElementById('download-srt');
const downloadVttBtn = document.getElementById('download-vtt');

let allSegments = [];

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    subtitleContainer.innerHTML = 'Đang gửi file lên Cloudflare Edge AI để nhận diện và dịch thuật...';
    allSegments = [];
    downloadSrtBtn.style.display = 'none';
    downloadVttBtn.style.display = 'none';

    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);
    formData.append('targetLang', targetLangSelect.value || 'vi');

    try {
        const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (data.success && data.segments) {
            allSegments = data.segments;
            subtitleContainer.innerHTML = '';

            allSegments.forEach((segment) => {
                const row = document.createElement('div');
                row.className = 'subtitle-row';
                row.innerHTML = `
                    <span class="time">[${segment.start}s - ${segment.end}s]</span>
                    <span class="original" contenteditable="true">${segment.text}</span>
                    <span class="translated" contenteditable="true">${segment.translated}</span>
                `;

                const transSpan = row.querySelector('.translated');
                transSpan.addEventListener('input', () => {
                    segment.translated = transSpan.innerText;
                });

                subtitleContainer.appendChild(row);
            });

            downloadSrtBtn.style.display = 'inline-block';
            downloadVttBtn.style.display = 'inline-block';
        } else {
            subtitleContainer.innerHTML = 'Lỗi xử lý AI: ' + (data.error || 'Không xác định');
        }
    } catch (err) {
        console.error("Lỗi:", err);
        subtitleContainer.innerHTML = 'Lỗi kết nối mạng đến Cloudflare Workers.';
    }
});

downloadSrtBtn.addEventListener('click', () => {
    const srtContent = window.SubtitleHelper.toSRT(allSegments);
    window.SubtitleHelper.downloadFile('subtitles.srt', srtContent, 'text/plain');
});

downloadVttBtn.addEventListener('click', () => {
    const vttContent = window.SubtitleHelper.toVTT(allSegments);
    window.SubtitleHelper.downloadFile('subtitles.vtt', vttContent, 'text/plain');
});
