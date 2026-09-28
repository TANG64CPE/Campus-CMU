# CampusMart (CMU Campus Marketplace) 

> ระบบเว็บแอปพลิเคชันตลาดนัดออนไลน์สำหรับนักศึกษามหาวิทยาลัยเชียงใหม่ (CMU) สำหรับซื้อขายสินค้ามือสอง เช่น หนังสือเรียน อุปกรณ์ IT และบอร์ดไมโครคอนโทรลเลอร์ ระบบออกแบบมาให้เหมาะกับการซื้อขายภายในมหาวิทยาลัย โดยเน้นการนัดรับสินค้าในพื้นที่มหาวิทยาลัยและชำระเงินกันโดยตรง ณ จุดนัดรับ โดยไม่มีการตัดบัตรเครดิตหรือการชำระเงินออนไลน์ โปรเจกต์นี้ออกแบบให้สามารถทำงานได้ใน 100% Local Environment โดยไม่จำเป็นต้องพึ่งพา Cloud Service สำหรับการทำงานหลักของระบบ

---

##  Tech Stack & Infrastructure

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS (v3.4, Mobile-First UI) + Lucide Icons
- **Backend:** Node.js + Express.js + TypeScript
- **Database & ORM:** PostgreSQL 16 + Prisma ORM
- **Authentication:** CMU OAuth 2.0 API (`oauth.cmu.ac.th`) + JWT + HTTP-Only Cookies (+ Local Dev Mock Auth)
- **Local Storage:** `multer` สำหรับอัปโหลดและจัดเก็บรูปภาพในเครื่องเซิร์ฟเวอร์ (`backend/uploads/`)
- **Testing:** Vitest (Unit / Integration Tests) + Playwright (E2E Testing)
- **Infrastructure:** Docker & Docker Compose + Nginx (Reverse Proxy)

---

##  Database Structure (Prisma Schema)

```prisma
model User {
  id           String        @id @default(uuid())
  studentId    String        @unique
  email        String        @unique
  name         String
  contactInfo  String?       // Line ID, เบอร์โทร (เปิดเผยเมื่อมีคนกดจอง)
  isBanned     Boolean       @default(false)
  createdAt    DateTime      @default(now())
  products     Product[]
  reservations Reservation[]
}

model Product {
  id             String        @id @default(uuid())
  title          String
  price          Float
  imageUrl       String?       // Local Path: /uploads/...
  meetupLocation String        // จุดนัดรับใน มช. (เช่น หอสมุดกลาง, ตึก 30 ปี วิศวะ)
  isAvailable    Boolean       @default(true)
  sellerId       String
  seller         User          @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  createdAt      DateTime      @default(now())
  reservations   Reservation[]
}

model Reservation {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  buyerId   String
  buyer     User     @relation(fields: [buyerId], references: [id], onDelete: Cascade)
  status    String   @default("PENDING") // PENDING, COMPLETED, CANCELLED
  createdAt DateTime @default(now())
}
```

---

##  Core Features & Business Logic

### 1. Authentication (CMU OAuth + JWT)
- **Login Flow:** Frontend มีปุ่ม **"Login with CMU Account"** เพียงปุ่มเดียว ยิงไปที่ Backend `GET /api/auth/cmu`
- Backend ทำการ Redirect ไปที่ `https://oauth.cmu.ac.th/v1/Authorize.aspx`
- รับ Callback Code ที่ `GET /api/auth/cmu/callback` แลก Access Token และดึงข้อมูลนักศึกษาจาก `misapi.cmu.ac.th`
- ระบบตรวจสอบ `studentId` และ `email` ในตาราง `User` (ถ้าไม่มีจะสร้างบัญชีใหม่อัตโนมัติ)
- สร้าง JWT แนบกลับไปที่ Frontend ผ่าน **HTTP-Only Cookie** ปลอดภัยสูงสุด
- **Local Dev Mock Login:** รองรับการจำลองล็อกอินเป็นนักศึกษาทดสอบได้ทันทีในเครื่องโดยไม่ต้องรอเชื่อมต่อ Intranet มช.

### 2. Product Listing & Local Image Upload
- `POST /api/products`: อัปโหลดรูปภาพผ่าน Middleware `multer` เก็บไฟล์ใน `/uploads` และบันทึก Relative Path
- `GET /api/products`: รองรับ Search Keyword และ Filter สินค้า `isAvailable = true`

### 3. Reserve & Reveal (ระบบจองและเปิดข้อมูลติดต่อ)
- ผู้ซื้อกดปุ่ม **"กดจองสินค้า (Reserve Product)"**
- Backend ใช้ **Prisma `$transaction`** เพื่ออัปเดต `Product.isAvailable = false` และสร้าง `Reservation` พร้อมกันแบบ Atomic ป้องกัน Race Condition
- **Reveal Contact:** เมื่อจองสำเร็จ ระบบจะเปิดเผย `seller.contactInfo` (Line ID / โทรศัพท์ / อีเมล มช.) ให้เฉพาะผู้ซื้อรายนั้นเห็นเพื่อติดต่อนัดรับสินค้า

### 4. Cancellation Windows & Anti-Ghosting (กฎเรื่องเวลา)
- **3-Hour Buyer Cancel:** ผู้ซื้อสามารถกดยกเลิกการจองได้เอง หากเวลาผ่านไปไม่เกิน 3 ชั่วโมง (`now - createdAt < 3h`)
- **After 3 Hours:** ซ่อนปุ่มยกเลิก และแสดงข้อความเตือนให้ติดต่อผู้ขายโดยตรง
- **24-Hour Auto-Cancel:** มี Cron Job (`node-cron`) สแกนทุก 1 ชั่วโมง หากการจองอยู่ในสถานะ `PENDING` เกิน 24 ชั่วโมง ระบบจะยกเลิกอัตโนมัติ และคืนสถานะสินค้าเป็น `isAvailable = true`
- **Anti-Ghosting Report:** ผู้ขายสามารถกดยืนยันว่า **"โดนเท / ไม่มาตามนัด"** ระบบจะยกเลิกการจอง คืนสถานะสินค้า และตั้งค่า `buyer.isBanned = true` ทันที

---

##  วิธีการรันโปรเจกต์ (Quick Start)

### วิธีที่ 1: รันด้วย Docker Compose (แนะนำสำหรับ Production / Full Local)

```bash
# รันทุก Services พร้อมกัน (PostgreSQL + Backend + Frontend + Nginx)
docker compose up --build
```
- Frontend เข้าใช้งานได้ที่: `http://localhost`
- Backend API: `http://localhost:5000/api`

---

### วิธีที่ 2: รันแยกแบบ Local Development

#### 1. เริ่มต้นฐานข้อมูล PostgreSQL
```bash
docker run -d --name campusmart-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=campusmart -p 5432:5432 postgres:16-alpine
```

#### 2. รัน Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts   # ใส่ข้อมูลทดสอบนักศึกษา มช. 3 คน และสินค้าตัวอย่าง
npm run dev              # เซิร์ฟเวอร์ทำงานที่ http://localhost:5000
```

#### 3. รัน Frontend
```bash
cd frontend
npm install
npm run dev              # เปิดแอปที่ http://localhost:5173
```

---

##  การทดสอบ (Testing)

### 1. Unit & Integration Tests (Vitest)
ใช้ Vitest สำหรับทดสอบ Business Logic ที่สำคัญ เช่น

กฎการยกเลิกภายใน 3 ชั่วโมง
การยกเลิกอัตโนมัติหลัง 24 ชั่วโมง
การจัดการกรณีผู้ซื้อไม่มาตามนัด
การระงับบัญชีผู้ซื้อ

สามารถรัน Test ได้ด้วย
```bash
cd backend
npm test
```

### 2. End-to-End Tests (Playwright)
```bash
cd frontend
npx playwright test
```

---

##  โครงสร้างโปรเจกต์ (Project Structure)

```text
Project Campus/
├── backend/
│   ├── src/
│   │   ├── config/env.ts              # จัดการ Environment Variables
│   │   ├── controllers/               # Auth, Product, Reservation, User Controllers
│   │   ├── middlewares/              # JWT Auth, Multer Image Upload, Error Handler
│   │   ├── routes/                    # API Route Definitions
│   │   ├── services/                  # CMU OAuth 2.0 & Cron Job Auto-Cancel
│   │   ├── lib/prisma.ts              # Prisma Client Singleton
│   │   ├── app.ts                     # Express App Setup
│   │   └── server.ts                  # Server Entrypoint
│   ├── prisma/
│   │   ├── schema.prisma              # Database Schema
│   │   └── seed.ts                    # Seed Data (CMU Students & Products)
│   ├── tests/
│   │   └── reservation_rules.test.ts # Vitest Suite
│   └── uploads/                       # Local Image Storage
├── frontend/
│   ├── src/
│   │   ├── components/                # Navbar, ProductCard
│   │   ├── context/AuthContext.tsx    # Auth State Provider
│   │   ├── pages/                     # LoginPage, MarketplacePage, ProductDetailPage, CreateProductPage, ProfilePage
│   │   ├── services/api.ts            # Axios Client with Cookies
│   │   └── types/index.ts             # TypeScript Models
│   ├── e2e/                           # Playwright E2E Specs
│   ├── tailwind.config.js             # CMU Signature Purple Theme Config
│   └── vite.config.ts
├── nginx/
│   └── default.conf                   # Nginx Reverse Proxy Config
├── docker-compose.yml
└── package.json
```
