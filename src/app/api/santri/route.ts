import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { santriSchema } from '@/lib/validation';
import { signatureStorage } from '@/lib/storage';
import { ObjectId } from 'mongodb';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function decodePng(dataUrl: string): Buffer | null {
  const m = dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;

  const b = Buffer.from(m[1], 'base64');
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return b.length >= 8 && b.subarray(0, 8).equals(png) ? b : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = santriSchema.safeParse(body);

    // Validasi dilakukan sebelum rate-limit agar request yang salah
    // tidak menghabiskan jatah submit pengguna.
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Data tidak valid.',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const png = decodePng(parsed.data.signature);
    if (!png || png.length > 2_000_000) {
      return NextResponse.json(
        { error: 'Tanda tangan tidak valid atau terlalu besar.' },
        { status: 400 },
      );
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // 20 submit valid per IP dalam 15 menit.
    // Scope baru membuat bucket lama (10/jam) tidak ikut memblokir pengguna.
    const limit = await rateLimit('submit-v2', ip, 20, 15 * 60 * 1000);

    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
        { status: 429 },
      );
    }

    const db = await getDb();
    const id = new ObjectId();
    const storageKey = id.toHexString();
    const url = await signatureStorage.upload(png, storageKey);

    try {
      await db.collection('santri').insertOne({
        _id: id,
        nama: parsed.data.nama,
        tempatLahir: parsed.data.tempatLahir,
        tanggalLahir: new Date(
          `${parsed.data.tanggalLahir}T00:00:00.000Z`,
        ),
        gender: parsed.data.gender,
        signature: {
          storageKey,
          originalFilename: `${storageKey}.png`,
          mimeType: 'image/png',
          url,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      await signatureStorage.delete(url).catch(() => undefined);
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('public submission error', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.' },
      { status: 500 },
    );
  }
}
