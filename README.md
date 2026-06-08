# MoonzThrift Setup and Deployment Guide

MoonzThrift is a dark luxury, vintage streetwear e-commerce platform built on Next.js 15, React 19, TypeScript, and Tailwind CSS. The design system features vertical stacked moon phases, charcoal colors (#333333 / #0c0c0c), off-white typography (#F0EFE7), and muted beige/brown accents (#B8A98F, #8B7355) over a vintage grain overlay.

---

## Local Setup

### 1. Requirements
Ensure you have Node.js 18+ (20+ recommended) and `npm` installed.

### 2. Environment Configuration
Duplicate the `.env` template to a local environment file:
```bash
cp .env.example .env
```
Ensure the variables are populated:
- `DATABASE_URL`: PostgreSQL connection string (Supabase / Railway).
- `NEXTAUTH_SECRET`: Secret hash token for authentication security.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` & `STRIPE_SECRET_KEY`: Stripe API keys.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary details.

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup (Prisma)
Configure your schema and push updates directly to your PostgreSQL database:
```bash
npx prisma generate
npx prisma db push
```

### 5. Running the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to browse.

---

## Brand Walkthrough & Features

- **Cinematic Splash Screen**: 4-second loading vertical stack of morphing moon phases revealing the gothic logo text.
- **Fluid Custom Cursor**: Desktop cursors are replaced by custom tracking circular elements that grow and color-shift dynamically over links and cards.
- **Search Panel**: Floating fullscreen search console with instant tag recommendations.
- **Shopping Bag & Wishlist**: Context state preservation allowing buyers to add/modify cart sizes, quantities, and coupon values in local memory.
- **Order Pipeline**: Integrated card number input forms mimicking Stripe's payment verification and generating receipts.
- **Operations Dashboard**: Admin metrics visualization chart displaying gross revenue trends, product listings CRUD control tables, and voucher code generation fields.

---

## Deployment Ready

### 1. Vercel (Frontend)
Initialize Vercel CLI inside the root directory:
```bash
npx vercel
```
Or import the repository directly onto the Vercel dashboard. Add all env variables under Project Settings.

### 2. Supabase / Railway (Backend Database)
1. Register a PostgreSQL database instance on Railway or Supabase.
2. Retrieve the transaction/pooling Connection String URL.
3. Configure `DATABASE_URL` in Vercel settings pointing to the database string.
4. Execute prisma commands as build pipelines to generate clients.
