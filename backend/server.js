const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, '../')));

// Endpoint nhận file qua HTTP Upload
app.post('/api/upload', upload.single('media'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    res.json({ filepath: req.file.path });
});

// Xử lý WebSocket Stream
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('start_transcription', (data) => {
        const { filepath, modelSize } = data;
        
        if (!fs.existsSync(filepath)) {
            socket.emit('error', { message: 'File không tồn tại trên server.' });
            return;
        }

        const pythonProcess = spawn('python3', ['backend/offline_worker.py', '--file', filepath, '--model', modelSize || 'base']);

        pythonProcess.stdout.on('data', (buffer) => {
            const lines = buffer.toString().split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const segment = JSON.parse(line);
                        socket.emit('subtitle_chunk', segment);
                    } catch (e) {
                        console.error("Lỗi parse JSON từ Python:", line);
                    }
                }
            }
        });

        pythonProcess.stderr.on('data', (err) => {
            console.error(`Python Error: ${err}`);
        });

        pythonProcess.on('close', (code) => {
            socket.emit('transcription_done', { status: 'success', code });
            
            // Tự động dọn dẹp file sau khi xử lý xong
            fs.unlink(filepath, (err) => {
                if (err) console.error("Không thể xóa file tạm:", err);
            });
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
