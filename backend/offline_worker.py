import sys
import json
import argparse
from faster_whisper import WhisperModel
import argostranslate.translate

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--file', type=str, required=True)
    parser.add_argument('--model', type=str, default='base')
    args = parser.parse_args()

    # Khởi tạo model Whisper
    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    
    # Chạy nhận diện (trả về generator)
    segments, info = model.transcribe(args.file, beam_size=5)

    from_code = "en"
    to_code = "vi"

    for segment in segments:
        original_text = segment.text.strip()
        
        # Dịch thuật tự động bằng Argos Translate
        try:
            translated_text = argostranslate.translate.translate(original_text, from_code, to_code)
        except Exception:
            translated_text = original_text # Fallback nếu lỗi dịch

        chunk_data = {
            "start": round(segment.start, 2),
            "end": round(segment.end, 2),
            "text": original_text,
            "translated": translated_text.strip()
        }
        
        # In ra stdout để Node.js bắt sự kiện realtime
        print(json.dumps(chunk_data, ensure_ascii=False))
        sys.stdout.flush()

if __name__ == '__main__':
    main()
