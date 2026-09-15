import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { isAdmin } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { signatureStorage } from '@/lib/storage';

export const runtime = 'nodejs';

function safeFilename(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'santri';
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const doc = await (await getDb()).collection('santri').findOne(
    { _id: new ObjectId(id) },
    { projection: { nama: 1, signature: 1 } },
  );

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const data = await signatureStorage.get(doc.signature.url);
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${safeFilename(doc.nama)}.png"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('signature read error', doc._id, error);
    return NextResponse.json({ error: 'Signature unavailable' }, { status: 502 });
  }
}
