import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CampusMart database with CMU mock data...');

  // Add the fixture accounts only when they are missing. Never erase real data.
  const user1 = await prisma.user.upsert({
    where: { studentId: '650610001' },
    update: {},
    create: {
      studentId: '650610001',
      name: 'สมชาย เชียงใหม่ (Somchai CPE)',
      email: 'somchai_cpe@cmu.ac.th',
      phone: '081-111-2233',
      lineId: '@somchai_eng',
      facebook: 'Somchai CPE CMU',
      instagram: 'somchai.cmu',
      meetingNote: 'สะดวกนัดรับหน้าตึก 30 ปี คณะวิศวะ หรือ หอสมุดกลาง',
      contactInfo: 'โทร: 081-111-2233 | Line: @somchai_eng | FB: Somchai CPE CMU | จุดนัดพบ: ตึก 30 ปี วิศวะ',
      isBanned: false,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { studentId: '650610002' },
    update: {},
    create: {
      studentId: '650610002',
      name: 'อภิญญา ภูพิงค์ (Apinya CS)',
      email: 'apinya_cs@cmu.ac.th',
      phone: '089-222-3344',
      lineId: 'apinya.cmu',
      facebook: 'Apinya Phuping',
      instagram: 'apinya_cs',
      meetingNote: 'นัดรับที่โรงอาหารอ่างแก้ว หรือ ลานสัก',
      contactInfo: 'โทร: 089-222-3344 | Line: apinya.cmu | IG: apinya_cs | จุดนัดพบ: โรงอาหารอ่างแก้ว',
      isBanned: false,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { studentId: '650610003' },
    update: {},
    create: {
      studentId: '650610003',
      name: 'ธนากร ดอยสุเทพ (Thanakorn Arch)',
      email: 'thanakorn_arch@cmu.ac.th',
      phone: '090-333-4455',
      lineId: 'thanakorn_art',
      facebook: 'Thanakorn DoiSuthep',
      instagram: 'thanakorn.arch',
      meetingNote: 'โรงอาหารกลาง (RB3/RB5) หรือ ลานหน้าคณะสถาปัตย์',
      contactInfo: 'โทร: 090-333-4455 | Line: thanakorn_art | จุดนัดพบ: โรงอาหารกลาง (RB3/RB5)',
      isBanned: false,
    },
  });

  const ensureProduct = async (data: {
    title: string;
    price: number;
    meetupLocation: string;
    sellerId: string;
    isAvailable?: boolean;
  }) => {
    const existing = await prisma.product.findFirst({
      where: { title: data.title, sellerId: data.sellerId },
    });
    if (existing) return existing;
    return prisma.product.create({ data: { imageUrl: null, ...data } });
  };

  const p1 = await ensureProduct({
      title: 'บอร์ด ESP32-WROOM-32D + สาย Micro USB (ใช้งานวิชา Microcontroller 1 เทอม สภาพ 98%)',
      price: 150,
      meetupLocation: 'หน้าตึก 30 ปี คณะวิศวกรรมศาสตร์ มช.',
      sellerId: user1.id,
  });

  const p2 = await ensureProduct({
      title: 'หนังสือแคลคูลัส 1 สำหรับวิศวกรรมศาสตร์ (Calculus 1 CMU เล่มเหลือง มีจดเฉลยแนวข้อสอบ)',
      price: 120,
      meetupLocation: 'หอสมุดกลาง มช. (ชั้น 1 โซนโถงบันได)',
      sellerId: user1.id,
  });

  const p3 = await ensureProduct({
      title: 'Apple Pencil 2 ของแท้ สภาพใหม่แกะกล่อง ประกันศูนย์ Studio7 มช.',
      price: 2400,
      meetupLocation: 'โรงอาหารอ่างแก้ว หรือ ลานสัก',
      sellerId: user2.id,
  });

  const p4 = await ensureProduct({
      title: 'หนังสือฟิสิกส์มหาวิทยาลัย 1 (Physics 1) ฉบับภาษาไทย สำหรับ Sci & Eng',
      price: 190,
      meetupLocation: 'ตึก SCB1 คณะวิทยาศาสตร์ มช.',
      sellerId: user2.id,
  });

  const p5 = await ensureProduct({
      title: 'คีย์บอร์ดบลูทูธ Logitech K380 สีขาว สภาพ 95% ปุ่มเงียบ เหมาะพิมพ์งานหอสมุด',
      price: 490,
      meetupLocation: 'โรงอาหารกลาง (RB3/RB5) มช.',
      sellerId: user3.id,
  });

  // Retain one sample reservation to demonstrate the reserved-product state.
  const activeSampleReservation = await prisma.reservation.findFirst({
    where: { productId: p5.id, status: 'PENDING' },
  });
  if (!activeSampleReservation) {
    await prisma.$transaction([
      prisma.reservation.create({
        data: {
          productId: p5.id,
          buyerId: user1.id,
          status: 'PENDING',
          createdAt: new Date(),
        },
      }),
      prisma.product.update({ where: { id: p5.id }, data: { isAvailable: false } }),
    ]);
  }

  console.log(`✅ Sample data ready: 3 fixture accounts, ${[p1, p2, p3, p4, p5].length} products, 1 sample reservation.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
