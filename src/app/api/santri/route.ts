import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { santriSchema } from '@/lib/validation';
import { signatureStorage } from '@/lib/storage';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

function decodePng(dataUrl: string): Buffer | null {
  const match = dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const buffer = Buffer.from(match[1], 'base64');
  const png = Buffer.from([137,80,78,71,13,10,26,10]);
  if (buffer.length < png.length || !buffer.subarray(0, 8).equals(png)) return null;
  return buffer;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = santriSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const png = decodePng(parsed.data.signature);
    if (!png || png.length > 2_000_000) return NextResponse.json({ error: 'Tanda tangan tidak valid atau terlalu besar.' }, { status: 400 });

    const db = await getDb();
    const id = new ObjectId();
    const storageKey = id.toHexString();
    const url = await signatureStorage.upload(png, storageKey);
    try {
      await db.collection('santri').insertOne({ _id: id, nama: parsed.data.nama, tempatLahir: parsed.data.tempatLahir, tanggalLahir: new Date(`${parsed.data.tanggalLahir}T00:00:00.000Z`), signature: { storageKey, originalFilename: `${storageKey}.png`, mimeType: 'image/png', url }, createdAt: new Date(), updatedAt: new Date() });
    } catch (error) {
      await signatureStorage.delete(url).catch(() => undefined);
      throw error;
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('public submission error', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.' }, { status: 500 });
  }
}
