# CampusMart (CMU Campus Marketplace)

> ระบบเว็บแอปพลิเคชันตลาดนัดออนไลน์สำหรับนักศึกษามหาวิทยาลัยเชียงใหม่ (CMU) สำหรับซื้อขายสินค้ามือสอง เช่น หนังสือเรียน อุปกรณ์อิเล็กทรอนิกส์/บอร์ดไมโครคอนโทรลเลอร์ เครื่องแต่งกาย และของใช้ในหอพัก ออกแบบมาสำหรับการนัดรับและชำระเงินโดยตรงในพื้นที่มหาวิทยาลัยเชียงใหม่ (Face-to-face Handover & Direct Cash/Transfer) พร้อมระบบจัดการหลังบ้าน (Admin System) และดีไซน์ระดับพรีเมียมตามมาตรฐาน **ClickUp Design System** รองรับฟอนต์ภาษาไทย **Kanit**

---

## Design System & Typography

ระบบออกแบบส่วนติดต่อผู้ใช้ (Frontend UI/UX) อ้างอิงตาม [design.md](file:///c:/Users/exitt/Documents/Project%20Campus/design.md) โดยถ่ายทอดอัตลักษณ์ของ **ClickUp Design System**:

- **Brand Voltage:** ใช้สีม่วงนีออนเอกลักษณ์ `#7612fa` ร่วมกับ **Gradient-as-brand CTA** มุม 263° (`#fa12e3` → `#7612fa` → `#12d0fa`)
- **Graphite over True Black:** ใช้สีตัวอักษรและเส้นขอบ `#292d34` แทนสีดำสนิท เพื่อให้อ่านง่าย สบายตาบนพื้นหลังสีขาว `#ffffff`
- **Typography Stack:**
  - **Headlines / Display:** `Plus Jakarta Sans` (Font weight 600–700 พร้อม Tracking แน่น)
  - **Body / Controls:** `Inter` (Font weight 400–600)
  - **Thai Typography:** `Kanit` (รองรับการแสดงผลภาษาไทยทุกระดับอย่างสวยงามลงตัว)
  - **Eyebrows / Badges:** `Sometype Mono` ตัวพิมพ์ใหญ่สำหรับหัวข้อกำกับ
- **Geometry & Tokens:** ปุ่มทรง Dark Pill 20px, Feature Card 14px, Section Panel 25px–35px, และ Transition Cubic-Bezier `(0.5, 0, 0.5, 1)` สไตล์ ClickUp ที่ลื่นไหล

---

## Tech Stack & Infrastructure

- **Frontend:**
  - React 18 + TypeScript + Vite
  - Tailwind CSS (v3.4) ปรับแต่ง Token สีและขนาดอักษรตาม ClickUp Design System
  - Lucide React Icons
  - Google Fonts (`Plus Jakarta Sans`, `Inter`, `Kanit`, `Sometype Mono`)
- **Backend:**
  - Node.js + Express.js + TypeScript
  - Prisma ORM (PostgreSQL 16)
  - Multer (Local Disk Image Storage ใน `backend/uploads/`)
  - Node-Cron (ระบบ Background Job สำหรับยกเลิกการจองอัตโนมัติ)
- **Authentication & Security:**
  - CPE CMU OAuth 2.0 (`https://oauth497.cpecmu.com`)
  - JWT Authentication ผ่าน **HTTP-Only Cookies** (ป้องกัน XSS)
  - Local Dev Mock Authentication (พร้อมปุ่มสลับ Persona นักศึกษาและ Admin ทันที)
  - Role-Based Access Control Middleware (`requireAdmin`)
- **Testing & Quality Assurance:**
  - Vitest (Unit & Business Rules Integration Testing)
  - Playwright (End-to-End Testing)
- **DevOps & Containerization:**
  - Docker & Docker Compose (Multi-container setup: PostgreSQL + Backend + Frontend + Nginx)
  - Nginx (Reverse Proxy)

---

## Database Structure (Prisma Schema)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

model User {
  id           String        @id @default(uuid())
  studentId    String        @unique
  email        String        @unique
  name         String
  contactInfo  String?       // Line ID, เบอร์โทร (เปิดเผยเมื่อมีคนกดจอง)
  role         String        @default("STUDENT") // "STUDENT" | "ADMIN"
  isBanned     Boolean       @default(false)
  createdAt    DateTime      @default(now())
  products     Product[]
  reservations Reservation[]
}

model Product {
  id             String        @id @default(uuid())
  title          String
  price          Float
  imageUrl       String?       // เก็บ Path รูปภาพในเครื่อง (/uploads/...)
  meetupLocation String        // จุดนัดรับใน มช. (เช่น หอสมุดกลาง, ตึก 30 ปี วิศวะ, ลานสัก)
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

## Core Features & Business Logic

### 1. การยืนยันตัวตน (CPE CMU OAuth & Local Mock)
- **CPE OAuth 2.0:** ล็อกอินผ่านระบบกลาง CMU OAuth (`oauth497.cpecmu.com`) ด้วย Scope `openid profile email basic_info`
- **Session Security:** ข้อมูลล็อกอินถูกส่งกลับเป็น JWT แนบใน **HTTP-Only Cookie**
- **Offline / Local Mock Auth:** สำหรับการพัฒนาโดยไม่ต้องเชื่อมต่อระบบจริง มี Mock Accounts สำเร็จรูป:
  - **สมชาย เชียงใหม่ (CPE)** — ฝั่งผู้ขาย มีรายการบอร์ด ESP32 และหนังสือแคลคูลัส
  - **อภิญญา ภูพิงค์ (CS)** — ฝั่งผู้ขาย มี Apple Pencil และหนังสือฟิสิกส์
  - **ธนากร ดอยสุเทพ (Arch)** — มีคีย์บอร์ด Logitech
  - **อาจารย์ ผู้ดูแลระบบ (Admin CPE)** — สิทธิ์ Admin (`ADMIN001`) สำหรับจัดการระบบ

### 2. การลงขายสินค้าและจัดเก็บรูปภาพ (Product Listing)
- ผู้ขายสามารถลงรายการสินค้า ระบุราคา จุดนัดรับในมหาวิทยาลัย และอัปโหลดภาพถ่ายจริง
- รูปภาพจัดเก็บลงฮาร์ดดิสก์เครื่องเซิร์ฟเวอร์ (`backend/uploads/`) ผ่าน `multer` โดยตรง (ไม่ต้องพึ่งพา Cloud Storage)
- ระบบค้นหาแบบเรียลไทม์ พร้อมตัวกรองตามสถานะสินค้า

### 3. ระบบจองสินค้าและเปิดเผยข้อมูลติดต่อ (Reserve & Reveal)
- **Atomic Transaction:** เมื่อผู้ซื้อกดปุ่ม **"กดจองสินค้า (Reserve Product)"** ระบบจะใช้ Prisma `$transaction` อัปเดต `Product.isAvailable = false` และสร้าง `Reservation` พร้อมกันเพื่อป้องกันการจองซ้ำ (Race Condition)
- **Safe Reveal:** ข้อมูลช่องทางติดต่อของผู้ขาย (Line ID, เบอร์โทรศัพท์) จะถูกเปิดเผยให้เห็นเฉพาะผู้ซื้อที่ทำการจองสำเร็จเท่านั้น เพื่อใช้นัดหมายจุดรับของ

### 4. กฎการยกเลิกและการป้องกันการเทนัด (Cancellation & Anti-Ghosting)
- **3-Hour Buyer Cancel:** ผู้ซื้อสามารถกดยกเลิกการจองได้เองภายใน 3 ชั่วโมงแรกหลังจากกดจอง
- **24-Hour Auto-Cancel:** มี Background Cron Job ตรวจสอบทุกชั่วโมง หากการจองค้างสถานะ `PENDING` เกิน 24 ชั่วโมง ระบบจะยกเลิกอัตโนมัติและคืนสถานะสินค้ากลับมาวางขายใหม่อีกครั้ง
- **Anti-Ghosting Report:** หากผู้ซื้อไม่มาตามนัดหมาย ผู้ขายสามารถกดปุ่ม **"รายงานผู้ซื้อไม่มาตามนัด (Report Ghosting)"** ระบบจะยกเลิกการจอง คืนสถานะสินค้า และตั้งค่าระงับบัญชีผู้ซื้อ (`isBanned = true`) ทันที

### 5. ระบบผู้ดูแลระบบ (Admin Management System)
- **Role-based Access Control:** สิทธิ์ `ADMIN` ได้รับการป้องกันผ่าน `requireAdmin` middleware
- **Dashboard KPI Metrics:** ดูสถิติรวมของระบบ เช่น จำนวนผู้ใช้ทั้งหมด, จำนวนผู้ขาย (Sellers), จำนวนผู้ซื้อ (Buyers), สินค้าที่ลงขาย, การจอง, และดีลที่ปิดสำเร็จ
- **User Management & Filters:** ค้นหาบัญชีผู้ใช้ตามชื่อ อีเมล หรือรหัสนักศึกษา กรองตาม Role, สถานะการใช้งาน (Active / Banned), และกิจกรรม (ผู้ขาย / ผู้ซื้อ)
- **Deep Inspection Drawer (ตรวจสอบประวัติสองฝั่ง):**
  - **ฝั่งผู้ขาย (Seller Side):** ตรวจสอบรายการสินค้าทั้งหมดที่ผู้ใช้คนนี้เคยลงขาย พร้อมราคา สถานะ และประวัติ
  - **ฝั่งผู้ซื้อ (Buyer Side):** ตรวจสอบประวัติการกดจองสินค้าทั้งหมด สถานะดีล และข้อมูลผู้ขายที่นัดรับ
- **Admin Moderation Actions:**
  - สลับสถานะระงับบัญชี (Ban / Unban) ทันที
  - เลื่อนขั้นหรือปรับบทบาทผู้ใช้ระหว่าง `STUDENT` ↔ `ADMIN`

---

## API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/login` หรือ `/cmu` | Redirect ผู้ใช้ไปยังหน้า CPE CMU OAuth |
| `GET` | `/api/auth/callback` | Callback รับ Code แลก Token และสร้างเซสชัน JWT Cookie |
| `POST` | `/api/auth/mock-login` | จำลองล็อกอินสำหรับ Local Testing (ระบุ studentId, role ได้) |
| `GET` | `/api/auth/me` | ดึงข้อมูลโปรไฟล์ของผู้ใช้ปัจจุบันที่ล็อกอินอยู่ |
| `POST` | `/api/auth/logout` | ล้าง Cookie เซสชันและออกจากระบบ |

### Products (`/api/products`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | ดึงรายการสินค้าทั้งหมด (รองรับ Query `search`) |
| `GET` | `/api/products/:id` | ดึงรายละเอียดสินค้า พร้อมข้อมูลผู้ขาย |
| `POST` | `/api/products` | ลงประกาศขายสินค้าใหม่ (แนบไฟล์รูปภาพ `image`) *(Auth Required)* |
| `DELETE` | `/api/products/:id` | ลบประกาศขายสินค้า *(เฉพาะเจ้าของสินค้า)* |

### Reservations (`/api/reservations`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/reservations` | กดจองสินค้า (สร้าง Reservation & ล็อกสถานะสินค้า) |
| `POST` | `/api/reservations/:id/cancel` | ยกเลิกการจองสินค้า (ภายในเงื่อนไขเวลา) |
| `POST` | `/api/reservations/:id/complete` | ยืนยันการรับสินค้าและชำระเงินสำเร็จ |
| `POST` | `/api/reservations/:id/report-ghost` | รายงานผู้ซื้อเทนัด คืนสถานะสินค้า และแบนผู้ซื้อ |
| `GET` | `/api/reservations/my` | รายการสินค้าที่ตัวเราเป็นผู้กดจอง |
| `GET` | `/api/reservations/seller` | รายการจองสินค้าที่เข้ามายังสินค้าที่เราลงขาย |

### User Profile (`/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/profile` | ดึงข้อมูลโปรไฟล์และช่องทางติดต่อ |
| `PATCH` | `/api/users/profile` | แก้ไขข้อมูลการติดต่อ (เช่น Line ID, เบอร์โทรศัพท์) |
| `GET` | `/api/users/my-products` | รายการสินค้าทั้งหมดที่เราเป็นผู้ลงขาย |
| `PATCH` | `/api/users/products/:id/toggle-status` | สลับสถานะสินค้า วางขาย ↔ ปิดรับการจอง |

### Admin System (`/api/admin`) *(เฉพาะบทบาท ADMIN)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | สรุปภาพรวมสถิติทั้งระบบ (ผู้ใช้, ผู้ขาย, ผู้ซื้อ, สินค้า, การจอง) |
| `GET` | `/api/admin/users` | รายชื่อผู้ใช้ทั้งหมด รองรับ Search, Role, Status, Activity filter |
| `GET` | `/api/admin/users/:id` | เจาะลึกประวัติของผู้ใช้ ดูรายการที่ขาย และรายการที่กดจองทั้งหมด |
| `PATCH` | `/api/admin/users/:id/ban` | สลับสถานะระงับการใช้งานบัญชี (Ban / Unban) |
| `PATCH` | `/api/admin/users/:id/role` | ปรับเปลี่ยนระดับสิทธิ์ (`STUDENT` / `ADMIN`) |

---

## วิธีการรันโปรเจกต์ (Quick Start)

### วิธีที่ 1: รันด้วย Docker Compose (แนะนำสำหรับการทดสอบครบวงจร)

```bash
# รันทุก Services พร้อมกัน (PostgreSQL + Backend + Frontend + Nginx)
docker compose up --build
```
- **Frontend เข้าใช้งานได้ที่:** `http://localhost`
- **Backend API:** `http://localhost:5000/api`

---

### วิธีที่ 2: รันแยกแบบ Local Development

#### 1. เริ่มต้นฐานข้อมูล PostgreSQL ผ่าน Docker
```bash
docker run -d --name campusmart-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=campusmart -p 5432:5432 postgres:16-alpine
```

#### 2. ตั้งค่าและรัน Backend
```bash
cd backend
npm install

# สร้างตารางในฐานข้อมูล
npx prisma generate
npx prisma db push

# ใส่ข้อมูลจำลองเริ่มต้น (นักศึกษา มช. 3 คน, สินค้า 5 รายการ, ตัวอย่างการจอง)
npx tsx prisma/seed.ts

# รัน Backend เซิร์ฟเวอร์ (พอร์ต 5000)
npm run dev
```

#### 3. ตั้งค่าและรัน Frontend
```bash
cd frontend
npm install

# รัน Frontend พัฒนา (พอร์ต 5173)
npm run dev
```
เปิดบราวเซอร์ไปที่: `http://localhost:5173`

> **การเข้าใช้งานสิทธิ์ Admin เพื่อทดสอบ:**
> 1. ไปที่หน้าเข้าสู่ระบบ (`/login`)
> 2. ในกล่อง **"โหมดทดสอบสำหรับนักพัฒนา (Developer Sandbox)"**
> 3. คลิกเลือก **"อาจารย์ ผู้ดูแลระบบ (Admin CPE)"** หรือกรอกรหัส `ADMIN001`
> 4. แถบเมนูด้านบนจะปรากฏปุ่ม **"ระบบแอดมิน (Admin)"** สีม่วงนีออนทันที

---

## การทดสอบ (Testing)

### 1. ทดสอบ Business Logic (Vitest)
ครอบคลุมการทดสอบกฎเวลา 3 ชั่วโมง, การคืนสถานะสินค้าเมื่อยกเลิก, และการแบนผู้ซื้อเมื่อโดนเทนัด
```bash
cd backend
npm test
```

### 2. ทดสอบ End-to-End Flows (Playwright)
```bash
cd frontend
npx playwright test
```

---

## โครงสร้างโปรเจกต์ (Project Structure)

```text
Project Campus/
├── design.md                          # ClickUp Design System Specification
├── backend/
│   ├── src/
│   │   ├── config/env.ts              # จัดการ Environment Variables
│   │   ├── controllers/               # Auth, Product, Reservation, User, Admin Controllers
│   │   ├── middlewares/              # JWT Auth, requireAdmin, Multer Upload, Error Handler
│   │   ├── routes/                    # auth, product, reservation, user, admin routes
│   │   ├── services/                  # CPE OAuth 2.0 Client & Cron Auto-Cancel Job
│   │   ├── lib/prisma.ts              # Prisma Client Singleton
│   │   ├── app.ts                     # Express App Initialization
│   │   └── server.ts                  # Server Entrypoint
│   ├── prisma/
│   │   ├── schema.prisma              # Database Schema (User, Product, Reservation)
│   │   └── seed.ts                    # Seed Data (Mock CMU Students & Sample Products)
│   ├── tests/
│   │   └── reservation_rules.test.ts # Vitest Test Suite
│   └── uploads/                       # ที่จัดเก็บรูปภาพสินค้าในเครื่อง
├── frontend/
│   ├── src/
│   │   ├── components/                # Navbar (ClickUp Nav), ProductCard (14px Feature Card)
│   │   ├── context/AuthContext.tsx    # Auth State, Login, Logout, Role State
│   │   ├── pages/
│   │   │   ├── MarketplacePage.tsx    # หน้าตลาดนัด ค้นหาสินค้า และแท็กหมวดหมู่
│   │   │   ├── ProductDetailPage.tsx  # หน้ารายละเอียดสินค้าและการจอง (Reveal Contact)
│   │   │   ├── CreateProductPage.tsx  # หน้าลงประกาศขายสินค้าพร้อมอัปโหลดรูป
│   │   │   ├── ProfilePage.tsx        # ข้อมูลส่วนตัว สินค้าที่ลงขาย และสินค้าที่กดจอง
│   │   │   ├── LoginPage.tsx          # หน้าล็อกอิน CMU OAuth และ Dev Sandbox
│   │   │   └── AdminPage.tsx          # หน้าแดชบอร์ดแอดมิน ตรวจสอบผู้ซื้อ/ผู้ขาย & จัดการสิทธิ์
│   │   ├── services/api.ts            # Axios Client เชื่อมต่อ Backend พร้อม Cookies
│   │   ├── types/index.ts             # TypeScript Interfaces & Models
│   │   ├── index.css                  # ClickUp Design System Tokens & Utility Classes
│   │   └── App.tsx
│   ├── e2e/                           # Playwright E2E Tests
│   ├── tailwind.config.js             # ClickUp Color Palette, Typography & Radius Scale
│   └── vite.config.ts
├── nginx/
│   └── default.conf                   # Nginx Reverse Proxy Config
├── docker-compose.yml
└── package.json
```
