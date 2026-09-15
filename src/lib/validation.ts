import { z } from 'zod';

export const santriSchema = z.object({
  nama: z.string().trim().min(2, 'Nama wajib diisi.').max(100, 'Nama maksimal 100 karakter.'),
  tempatLahir: z.string().trim().min(2, 'Tempat lahir wajib diisi.').max(100, 'Tempat lahir maksimal 100 karakter.'),
  tanggalLahir: z.string().refine((v) => { const d = new Date(`${v}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(d.getTime()); }, 'Tanggal lahir tidak valid.'),
  gender: z.enum(['laki-laki', 'perempuan'], { message: 'Jenis kelamin wajib dipilih.' }),
  signature: z.string().min(100, 'Tanda tangan wajib dibuat.'),
});

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'ID tidak valid.');
export type SantriInput = z.infer<typeof santriSchema>;
