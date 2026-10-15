import React from 'react';
import { Ban } from 'lucide-react';
import { User } from '../types';
import { SupportChat } from '../components/SupportChat';

interface BannedAccountPageProps {
  user: User;
}

export const BannedAccountPage: React.FC<BannedAccountPageProps> = ({ user }) => (
  <section className="flex min-h-[65vh] items-center justify-center px-4 py-12">
    <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-7 text-center shadow-tinted-sm sm:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-accent-red">
        <Ban className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-xl font-bold text-accent-red sm:text-2xl">
        บัญชีคุณถูกระงับ โปรดติดต่อ Admin เพื่อปลดแบน
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
        บัญชีนี้ไม่สามารถใช้งานฟังก์ชันอื่นได้ชั่วคราว สามารถส่งข้อความหา Admin เพื่อสอบถามหรือขอให้ตรวจสอบบัญชีได้
      </p>
      <SupportChat user={user} />
    </div>
  </section>
);
