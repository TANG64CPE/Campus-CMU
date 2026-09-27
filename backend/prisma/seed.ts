import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CampusMart database with CMU mock data...');

  // Clean existing data
  await prisma.reservation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create CMU test students
  const user1 = await prisma.user.create({
    data: {
      studentId: '650610001',
      name: 'สมชาย เชียงใหม่ (Somchai CPE)',
      email: 'somchai_cpe@cmu.ac.th',
      contactInfo: 'Line: @somchai_eng | โทร 081-111-2233',
      isBanned: false,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      studentId: '650610002',
      name: 'อภิญญา ภูพิงค์ (Apinya CS)',
      email: 'apinya_cs@cmu.ac.th',
      contactInfo: 'Line: apinya.cmu | โทร 089-222-3344',
      isBanned: false,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      studentId: '650610003',
      name: 'ธนากร ดอยสุเทพ (Thanakorn Arch)',
      email: 'thanakorn_arch@cmu.ac.th',
      contactInfo: 'Line: thanakorn_art | โทร 090-333-4455',
      isBanned: false,
    },
  });

  // Create Products
  const p1 = await prisma.product.create({
    data: {
      title: 'บอร์ด ESP32-WROOM-32D + สาย Micro USB (ใช้งานวิชา Microcontroller 1 เทอม สภาพ 98%)',
      price: 150,
      imageUrl: null,
      meetupLocation: 'หน้าตึก 30 ปี คณะวิศวกรรมศาสตร์ มช.',
      isAvailable: true,
      sellerId: user1.id,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      title: 'หนังสือแคลคูลัส 1 สำหรับวิศวกรรมศาสตร์ (Calculus 1 CMU เล่มเหลือง มีจดเฉลยแนวข้อสอบ)',
      price: 120,
      imageUrl: null,
      meetupLocation: 'หอสมุดกลาง มช. (ชั้น 1 โซนโถงบันได)',
      isAvailable: true,
      sellerId: user1.id,
    },
  });

  const p3 = await prisma.product.create({
    data: {
      title: 'Apple Pencil 2 ของแท้ สภาพใหม่แกะกล่อง ประกันศูนย์ Studio7 มช.',
      price: 2400,
      imageUrl: null,
      meetupLocation: 'โรงอาหารอ่างแก้ว หรือ ลานสัก',
      isAvailable: true,
      sellerId: user2.id,
    },
  });

  const p4 = await prisma.product.create({
    data: {
      title: 'หนังสือฟิสิกส์มหาวิทยาลัย 1 (Physics 1) ฉบับภาษาไทย สำหรับ Sci & Eng',
      price: 190,
      imageUrl: null,
      meetupLocation: 'ตึก SCB1 คณะวิทยาศาสตร์ มช.',
      isAvailable: true,
      sellerId: user2.id,
    },
  });

  const p5 = await prisma.product.create({
    data: {
      title: 'คีย์บอร์ดบลูทูธ Logitech K380 สีขาว สภาพ 95% ปุ่มเงียบ เหมาะพิมพ์งานหอสมุด',
      price: 490,
      imageUrl: null,
      meetupLocation: 'โรงอาหารกลาง (RB3/RB5) มช.',
      isAvailable: false, // reserved item
      sellerId: user3.id,
    },
  });

  // Create a reservation for p5
  await prisma.reservation.create({
    data: {
      productId: p5.id,
      buyerId: user1.id,
      status: 'PENDING',
      createdAt: new Date(),
    },
  });

  console.log('✅ Seed completed: 3 CMU users, 5 products, 1 sample reservation created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
