# Tanda Tangan Santri

A production-oriented Next.js web app for collecting santri name, birthplace, birth date, and handwritten signatures. Public users do not need accounts and cannot download signatures. Authenticated admins can search, view, download PNG signatures, export CSV/ZIP, and delete records.

## Stack
- Next.js App Router + TypeScript + React
- Tailwind CSS
- MongoDB Atlas via official MongoDB driver
- Vercel Blob private storage for PNG signatures
- Zod + custom Pointer Events signature pad
- bcryptjs + jose HTTP-only cookie sessions

No Supabase, Firebase, PostgreSQL, MySQL, or permanent Vercel filesystem is used.

## Local development
```bash
npm install
npm run dev
npm run build
npm run start
npm test
npm run lint
```

Copy `.env.example` to `.env.local` and set all values.

## Admin password hash
Generate a bcrypt hash locally, for example with a small Node script using `bcryptjs`, then put the resulting hash in `ADMIN_PASSWORD_HASH`. Never commit `.env.local` or plaintext passwords.

## MongoDB Atlas
1. Create an Atlas cluster and database user.
2. Create a database such as `santri`.
3. For Vercel, do not assume a single fixed outbound IP. Use Atlas Network Access according to your organization's security policy; for a simple deployment this commonly means allowing the required Vercel outbound access, while production environments should consider Vercel's documented static-egress/private-network options where applicable.
4. Set `MONGODB_URI` and `MONGODB_DB` in Vercel Project Settings.
5. The app automatically creates `santri.nama` and `santri.createdAt` indexes.

## Vercel Blob
Create a Vercel Blob store and add its token as `BLOB_READ_WRITE_TOKEN`. Signatures are stored as private PNG blobs. They are never rendered as public Blob URLs; admin download routes authenticate first and fetch the private object server-side.

## Environment variables
```env
MONGODB_URI=
MONGODB_DB=
ADMIN_USERNAME=
ADMIN_PASSWORD_HASH=
SESSION_SECRET=
BLOB_READ_WRITE_TOKEN=
```
Use a long random `SESSION_SECRET` (32+ characters; preferably substantially longer).

## Routes
- `/` public data form
- `/admin/login` admin login
- `/admin` protected dashboard
- `/admin/santri/[id]` protected detail
- `/api/santri` public submission endpoint
- `/api/admin/*` protected administration/export endpoints

## Security notes
Server-side validation is mandatory even though the client validates too. Signature input is restricted to PNG data URLs and a 2 MB maximum. Authentication uses an HTTP-only, Secure-in-production, SameSite=Lax cookie signed with `jose`; credentials are bcrypt-hashed. Admin signature endpoints never expose storage credentials. Public submission and login endpoints use MongoDB-backed time-bucket rate limiting suitable for serverless execution.

## Deployment checklist
1. Push repository to GitHub.
2. Import it into Vercel.
3. Add all environment variables.
4. Deploy and verify `npm run build` in Vercel.
5. Submit a test signature from Android/iPhone and Windows.
6. Verify the record appears in `/admin`.
7. Verify PNG download, CSV export, ZIP export, delete, and logout.
8. Remove test records after verification.

## Troubleshooting
- `MONGODB_URI... required`: environment variables are missing.
- Blob upload/read errors: check `BLOB_READ_WRITE_TOKEN` and Blob store permissions.
- Login fails: verify `ADMIN_USERNAME` and that `ADMIN_PASSWORD_HASH` is a valid bcrypt hash.
- Atlas connection errors: check database credentials, Network Access, and URI encoding.
