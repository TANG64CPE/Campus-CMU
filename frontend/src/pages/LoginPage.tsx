import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Sparkles, MapPin, Handshake, Key } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { loginWithCmu, mockLogin, loading } = useAuth();
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [customStudentId, setCustomStudentId] = useState('');
  const [customName, setCustomName] = useState('');

  const mockPresets = [
    {
      studentId: '650610001',
      name: 'สมชาย เชียงใหม่ (CPE)',
      email: 'somchai_cpe@cmu.ac.th',
      desc: 'วิศวกรรมคอมพิวเตอร์ (มีบอร์ด ESP32, หนังสือแคลคูลัส)',
    },
    {
      studentId: '650610002',
      name: 'อภิญญา ภูพิงค์ (CS)',
      email: 'apinya_cs@cmu.ac.th',
      desc: 'วิทยาการคอมพิวเตอร์ (มี Apple Pencil 2, หนังสือฟิสิกส์)',
    },
    {
      studentId: '650610003',
      name: 'ธนากร ดอยสุเทพ (Arch)',
      email: 'thanakorn_arch@cmu.ac.th',
      desc: 'สถาปัตยกรรมศาสตร์ (มีคีย์บอร์ด Logitech)',
    },
    {
      studentId: 'ADMIN001',
      name: 'อาจารย์ ผู้ดูแลระบบ (Admin CPE)',
      email: 'admin_cpe@cmu.ac.th',
      desc: 'ผู้ดูแลระบบ — จัดการบัญชีผู้ขาย ผู้ซื้อ และตรวจสอบสถิติ',
      role: 'ADMIN',
    },
  ];

  const handleSelectMock = async (preset: typeof mockPresets[0]) => {
    await mockLogin(preset);
    onLoginSuccess();
  };

  const handleCustomMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStudentId) return;
    await mockLogin({
      studentId: customStudentId,
      name: customName || `นักศึกษา มช. (${customStudentId})`,
      email: `${customStudentId}@cmu.ac.th`,
    });
    onLoginSuccess();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card-feature-panel shadow-tinted-sm overflow-hidden p-7 sm:p-10 text-center relative">
          <div className="relative z-10">
            <p className="text-body-sm text-ink-secondary mt-1.5 font-medium">
              ตลาดนัดซื้อขายของมือสองสำหรับนักศึกษา มช.
            </p>
            <p className="text-[11px] text-ink-tertiary mt-0.5">
              นัดรับสินค้าในมหาวิทยาลัย ปลอดภัย ชำระเงินหน้างาน
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2 my-6 p-2.5 bg-surface rounded-xl text-[11px] text-ink-secondary">
            <div className="flex flex-col items-center text-center gap-1 p-1">
              <ShieldCheck className="w-4 h-4 text-accent-green" />
              <span className="font-medium text-[10px]">CMU Only</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1 p-1 border-x border-hairline">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium text-[10px]">นัดรับใน มช.</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1 p-1">
              <Handshake className="w-4 h-4 text-ink" />
              <span className="font-medium text-[10px]">จ่ายเงินหน้างาน</span>
            </div>
          </div>

          {/* Core Login Button — design.md button-gradient: 52px height, pill (20px), brand gradient */}
          <div className="relative z-10 space-y-3">
            <button
              onClick={loginWithCmu}
              disabled={loading}
              className="btn-primary-pill w-full h-[52px] px-6 text-body-lg font-medium tracking-tight-body-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-clickup ease-clickup disabled:opacity-50"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-caption">
                M
              </div>
              <span>Login with CMU Account</span>
            </button>
            <p className="text-[11px] text-ink-tertiary">
              เข้าสู่ระบบผ่าน CPE CMU OAuth (ยืนยันสถานะนักศึกษา มช.)
            </p>

            {/* CPE OAuth Credentials Info Box — card-tile styling */}
            <div className="p-4 bg-surface rounded-xl text-[11px] text-left text-ink space-y-1">
              <p className="font-semibold text-ink flex items-center gap-1 text-[11px]">
                <Key className="w-3 h-3 text-primary" />
                <span>บัญชีสำหรับเข้าสู่ระบบ (CPE OAuth):</span>
              </p>
              <p className="text-ink-secondary text-[11px]">
                • <strong>นักศึกษา:</strong> ใช้อีเมล มช. ของคุณเอง (เช่น <code className="text-primary font-mono">640610xxx@cmu.ac.th</code>)
              </p>
              <p className="text-ink-secondary text-[11px]">
                • <strong>อาจารย์ทดสอบ:</strong> <code className="text-primary font-mono">wichai.t@cmu.ac.th</code> หรือ <code className="text-primary font-mono">supaporn.k@cmu.ac.th</code>
              </p>
              <p className="text-ink-deep font-medium pt-0.5 text-[11px]">
                🔑 รหัสผ่านเริ่มต้น: <code className="bg-surface-soft text-ink px-1.5 py-0.5 rounded-full font-mono font-bold">1234567890</code>
              </p>
            </div>
          </div>

          {/* Local Dev / Mock Account Selector */}
          <div className="relative z-10 mt-6 pt-5 border-t border-hairline">
            <button
              type="button"
              onClick={() => setShowDevOptions(!showDevOptions)}
              className="text-body-sm text-primary hover:text-primary-deep font-medium inline-flex items-center gap-1.5 transition-colors duration-clickup ease-clickup"
            >
              <Sparkles className="w-3.5 h-3.5 text-ink-secondary" />
              <span>โหมดทดสอบในเครื่อง (Local Mock CMU Account)</span>
              <span className="text-[10px] text-ink-tertiary font-mono">{showDevOptions ? '▲' : '▼'}</span>
            </button>

            {showDevOptions && (
              <div className="mt-3 p-4 bg-surface rounded-xl text-left animate-in fade-in duration-200">
                <p className="eyebrow-mono text-[10px] text-ink-tertiary mb-2">
                  เลือกบัญชีนักศึกษาทดสอบ:
                </p>
                <div className="space-y-1.5">
                  {mockPresets.map((p) => (
                    <button
                      key={p.studentId}
                      type="button"
                      onClick={() => handleSelectMock(p)}
                      className="w-full text-left p-3 bg-canvas rounded-lg border border-hairline hover:border-black transition-all duration-clickup ease-clickup flex flex-col group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-body-sm text-ink group-hover:text-primary transition-colors">
                          {p.name}
                        </span>
                        <span className="font-mono text-[10px] text-ink-tertiary bg-surface-soft px-1.5 py-0.5 rounded-xxs border border-hairline">
                          {p.studentId}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-secondary mt-0.5 truncate">{p.desc}</p>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleCustomMock} className="mt-3 pt-3 border-t border-hairline">
                  <label className="block text-[10px] font-mono text-ink-tertiary uppercase mb-1">
                    หรือกรอกรหัสนักศึกษาเอง:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เช่น 650610999"
                      value={customStudentId}
                      onChange={(e) => setCustomStudentId(e.target.value)}
                          className="flex-1 input-field h-[44px] text-body-sm px-3"
                    />
                    <button
                      type="submit"
                      className="btn-primary-pill h-[38px] px-3.5 text-button-md"
                    >
                      เข้าสู่ระบบ
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
