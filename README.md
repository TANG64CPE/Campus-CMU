# CampusMart (CMU Campus Marketplace)

> ระบบเว็บแอปพลิเคชันตลาดนัดออนไลน์สำหรับนักศึกษามหาวิทยาลัยเชียงใหม่ (CMU) สำหรับซื้อขายสินค้ามือสอง เช่น หนังสือเรียน อุปกรณ์อิเล็กทรอนิกส์/บอร์ดไมโครคอนโทรลเลอร์ เครื่องแต่งกาย และของใช้ในหอพัก ออกแบบมาสำหรับการนัดรับและชำระเงินโดยตรงในพื้นที่มหาวิทยาลัยเชียงใหม่ (Face-to-face Handover & Direct Cash/Transfer) พร้อมระบบจัดการหลังบ้าน (Admin System) และหน้าตาแบบ **Uber-inspired monochrome** ที่เรียบง่าย ใช้ขาวดำเป็นหลัก ใช้ฟอนต์ **Google Sans** พร้อม **Kanit** เป็น fallback สำหรับภาษาไทย

---

## Design System & Typography

หน้าตาเว็บใช้แนวทางจาก `uber.design.md` มาปรับให้เหมาะกับ CampusMart ตาม [design.md](design.md):

- **สี:** ขาว `#ffffff` และดำ `#000000` เป็นสีหลัก; เทากลาง `#5e5e5e` และพื้นหลังอ่อน `#efefef` ใช้จัดลำดับเนื้อหา
- **ตัวอักษร:** `Google Sans` สำหรับหัวเรื่องและส่วนควบคุม พร้อม `Kanit` เป็น fallback สำหรับภาษาไทย
- **รูปทรง:** ปุ่มและตัวกรองทรง pill (`999px`); การ์ดและแผงเนื้อหาใช้มุมโค้ง `16px`
- **พื้นผิว:** ใช้เส้นแบ่งบาง เงาให้น้อย และแถบพื้นดำสลับพื้นขาวเพื่อเน้นข้อมูลสำคัญ โดยไม่มีสีไล่ระดับ

---

## Tech Stack & Infrastructure

- **Frontend:**
  - React 18 + TypeScript + Vite
  - Tailwind CSS (v3.4) ปรับแต่ง Token แบบขาวดำตาม Uber-inspired design
  - Lucide React Icons
  - Google Fonts (`Google Sans`, `Kanit`)
- **Backend:**
  - Node.js + Express.js + TypeScript
  - Prisma ORM (PostgreSQL 16)
  - Multer (Local Disk Image Storage ใน `backend/uploads/`)
  - Node-Cron (ระบบ Background Job สำหรับยกเลิกการจองอัตโนมัติ)
- **Authentication & Security:**
  - CPE CMU OAuth 2.0 (`https://oauth497.cpecmu.com`)
  - JWT Authentication ผ่าน **HTTP-Only Cookies** (ช่วยป้องกัน JavaScript อ่าน session cookie; ไม่ได้ป้องกัน XSS ทุกกรณี)
  - Local Dev Mock Authentication (พร้อมปุ่มสลับ Persona นักศึกษาและ Admin ทันที)
  - Role-Based Access Control Middleware (`requireAdmin`) และ Middleware จำกัดบัญชีที่ถูกแบน
- **Testing & Quality Assurance:**
  - Vitest (Unit tests สำหรับ business rules)
  - Playwright (End-to-End Testing)
- **DevOps & Containerization:**
  - Docker & Docker Compose (Multi-container setup: PostgreSQL + Backend + Frontend + Nginx)
  - Nginx (Reverse Proxy)

---

## Database Structure (Prisma Schema)

ใช้ PostgreSQL ผ่าน Prisma โดย schema หลักประกอบด้วย `User`, `Product`, `Reservation`, `ChatMessage`, `SupportConversation` และ `SupportMessage`:

- `Product.category` เป็น nullable เพื่อรองรับสินค้าเดิม และรายการสินค้ามี `imageUrl` กับ `imageUrls`
- `SupportConversation.isResolved` ใช้แยกบทสนทนาที่ Admin ทำเครื่องหมายว่าแก้ไขแล้ว โดยยังเก็บประวัติข้อความไว้
- รายละเอียด field และ relation ที่เป็นแหล่งข้อมูลจริงอยู่ใน [backend/prisma/schema.prisma](backend/prisma/schema.prisma)

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

### 2. นโยบายบังคับกรอกข้อมูลติดต่อก่อนใช้งาน (Mandatory Contact Policy) 📞
- **กฎการบังคับเมื่อเข้าใช้งานครั้งแรก:** ผู้ใช้งานจะไม่สามารถกดจอง (`Reserve`) หรือลงขายสินค้า (`List Product`) ได้ หากยังไม่ได้ระบุข้อมูลติดต่อในหน้าโปรไฟล์ให้ครบถ้วน
- **เงื่อนไขฟิลด์ข้อมูลติดต่อ:**
  - 📞 **เบอร์โทรติดต่อ (*จำเป็นต้องมี):** เพื่อโทรประสานงานนัดหมายหน้างาน
  - 💬 **ช่องทางโซเชียลมีเดีย (*จำเป็นต้องมีอย่างน้อย 1 ช่อง):** เลือกกรอก **Line ID**, **Facebook**, หรือ **Instagram** อย่างน้อย 1 ช่องทาง
  - 📍 **ข้อมูลทั่วไป / จุดนัดพบที่สะดวก:** สามารถพิมพ์ระบุสถานที่หรือจุดนัดพบที่สะดวกเจอบนพื้นที่มหาวิทยาลัยเชียงใหม่ (เช่น หน้าตึก 30 ปี, หอสมุดกลาง, โรงอาหาร)
- **การป้องกันสองระดับ (Two-tier Enforcement):**
  - **Frontend UI:** แสดงแถบเตือน (Warning Banner) แจ้งเตือนทันที และบล็อกการกดปุ่มจอง/ลงขาย พร้อมปุ่มนำทางไปยังหน้าโปรไฟล์
  - **Backend API:** Controllers (`ProductController.createProduct` และ `ReservationController.createReservation`) จะตรวจสอบความสมบูรณ์ของข้อมูลผู้ใช้ หากไม่ครบจะปฏิเสธด้วย HTTP `403 Forbidden` ป้องกันการ Bypass Request

### 3. การลงขายสินค้าและจัดเก็บรูปภาพ (Product Listing)
- ผู้ขายสามารถเลือกหมวดหมู่สินค้า (ฮาร์ดแวร์ & IT, หนังสือเรียน & เอกสาร, เครื่องเขียน & สถาปัตย์, ของใช้หอพัก หรืออื่นๆ) ระบุราคา จุดนัดรับในมหาวิทยาลัย และอัปโหลดภาพถ่ายจริง
- รูปภาพจัดเก็บลงฮาร์ดดิสก์เครื่องเซิร์ฟเวอร์ (`backend/uploads/`) ผ่าน `multer` โดยตรง (ไม่ต้องพึ่งพา Cloud Storage)
- ระบบค้นหาแบบเรียลไทม์ พร้อมตัวกรองตามสถานะสินค้า

### 4. ระบบจองสินค้าและเปิดเผยข้อมูลติดต่อ (Reserve & Reveal)
- **Atomic Transaction:** เมื่อผู้ซื้อกดปุ่ม **"กดจองสินค้า (Reserve Product)"** ระบบจะใช้ Prisma `$transaction` อัปเดต `Product.isAvailable = false` และสร้าง `Reservation` พร้อมกันเพื่อป้องกันการจองซ้ำ (Race Condition)
- **Safe Reveal:** ข้อมูลช่องทางติดต่อของผู้ขาย (เบอร์โทรศัพท์, Line ID, Facebook, Instagram, จุดนัดพบที่สะดวก) จะถูกเปิดเผยให้เห็นเฉพาะผู้ซื้อที่ทำการจองสำเร็จเท่านั้น เพื่อใช้นัดหมายจุดรับของ

### 5. กฎการยกเลิกและการป้องกันการเทนัด (Cancellation & Anti-Ghosting)
- **3-Hour Buyer Cancel:** ผู้ซื้อสามารถกดยกเลิกการจองได้เองภายใน 3 ชั่วโมงแรกหลังจากกดจอง
- **24-Hour Auto-Cancel:** มี Background Cron Job ตรวจสอบทุกชั่วโมง หากการจองค้างสถานะ `PENDING` เกิน 24 ชั่วโมง ระบบจะยกเลิกอัตโนมัติและคืนสถานะสินค้ากลับมาวางขายใหม่อีกครั้ง
- **Anti-Ghosting Report:** หากผู้ซื้อไม่มาตามนัดหมาย ผู้ขายสามารถกดปุ่ม **"รายงานผู้ซื้อไม่มาตามนัด (Report Ghosting)"** ระบบจะยกเลิกการจอง คืนสถานะสินค้า และตั้งค่าระงับบัญชีผู้ซื้อ (`isBanned = true`) ทันที

### 6. ระบบผู้ดูแลระบบ (Admin Management System)
- **Role-based Access Control:** สิทธิ์ Admin (`ADMIN`, `ADMIN1`, `ADMIN2`, `ADMIN3`) ได้รับการป้องกันผ่าน `requireAdmin` middleware
- **Dashboard KPI Metrics:** ดูสถิติรวมของระบบ เช่น จำนวนผู้ใช้ทั้งหมด, จำนวนผู้ขาย (Sellers), จำนวนผู้ซื้อ (Buyers), สินค้าที่ลงขาย, การจอง, และดีลที่ปิดสำเร็จ
- **User Management & Filters:** ค้นหาบัญชีนักศึกษาตามชื่อ อีเมล หรือรหัสนักศึกษา กรองบัญชีตามสถานะถูกแบนและกิจกรรม (ผู้ขาย / ผู้ซื้อ); บัญชี Admin แสดงแยกต่างหาก
- **Separated Admin Accounts:** แสดงบัญชี Admin ในส่วนแยกจากรายชื่อผู้ใช้ และไม่อนุญาตให้แบนหรือปลดแบนบัญชี Admin
- **Banned Account Support:** ผู้ใช้ที่ถูกระงับจะเข้าสู่หน้าข้อความแจ้งสถานะและส่งข้อความหา Admin ได้ โดย Admin ตอบกลับจากกล่องข้อความในหน้า Admin
- **Support Conversation Resolution:** Admin ทำเครื่องหมายบทสนทนาว่าแก้ไขแล้วเพื่อเก็บประวัติและแยกออกจากรายการที่กำลังดำเนินการได้
- **Deep Inspection Drawer (ตรวจสอบประวัติสองฝั่ง):**
  - **ฝั่งผู้ขาย (Seller Side):** ตรวจสอบรายการสินค้าทั้งหมดที่ผู้ใช้คนนี้เคยลงขาย พร้อมราคา สถานะ และประวัติ
  - **ฝั่งผู้ซื้อ (Buyer Side):** ตรวจสอบประวัติการกดจองสินค้าทั้งหมด สถานะดีล และข้อมูลผู้ขายที่นัดรับ
- **Admin Moderation Actions:**
  - สลับสถานะระงับบัญชีนักศึกษา (Ban / Unban) ทันที โดยห้ามระงับหรือปลดระงับบัญชี Admin
  - เลื่อนขั้นหรือปรับบทบาทผู้ใช้ระหว่าง `STUDENT` ↔ `ADMIN`

---

## API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/login`, `/api/auth/cmu` | เริ่มการล็อกอินและ Redirect ไป CPE CMU OAuth |
| `GET` | `/api/auth/callback`, `/api/auth/cmu/callback` | Callback แลก Code และสร้างเซสชัน JWT Cookie |
| `POST` | `/api/auth/mock-login` | จำลองล็อกอินสำหรับ Local Testing (ระบุ studentId, role ได้) |
| `GET` | `/api/auth/me` | ดึงข้อมูลโปรไฟล์ของผู้ใช้ปัจจุบันที่ล็อกอินอยู่ |
| `POST` | `/api/auth/logout` | ล้าง Cookie เซสชันและออกจากระบบ |
| `GET` | `/callback`, `/auth/callback` | Callback aliases ที่ Backend เปิดไว้เพื่อรองรับ OAuth allowlist |

### Products (`/api/products`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | ดึงสินค้า (รองรับ Query `search` และ `available`: `all`, `true`, `false`; ค่าเริ่มต้นแสดงสินค้าพร้อมขาย) |
| `GET` | `/api/products/:id` | ดึงรายละเอียดสินค้า พร้อมข้อมูลผู้ขาย |
| `POST` | `/api/products` | ลงประกาศขายสินค้าใหม่ (ส่งไฟล์แบบ `images` ได้สูงสุด 5 รูป พร้อมข้อมูลสินค้า) *(Auth Required)* |
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
| `GET` | `/api/reservations/chats` | รายการแชตของการจองที่ยัง `PENDING` |
| `GET` | `/api/reservations/:id/messages` | โหลดข้อความแชตการจอง (เฉพาะผู้ซื้อ/ผู้ขายที่เกี่ยวข้อง) |
| `POST` | `/api/reservations/:id/messages` | ส่งข้อความในแชตการจองที่ยัง `PENDING` |

### Account Support (`/api/support`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/support/messages` | โหลดประวัติข้อความติดต่อ Admin ของบัญชีปัจจุบัน |
| `POST` | `/api/support/messages` | ส่งข้อความถึง Admin (ใช้ได้แม้บัญชีถูกระงับ) |

### User Profile (`/api/users`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/profile` | ดึงข้อมูลโปรไฟล์และช่องทางติดต่อ |
| `PATCH` | `/api/users/profile` | แก้ไขข้อมูลการติดต่อ (เช่น Line ID, เบอร์โทรศัพท์) |
| `PATCH` | `/api/users/profile/avatar` | อัปโหลดหรือเปลี่ยนรูปโปรไฟล์ |
| `GET` | `/api/users/my-products` | รายการสินค้าทั้งหมดที่เราเป็นผู้ลงขาย |
| `PATCH` | `/api/users/products/:id/toggle-status` | สลับสถานะสินค้า วางขาย ↔ ปิดรับการจอง |

### Admin System (`/api/admin`) *(เฉพาะบทบาท ADMIN)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | สรุปภาพรวมสถิติทั้งระบบ (ผู้ใช้, ผู้ขาย, ผู้ซื้อ, สินค้า, การจอง) |
| `GET` | `/api/admin/users` | รายชื่อนักศึกษา รองรับ Search, Role, Status, Activity filter; ค่าเริ่มต้นไม่รวม Admin |
| `GET` | `/api/admin/users/:id` | เจาะลึกประวัติของผู้ใช้ ดูรายการที่ขาย และรายการที่กดจองทั้งหมด |
| `PATCH` | `/api/admin/users/:id/ban` | สลับสถานะแบน/ปลดแบนบัญชีนักศึกษา (บัญชี Admin ถูกป้องกันไม่ให้แบน) |
| `PATCH` | `/api/admin/users/:id/role` | ปรับเปลี่ยนระดับสิทธิ์ระหว่างนักศึกษาและ Admin |
| `GET` | `/api/admin/support` | รายการบทสนทนาที่ผู้ใช้ส่งถึง Admin |
| `GET` | `/api/admin/support/:userId/messages` | โหลดบทสนทนาของผู้ใช้ |
| `POST` | `/api/admin/support/:userId/messages` | ส่งข้อความตอบกลับผู้ใช้ |
| `PATCH` | `/api/admin/support/:userId/status` | ทำเครื่องหมายบทสนทนาว่าแก้ไขแล้วหรือเปิดกลับมาดำเนินการอีกครั้ง |

---

## วิธีการรันโปรเจกต์ (Quick Start)

### เตรียม Deploy ไปยัง FSG06 (`10.10.184.14`)

ใช้ `docker-compose.prod.yml` สำหรับ production แทน `docker-compose.yml` ซึ่งเป็นค่าทดสอบ local โดยไฟล์ production แยก volumes ของฐานข้อมูลและ uploads, ไม่ publish พอร์ต PostgreSQL ออกสู่ host, บังคับปิด mock auth และไม่รัน `prisma db push` ทุกครั้งที่ Backend เริ่ม

ไฟล์ root `.env.example` เป็นแม่แบบสำหรับ Compose production (`backend/.env.example` ใช้ local development) สร้าง `.env` ใน root บน server แล้วกรอกค่าผ่านช่องทางปลอดภัย ห้าม commit หรือส่ง secrets ในแชต:

- ตั้ง `POSTGRES_PASSWORD` เป็นรหัสผ่านใหม่แบบสุ่มที่ URL-safe และตั้ง `DATABASE_URL` ให้ใช้ user/password/database เดียวกัน โดย host ต้องเป็น `postgres` ภายใน Compose network
- ตั้ง `JWT_SECRET` เป็นค่าสุ่มใหม่ที่ยาวและไม่ซ้ำกับ development
- ใส่ CMU OAuth client credentials และใช้ callback URL ที่ลงทะเบียนกับผู้ให้บริการ OAuth ให้ตรงกันทุกตัวอักษร
- สำหรับ FSG06 ใช้ URL `https://fsg06.cpecmu.com` ใน `FRONTEND_URL` และ callback `https://fsg06.cpecmu.com/api/auth/callback` โดยต้องให้ HTTPS reverse proxy ของผู้ดูแลส่งต่อมายังพอร์ต `6006`
- Production จะตั้ง session cookie เป็น `Secure`; ห้ามเปิด OAuth login ผ่าน HTTP หรือสลับไปใช้ IP แบบไม่เข้ารหัส

เตรียมและตรวจ config โดยยังไม่เริ่ม container:

```bash
cd ~/Campus-CMU
cp .env.example .env
nano .env
docker compose --env-file .env -f docker-compose.prod.yml config --quiet
```

ก่อน cutover ให้ยืนยันว่าได้เตรียม image/config และได้รับอนุมัติช่วงหยุดบริการเดิมแล้ว จากนั้นเริ่ม PostgreSQL ของ CampusMart ซึ่งใช้ volume แยก และสร้าง schema เฉพาะในฐานข้อมูลใหม่นี้:

```bash
docker compose --env-file .env -f docker-compose.prod.yml up -d --build postgres
docker compose --env-file .env -f docker-compose.prod.yml run --rm backend npx prisma db push
docker compose --env-file .env -f docker-compose.prod.yml up -d --build backend
```

ตรวจ Backend ก่อนสลับ frontend:

```bash
docker compose --env-file .env -f docker-compose.prod.yml exec backend node -e "fetch('http://127.0.0.1:5000/api/health').then(async r => { console.log(r.status, await r.text()); process.exit(r.ok ? 0 : 1) }).catch(e => { console.error(e); process.exit(1) })"
```

หลังพอร์ต `6006` ว่าง (frontend เดิมถูกนำออกแล้ว) และผู้ดูแลยืนยัน HTTPS proxy พร้อม OAuth callback แล้ว ให้เปิด frontend CampusMart:

```bash
docker compose --env-file .env -f docker-compose.prod.yml up -d --build frontend
docker compose --env-file .env -f docker-compose.prod.yml ps
curl -f http://127.0.0.1:6006/api/health
```

หากต้อง rollback ให้หยุดเฉพาะ frontend CampusMart ก่อน แล้วให้ผู้ดูแลกู้ frontend เดิมจาก Compose project `/home/g06/pf-deploy` โดยตรวจสอบไฟล์ Compose และ image ที่ถูกต้องก่อนสร้าง container กลับ (`docker start g06-frontend` ใช้ไม่ได้หลังจากลบ container แล้ว):

```bash
docker compose --env-file .env -f docker-compose.prod.yml stop frontend
```

ห้ามใช้ `docker compose down -v`, ห้ามลบ volumes และห้ามรัน seed กับข้อมูลจริง ขั้นตอน `db push` ด้านบนใช้เฉพาะฐานข้อมูลใหม่ของ CampusMart; อย่าชี้ `DATABASE_URL` ไปยังฐานข้อมูลเดิมโดยไม่ได้รับอนุมัติ

### วิธีที่ 1: รันด้วย Docker Compose (แนะนำสำหรับการทดสอบครบวงจร)

```bash
# รันทุก Services พร้อมกัน (PostgreSQL + Backend + Frontend + Nginx)
docker compose up --build
```
- ใช้สำหรับ local development/testing เท่านั้น ไม่ใช่คำสั่ง Deploy ไป FSG06
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

### 2. ทดสอบ End-to-End (Playwright)
```bash
cd frontend
npm run test:e2e
```

---

## โครงสร้างโปรเจกต์ (Project Structure)

```text
Project Campus/
├── design.md                          # CampusMart monochrome design specification
├── backend/
│   ├── src/
│   │   ├── config/env.ts              # จัดการ Environment Variables
│   │   ├── controllers/               # Auth, Product, Reservation, User, Admin, Support Controllers
│   │   ├── middlewares/              # JWT Auth, requireAdmin, active-account, Multer Upload, Error Handler
│   │   ├── routes/                    # auth, product, reservation, user, admin, support routes
│   │   ├── services/                  # CPE OAuth 2.0 Client & Cron Auto-Cancel Job
│   │   ├── lib/prisma.ts              # Prisma Client Singleton
│   │   ├── app.ts                     # Express App Initialization
│   │   └── server.ts                  # Server Entrypoint
│   ├── prisma/
│   │   ├── schema.prisma              # Database Schema (including chat and support conversations)
│   │   └── seed.ts                    # Seed Data (Mock CMU Students & Sample Products)
│   ├── tests/
│   │   └── reservation_rules.test.ts # Vitest Test Suite
│   └── uploads/                       # ที่จัดเก็บรูปภาพสินค้าในเครื่อง
├── frontend/
│   ├── src/
│   │   ├── components/                # Shared UI, reservation chat, support chat, and Admin support inbox
│   │   ├── context/AuthContext.tsx    # Auth State, Login, Logout, Role State
│   │   ├── pages/
│   │   │   ├── MarketplacePage.tsx    # หน้าตลาดนัด ค้นหาสินค้า และแท็กหมวดหมู่
│   │   │   ├── ProductDetailPage.tsx  # หน้ารายละเอียดสินค้าและการจอง (Reveal Contact)
│   │   │   ├── CreateProductPage.tsx  # หน้าลงประกาศขายสินค้าพร้อมอัปโหลดรูป
│   │   │   ├── ProfilePage.tsx        # ข้อมูลส่วนตัว สินค้าที่ลงขาย และสินค้าที่กดจอง
│   │   │   ├── LoginPage.tsx          # หน้าล็อกอิน CMU OAuth และ Dev Sandbox
│   │   │   ├── AdminPage.tsx          # หน้าแดชบอร์ดแอดมิน ตรวจสอบผู้ซื้อ/ผู้ขาย & จัดการสิทธิ์
│   │   │   └── BannedAccountPage.tsx  # หน้าบัญชีถูกระงับและช่องทางติดต่อ Admin
│   │   ├── services/api.ts            # Axios Client เชื่อมต่อ Backend พร้อม Cookies
│   │   ├── types/index.ts             # TypeScript Interfaces & Models
│   │   ├── index.css                  # Monochrome design tokens & utility classes
│   │   └── App.tsx
│   ├── e2e/                           # Playwright E2E Tests
│   ├── tailwind.config.js             # Monochrome palette, typography & radius scale
│   └── vite.config.ts
├── nginx/
│   └── default.conf                   # Nginx Reverse Proxy Config
├── docker-compose.yml
└── package.json
```
