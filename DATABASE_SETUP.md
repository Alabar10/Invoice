# Database setup (one time)

The app now saves every receipt to a database and shows them on the
**📊 לוח בקרה** (Dashboard). You only have to do this setup once.

## 1. Create the database in Vercel (free)

1. Go to your project on [vercel.com](https://vercel.com) → **Storage** tab.
2. Click **Create Database** → choose **Neon (Postgres)** → **Continue**.
3. Pick a name and region, click **Create**.
4. When asked, **Connect** it to this project.

Vercel automatically adds the `DATABASE_URL` (and related) environment
variables to your project. Nothing to copy by hand.

## 2. Create the `Receipt` table

The database is empty at first — it needs the table. Run this **once**
from your computer, inside the project folder:

```bash
# Pull the database connection from Vercel into a local .env file
npx vercel env pull .env

# Create the table from the schema
npm run db:push
```

You should see `Your database is now in sync with your Prisma schema.`

> If you don't have the Vercel CLI: `npm i -g vercel` then `vercel login`
> and `vercel link` first.

## 3. Redeploy

Push to GitHub (or click **Redeploy** in Vercel). Done — open the app,
fill a receipt, click **💾 שמור**, then open **📊 לוח בקרה** to see it.

---

## How it works

- **Save** (💾 שמור) stores the current receipt. Saving again updates the
  same record. **+ חשבונית חדשה** starts a fresh one.
- **Dashboard** lists every saved receipt with totals and monthly stats.
  **פתח** re-opens a receipt for editing/re-export; **מחק** deletes it.
- Receipts are stored as JSON plus a few indexed columns
  (`documentNumber`, `date`, `customerName`, `total`) for the dashboard.

## Changing the schema later

If you edit `prisma/schema.prisma`, re-run `npm run db:push` (with the
`.env` present) to apply the change.
