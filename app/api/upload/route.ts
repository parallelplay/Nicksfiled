import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.jpg';
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${Date.now()}_${cleanName}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);
      const url = `/uploads/${filename}`;

      return NextResponse.json({ success: true, url, filename });
    }

    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { dataUrl, filename: reqFilename } = body;
      if (!dataUrl) {
        return NextResponse.json({ error: 'dataUrl required' }, { status: 400 });
      }

      const match = dataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 });
      }

      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const filename = `${Date.now()}_${reqFilename ? reqFilename.replace(/[^a-zA-Z0-9.-]/g, '_') : 'upload'}.${ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, buffer);
      const url = `/uploads/${filename}`;

      return NextResponse.json({ success: true, url, filename });
    }

    return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
  } catch (err: any) {
    console.error('[Upload API] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
