import { put, del } from '@vercel/blob';
export interface SignatureStorage { upload(data: Buffer, key: string): Promise<string>; get(url: string): Promise<Buffer>; delete(url: string): Promise<void>; }
export const signatureStorage: SignatureStorage = {
  async upload(data, key) { const blob = await put(`signatures/${key}.png`, data, { access: 'private', contentType: 'image/png', addRandomSuffix: false }); return blob.url; },
  async get(url) { const token = process.env.BLOB_READ_WRITE_TOKEN; if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is required'); const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }); if (!res.ok) throw new Error('Signature storage read failed'); return Buffer.from(await res.arrayBuffer()); },
  async delete(url) { await del(url); },
};
