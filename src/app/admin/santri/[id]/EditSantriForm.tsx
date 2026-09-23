'use client';

import { useState } from 'react';

export default function EditSantriForm({
  id,
  initial,
}: {
  id: string;
  initial: {
    nama: string;
    tempatLahir: string;
    tanggalLahir: string;
    gender: 'laki-laki' | 'perempuan';
  };
}) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus('');

    try {
      const response = await fetch(`/api/admin/santri/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan perubahan.');
      setStatus('Data berhasil diperbarui.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 rounded-2xl border bg-slate-50 p-5 sm:p-6">
      <h2 className="text-lg font-bold">Edit Data Santri</h2>
      <p className="mt-1 text-sm text-slate-500">Perubahan hanya diterapkan pada data pribadi.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold sm:col-span-2">
          Nama Lengkap
          <input required minLength={2} maxLength={100} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 font-normal" />
        </label>
        <label className="text-sm font-semibold">
          Tempat Lahir
          <input required minLength={2} maxLength={100} value={form.tempatLahir} onChange={(e) => setForm({ ...form, tempatLahir: e.target.value })} className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 font-normal" />
        </label>
        <label className="text-sm font-semibold">
          Tanggal Lahir
          <input required type="date" value={form.tanggalLahir} onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })} className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 font-normal" />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Jenis Kelamin
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as typeof form.gender })} className="mt-1 min-h-11 w-full rounded-xl border bg-white px-3 font-normal">
            <option value="laki-laki">Laki-laki</option>
            <option value="perempuan">Perempuan</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button disabled={saving} className="min-h-11 rounded-xl bg-slate-900 px-5 font-semibold text-white disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
        {status && <p role="status" className="text-sm text-slate-600">{status}</p>}
      </div>
    </form>
  );
}
