import { NextResponse } from 'next/server';
import { ZipArchive } from 'archiver';
import { PassThrough } from 'node:stream';
import { isAdmin } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { signatureStorage } from '@/lib/storage';

export const runtime = 'nodejs';

function filename(name: string) {
  return (
    name
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'santri'
  );
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const docs = await db
    .collection('santri')
    .find({}, { projection: { nama: 1, signature: 1 } })
    .sort({ createdAt: -1 })
    .toArray();

  const archive = new ZipArchive({ zlib: { level: 6 } });
  const pass = new PassThrough();
  archive.pipe(pass);

  for (const doc of docs) {
    try {
      const data = await signatureStorage.get(doc.signature.url);
      archive.append(data, {
        name: `${filename(doc.nama)}-${doc._id.toHexString().slice(-6)}.png`,
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

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="tanda-tangan-santri.zip"',
      'Cache-Control': 'private, no-store',
    },
  });
}
