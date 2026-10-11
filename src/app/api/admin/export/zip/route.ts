import { NextResponse } from 'next/server';
import { ZipArchive } from 'archiver';
import { PassThrough } from 'node:stream';
import { isAdmin } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { signatureStorage } from '@/lib/storage';

export const runtime = 'nodejs';

function sanitizeFilename(name: string) {
  return (
    name
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'santri'
  );
}

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const gender = searchParams.get('gender');
  const filter: Record<string, unknown> = {};

  if (gender === 'laki-laki' || gender === 'perempuan') {
    filter.gender = gender;
  }

  const db = await getDb();
  const docs = await db
    .collection('santri')
    .find(filter, { projection: { nama: 1, signature: 1, gender: 1 } })
    .sort({ createdAt: -1 })
    .toArray();

  const archive = new ZipArchive({ zlib: { level: 6 } });
  const pass = new PassThrough();
  archive.pipe(pass);

  for (const doc of docs) {
    try {
      const data = await signatureStorage.get(doc.signature.url);
      const folder = doc.gender === 'laki-laki'
        ? 'laki-laki'
        : doc.gender === 'perempuan'
          ? 'perempuan'
          : 'belum-diatur';
      archive.append(data, {
        name: `${folder}/${sanitizeFilename(doc.nama)}-${doc._id.toHexString().slice(-6)}.png`,
      });
    } catch (error) {
      console.error('zip signature error', doc._id, error);
    }
  }

  await archive.finalize();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      pass.on('data', (chunk: Buffer | Uint8Array) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      pass.on('end', () => controller.close());
      pass.on('error', (error) => controller.error(error));
    },
    cancel() {
      pass.destroy();
    },
  });

  const downloadFilename = gender === 'laki-laki'
    ? 'tanda-tangan-laki-laki.zip'
    : gender === 'perempuan'
      ? 'tanda-tangan-perempuan.zip'
      : 'tanda-tangan-semua.zip';

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
