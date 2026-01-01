# Structured Diary

A mobile-first structured diary application built with Next.js and Prisma. Track your daily activities across customizable categories and items, with powerful reporting and data export features.

## Features

### Calendar & Entry Management
- **Monthly calendar view** with visual indicators for days with entries
- **Daily entry list** showing all activities for the selected date
- **Full CRUD operations**: Create, edit, and delete diary entries
- **Emoji support**: Add visual flair to your diary items with emoji icons
- **Real-time sync**: Changes to categories/items immediately reflect in the calendar

### Categories & Items
- **Hierarchical organization**: Categories contain multiple items
- **Active/Inactive status**: Soft-delete pattern preserves historical data integrity
- **Cascade logic**: Deactivating a category automatically deactivates all its items
- **Drag-and-drop reordering**: Customize the display order of categories and items
- **Color coding**: Assign custom colors to categories for visual distinction
- **Dual loading strategy**:
  - Active items only for form selection
  - All items (including inactive) for displaying historical entries

### Reports & Analytics
- **Monthly summaries**: View statistics for any month
- **Pie chart visualization**: See category distribution at a glance
- **Category statistics**: Detailed breakdown with item counts and percentages
- **Recent entries preview**: Quick view of the latest 5 entries per category with item tags
- **Month filtering**: Navigate between months to analyze different time periods
- **Empty state handling**: Consistent UI even for months with no data

### Data Export
- **Excel export**: Download your entire 2026 diary as a structured spreadsheet
- **Date-level organization**: Each row represents one day
- **Category columns**: Data organized by category and item
- **Multi-entry support**: Multiple entries per day grouped in the same cell

## Tech Stack

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[Prisma](https://www.prisma.io/)** - Type-safe ORM for database operations
- **[SQLite](https://www.sqlite.org/)** - Lightweight, serverless database
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety throughout the application
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Recharts](https://recharts.org/)** - Chart library for data visualization
- **[SheetJS (xlsx)](https://sheetjs.com/)** - Excel file generation
- **[emoji-mart](https://github.com/missive/emoji-mart)** - Emoji picker component
- **[date-fns](https://date-fns.org/)** - Date utility library

## Database Schema

The application uses three main models defined in `prisma/schema.prisma`:

### Category
- `id` (String, CUID): Unique identifier
- `name` (String): Category name
- `order` (Int): Display order
- `color` (String, optional): Hex color code for visual distinction
- `isActive` (Boolean): Active status (soft delete)
- `items` (Relation): One-to-many relationship with items
- `entries` (Relation): One-to-many relationship with entries

### Item
- `id` (String, CUID): Unique identifier
- `categoryId` (String): Foreign key to category
- `name` (String): Item name
- `emoji` (String, optional): Emoji icon
- `order` (Int): Display order within category
- `isActive` (Boolean): Active status (soft delete)
- `entries` (Relation): One-to-many relationship with entries

### Entry
- `id` (String, CUID): Unique identifier
- `entryDate` (DateTime): Date of the diary entry
- `categoryId` (String): Foreign key to category
- `itemId` (String): Foreign key to item
- `content` (String): Entry content/description
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

All relationships use `onDelete: Cascade` to maintain referential integrity.

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/joy890913kk/structured-diary.git
cd structured-diary
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the project root:
```env
DATABASE_URL="file:./prisma/dev.db"
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Seed the database with initial data:
```bash
npm run seed
```
This creates three default categories:
- 工作 (Work): 專案開發, 會議, 學習
- 健康 (Health): 運動, 睡眠, 飲食
- 生活 (Life): 家務, 娛樂, 社交

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run seed` - Seed database with initial data

## Project Structure

```
structured-diary/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── categories/           # Category CRUD endpoints
│   │   │   ├── route.ts          # GET (with includeInactive), POST
│   │   │   └── [id]/route.ts     # PUT, DELETE
│   │   ├── items/                # Item CRUD endpoints
│   │   │   ├── route.ts          # POST
│   │   │   └── [id]/route.ts     # PUT, DELETE
│   │   └── entries/              # Entry CRUD endpoints
│   │       ├── route.ts          # GET (with date/month filter), POST
│   │       └── [id]/route.ts     # PUT, DELETE
│   ├── page.tsx                  # Calendar/entry management page
│   ├── reports/page.tsx          # Reports and analytics page
│   ├── settings/page.tsx         # Category/item settings page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/
│   └── TopNav.tsx                # Navigation component
├── lib/
│   ├── db.ts                     # Prisma client instance
│   ├── types.ts                  # TypeScript type definitions
│   └── date.ts                   # Date utility functions
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── seed.ts                   # Seed script
│   └── migrations/               # Database migrations
├── .env                          # Environment variables (not in repo)
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## Usage Guide

### Adding a Diary Entry

1. Navigate to the calendar page (`/`)
2. Select a date on the calendar
3. Click the **+ 記錄** button
4. Select a category and item from the dropdowns
5. Enter your diary content
6. Click **Save**

### Managing Categories and Items

1. Navigate to Settings (`/settings`)
2. To add a category:
   - Enter name in the input field
   - Click **新增 Category**
3. To add an item:
   - Enter name in the category's item input field
   - Click **新增項目**
4. To modify:
   - Edit names directly in the input fields
   - Click the emoji button to select an emoji for items
   - Use ↑/↓ buttons to reorder
   - Click status indicator (green/red dot) to activate/deactivate

### Viewing Reports

1. Navigate to Reports (`/reports`)
2. Use the month picker to select a month
3. View:
   - Category distribution pie chart
   - Detailed statistics with item breakdowns
   - Recent entries preview with item tags
4. Click **匯出 Excel** to download data

### Exporting to Excel

The Excel export generates a comprehensive spreadsheet with:
- **Header Row 1**: Category names (merged cells)
- **Header Row 2**: Item names
- **Data Rows**: One row per date in 2026
- **Cell Content**: Multiple entries separated by semicolons

## Key Features Explained

### Soft Delete Pattern

Instead of permanently deleting categories or items, the app uses an `isActive` boolean flag. This ensures:
- Historical entries remain intact with their original category/item references
- You can view past entries even after reorganizing your diary structure
- Data integrity is maintained across the entire database

When viewing entries:
- **Forms/Pickers**: Show only active categories and items
- **Historical Display**: Show all categories and items (including inactive)

### Cascade Inactive Logic

When you deactivate a category, all its items are automatically deactivated. This maintains logical consistency:
- Items can't be active if their parent category is inactive
- Prevents orphaned active items
- Simplifies data management

### Synchronization

The app ensures data consistency across pages:
- Opening the entry form fetches fresh categories from the API
- Visibility change or window focus triggers data reload
- Settings changes immediately propagate to the calendar

## Migration from localStorage

This application was originally built with localStorage and has been fully migrated to a SQLite database with Prisma ORM. The migration included:
- Complete API layer with RESTful endpoints
- Database schema design with proper relationships
- Data persistence and query optimization
- Month-based filtering for efficient data loading

## Future Enhancements

Potential improvements for future versions:
- **User authentication**: Multi-user support with login/registration
- **Cloud sync**: Deploy to Vercel with Supabase PostgreSQL
- **Mobile app**: Native iOS/Android apps
- **Advanced filtering**: Search entries by keyword, date range, or category
- **Data backup**: Automated backup and restore functionality
- **Rich text editing**: Enhanced content editor with formatting
- **Attachments**: Support for images and files in entries
- **Reminders**: Notification system for regular diary entries
- **Templates**: Pre-defined templates for common entry types
- **Dark/Light mode**: Theme switcher

## Switching to Supabase (PostgreSQL)

To migrate from SQLite to Supabase:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `.env` with Supabase connection string:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

3. Run migrations:
```bash
npm run prisma:migrate
```

4. Deploy to Vercel or your preferred hosting platform

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- UI design inspired by minimalist accounting applications
- Built with modern React and Next.js best practices
- Database architecture follows soft-delete and cascade patterns

---

**Repository**: https://github.com/joy890913kk/structured-diary

**Author**: Jennifer Hsu

**Last Updated**: January 2026
