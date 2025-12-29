# Structured Diary

Mobile-first structured diary MVP built with Next.js + Prisma (SQLite). The UI references a minimalist accounting app: dark theme, calendar/list toggle, plus button to add entries, and picker-based forms.

## Architecture
- **Next.js App Router** for pages/routes (`/`, `/reports`, `/settings`).
- **SQLite + Prisma** for local persistence and easy deploy.
- **Client fetch + API routes** for CRUD operations.
- **Recharts** for report charts.
- **SheetJS (xlsx)** for Excel export.

## Data Schema
Prisma models are defined in `prisma/schema.prisma`.

- **Category**: `id`, `name`, `order`, `color`, `isActive`
- **Item**: `id`, `categoryId`, `name`, `order`, `isActive`
- **Entry**: `id`, `entryDate`, `categoryId`, `itemId`, `content`, `createdAt`, `updatedAt`

## Routes
- `/` Calendar + daily list (Calendar/List toggle)
- `/reports` Monthly summary + pie chart + Excel export
- `/settings` Manage categories and items

## Local Development

### 1) Install dependencies
```bash
npm install
```

### 2) Configure database
Create `.env` in the project root:
```
DATABASE_URL="file:./prisma/dev.db"
```

### 3) Run migrations + seed
```bash
npm run prisma:migrate
npm run seed
```

### 4) Start dev server
```bash
npm run dev
```
Open http://localhost:3000.

## Excel Export
On `/reports`, click **匯出 Excel**. The file includes:
1. **Event Log** (long table)
2. **Structured Diary Grid** (date rows, category columns, cell content joined by newlines)

## Notes (Supabase)
If you want to switch to Supabase later:
1. Replace the Prisma datasource with `provider = "postgresql"`.
2. Set `DATABASE_URL` to the Supabase connection string.
3. Re-run migrations and update any auth integration.
