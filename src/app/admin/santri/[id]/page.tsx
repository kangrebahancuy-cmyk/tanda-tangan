import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import DetailActions from './DetailActions';

export const dynamic = 'force-dynamic';

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect('/admin/login');

  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();

  const doc = await (await getDb()).collection('santri').findOne({ _id: new ObjectId(id) });
  if (!doc) notFound();

  const signatureUrl = `/api/admin/santri/${doc._id.toHexString()}/signature`;

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <a href="/admin" className="text-sm font-semibold text-slate-500">
          ← Kembali
        </a>

        <div className="mt-5 rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-slate-500">Detail Santri</p>
          <h1 className="mt-2 text-3xl font-bold">{doc.nama}</h1>

          <dl className="mt-7 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500">Tempat Lahir</dt>
              <dd className="mt-1 font-semibold">{doc.tempatLahir}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Tanggal Lahir</dt>
              <dd className="mt-1 font-semibold">
                {new Date(doc.tanggalLahir).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <p className="text-sm font-semibold">Tanda Tangan</p>
            <div className="relative mt-2 flex min-h-56 items-center justify-center rounded-2xl border bg-slate-50 p-6">
              <Image
                src={signatureUrl}
                alt={`Tanda tangan ${doc.nama}`}
                width={800}
                height={400}
                sizes="(max-width: 640px) 100vw, 800px"
                className="h-auto max-h-48 w-auto max-w-full object-contain"
                unoptimized
              />
            </div>
          </div>

          <DetailActions id={doc._id.toHexString()} />
        </div>
      </div>
    </main>
  );
}
