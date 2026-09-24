import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';

export const runtime = 'nodejs';

const csv = (value: unknown) => {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const formatDate = (value: Date | string | undefined) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
};

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const docs = await (await getDb())
    .collection('santri')
    .find(
      {},
      {
        projection: {
          nama: 1,
          tempatLahir: 1,
          tanggalLahir: 1,
          createdAt: 1,
        },
      },
    )
    .sort({ createdAt: -1 })
    .toArray();

  // Gunakan titik koma sebagai pemisah agar otomatis terbaca sebagai kolom
  // di Microsoft Excel pada pengaturan regional Indonesia.
  const separator = ';';
  const rows = [
    ['Nama', 'Tempat Lahir', 'Tanggal Lahir', 'Created At'],
    ...docs.map((doc) => [
      doc.nama,
      doc.tempatLahir,
      formatDate(doc.tanggalLahir),
      new Date(doc.createdAt).toLocaleString('id-ID', {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: 'Asia/Jakarta',
      }),
    ]),
  ];

  const body =
    '\ufeff' +
    rows.map((row) => row.map(csv).join(separator)).join('\r\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="data-santri.csv"',
      'Cache-Control': 'private, no-store',
    },
  });
}
