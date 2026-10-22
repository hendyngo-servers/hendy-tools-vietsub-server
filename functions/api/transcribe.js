export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const formData = await request.formData();
    const file = formData.get('media');
    const targetLang = formData.get('targetLang') || 'vi';

    if (!file) {
      return new Response(JSON.stringify({ error: 'Không tìm thấy file tải lên.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputAudio = {
      audio: [...new Uint8Array(arrayBuffer)]
    };

    // 1. Nhận diện giọng nói bằng Whisper Model trên Edge
    const whisperResponse = await env.AI.run('@cf/openai/whisper', inputAudio);
    const segments = whisperResponse.chunks || [{
      start: 0,
      end: whisperResponse.text ? 5 : 0,
      text: whisperResponse.text || ""
    }];

    // 2. Dịch thuật song song các đoạn văn bản sang ngôn ngữ đích bằng M2M100
    const translationPromises = segments.map(async (seg, index) => {
      const originalText = seg.text ? seg.text.trim() : "";
      let translatedText = originalText;

      if (originalText && targetLang !== 'en') {
        try {
          const translationResponse = await env.AI.run('@cf/meta/m2m100-1.2b', {
            text: originalText,
            source_lang: 'en',
            target_lang: targetLang
          });
          
          if (translationResponse && translationResponse.translated_text) {
            translatedText = translationResponse.translated_text;
          }
        } catch (err) {
          console.error(`Lỗi dịch đoạn ${index}:`, err);
        }
      }

      return {
        id: index + 1,
        start: Number(seg.start.toFixed(2)),
        end: Number(seg.end.toFixed(2)),
        text: originalText,
        translated: translatedText.trim()
      };
    });

    const formattedSegments = await Promise.all(translationPromises);

    return new Response(JSON.stringify({ success: true, segments: formattedSegments }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
