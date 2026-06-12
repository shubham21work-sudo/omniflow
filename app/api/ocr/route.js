export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');

  const ocrForm = new FormData();
  ocrForm.append('apikey', process.env.OCR_SPACE_API_KEY);
  ocrForm.append('file', file);
  ocrForm.append('OCREngine', '2');
  ocrForm.append('scale', 'true');
  ocrForm.append('isTable', 'true');

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: ocrForm,
  });

  const data = await res.json();
  const text = data?.ParsedResults?.[0]?.ParsedText || '';

  return Response.json({ rawText: text });
}