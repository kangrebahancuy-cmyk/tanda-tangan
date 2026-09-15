import { put, del } from '@vercel/blob';

export interface SignatureStorage {
  upload(data: Buffer, key: string): Promise<string>;
  delete(url: string): Promise<void>;
}

export const signatureStorage: SignatureStorage = {
  async upload(data, key) {
    const blob = await put(`signatures/${key}.png`, data, { access: 'private', contentType: 'image/png', addRandomSuffix: false });
    return blob.url;
  },
  async delete(url) { await del(url); },
};
