export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const formData = await request.formData();
    const file = formData.get('media');

    if (!file) {
      return new Response(JSON.stringify({ error: 'Không tìm thấy file tải lên.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Đọc file thành mảng byte (ArrayBuffer) để truyền vào Workers AI
    const arrayBuffer = await file.arrayBuffer();
    const input = {
      audio: [...new Uint8Array(arrayBuffer)]
    };

    // Gọi mô hình Whisper tích hợp sẵn trên Cloudflare Workers AI
    const response = await env.AI.run('@cf/openai/whisper', input);

    // Xử lý dữ liệu trả về từ Whisper (gồm các chunks/segments)
    const segments = response.chunks || [{
      start: 0,
      end: response.text ? 5 : 0,
      text: response.text || ""
    }];

    // Định dạng lại kết quả cho giao diện Live Editor
    const formattedSegments = segments.map((seg, index) => ({
      id: index + 1,
      start: Number(seg.start.toFixed(2)),
      end: Number(seg.end.toFixed(2)),
      text: seg.text.trim(),
      translated: seg.text.trim() // Có thể tích hợp thêm Workers AI Translation nếu cần dịch đa ngôn ngữ
    }));

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
