import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { isAdmin } from '@/lib/auth';
import { signatureStorage } from '@/lib/storage';
import { z } from 'zod';

export const runtime = 'nodejs';

const updateSchema = z.object({
  nama: z.string().trim().min(2).max(100),
  tempatLahir: z.string().trim().min(2).max(100),
  tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['laki-laki', 'perempuan']),
});

async function getAuthorizedId(id: string) {
  if (!(await isAdmin())) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!ObjectId.isValid(id)) return { response: NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 }) };
  return { objectId: new ObjectId(id) };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthorizedId(id);
  if (auth.response) return auth.response;

  const doc = await (await getDb()).collection('santri').findOne({ _id: auth.objectId });
  if (!doc) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ ...doc, _id: doc._id.toHexString() });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthorizedId(id);
  if (auth.response) return auth.response;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Data edit tidak valid.' }, { status: 400 });

  const tanggalLahir = new Date(`${parsed.data.tanggalLahir}T00:00:00.000Z`);
  if (Number.isNaN(tanggalLahir.getTime())) {
    return NextResponse.json({ error: 'Tanggal lahir tidak valid.' }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection('santri').updateOne(
    { _id: auth.objectId },
    {
      $set: {
        nama: parsed.data.nama,
        tempatLahir: parsed.data.tempatLahir,
        tanggalLahir,
        gender: parsed.data.gender,
        updatedAt: new Date(),
      },
    },
  );

  if (!result.matchedCount) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthorizedId(id);
  if (auth.response) return auth.response;

  const db = await getDb();
  const doc = await db.collection('santri').findOne({ _id: auth.objectId });
  if (!doc) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });

  try {
    await signatureStorage.delete(doc.signature.url);
  } catch {
    return NextResponse.json({ error: 'Tanda tangan gagal dihapus dari storage. Data tidak dihapus.' }, { status: 502 });
  }

  await db.collection('santri').deleteOne({ _id: doc._id });
  return NextResponse.json({ success: true });
}
