# LedgerFlow Backend (Express + MongoDB)

## Setup (local)

```bash
cd backend
cp .env.example .env   # fill MONGODB_URI + JWT_SECRET
npm install
npm run seed           # creates the 8 default categories
npm run dev            # starts on http://localhost:4000
```

The **first user that signs up automatically becomes the admin**. All other signups are `employee`.

## Deploy (Render.com — free tier)

1. Push this `backend/` folder to a GitHub repo (separately, or as a subfolder).
2. On https://render.com → **New → Web Service** → connect repo.
3. Settings:
   - **Root Directory**: `backend` (if using subfolder)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add env vars (Environment tab):
   - `MONGODB_URI` — from MongoDB Atlas (free tier)
   - `JWT_SECRET` — any long random string
   - `CORS_ORIGIN` — your Lovable preview URL, e.g. `https://id-preview--xxx.lovable.app` (or `*` for testing)
5. Click **Deploy**. Once live, run the seed once from Render Shell:
   ```bash
   npm run seed
   ```
6. Copy the public URL (e.g. `https://ledgerflow-api.onrender.com`).

## Wire frontend

In your Lovable project root `.env` add:
```
VITE_API_BASE_URL=https://ledgerflow-api.onrender.com
```
Restart preview. Done.

## Notes

- **Bill uploads** are stored on the server's local disk (`/uploads`). Render free tier loses the disk on restart — for production use a persistent disk add-on or swap multer for S3.
- **MongoDB Atlas free tier**: https://www.mongodb.com/cloud/atlas/register → create cluster → Database Access (add user) → Network Access (allow 0.0.0.0/0) → copy connection string.

## API

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | /auth/signup | — | {email, password, display_name?} |
| POST | /auth/login | — | {email, password} |
| GET | /auth/me | Bearer | — |
| GET | /categories | Bearer | — |
| GET | /expenses?category_id=&status= | Bearer | — |
| POST | /expenses | Bearer | multipart (bill file + fields) |
| PATCH | /expenses/:id | Bearer (owner/admin) | multipart |
| DELETE | /expenses/:id | Bearer (owner/admin) | — |
| POST | /expenses/:id/approve | Bearer (admin) | {note?} |
| POST | /expenses/:id/reject | Bearer (admin) | {note?} |
