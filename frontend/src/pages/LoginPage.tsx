import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, ShieldCheck, Sparkles, MapPin, Handshake } from 'lucide-react';

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
      desc: 'วิศวกรรมศาสตร์ (มีบอร์ด ESP32, หนังสือแคลคูลัส)',
    },
    {
      studentId: '650610002',
      name: 'อภิญญา ภูพิงค์ (CS)',
      email: 'apinya_cs@cmu.ac.th',
      desc: 'วิทยาศาสตร์ (มี Apple Pencil 2, หนังสือฟิสิกส์)',
    },
    {
      studentId: '650610003',
      name: 'ธนากร ดอยสุเทพ (Arch)',
      email: 'thanakorn_arch@cmu.ac.th',
      desc: 'สถาปัตยกรรมศาสตร์ (มีคีย์บอร์ด Logitech)',
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
        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 sm:p-10 text-center relative">
          {/* Decorative Background Blob */}
          <div className="absolute -top-20 -left-20 w-44 h-44 bg-cmu-200/40 rounded-full blur-2xl -z-0"></div>
          <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-amber-200/30 rounded-full blur-2xl -z-0"></div>

          {/* Logo Badge */}
          <div className="relative z-10 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-cmu-700 via-cmu-600 to-cmu-500 text-white shadow-xl shadow-cmu-600/30 mb-6">
            <ShoppingBag className="w-10 h-10" />
          </div>

          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Campus<span className="text-cmu-600">Mart</span>
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              ตลาดนัดซื้อขายของมือสองสำหรับนักศึกษา มช.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              นัดรับสินค้าในมหาวิทยาลัย ปลอดภัย ชำระเงินหน้างาน
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="relative z-10 grid grid-cols-3 gap-2 my-8 py-4 px-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600">
            <div className="flex flex-col items-center text-center gap-1">
              <ShieldCheck className="w-4 h-4 text-cmu-600" />
              <span>CMU Only</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1 border-x border-slate-200">
              <MapPin className="w-4 h-4 text-cmu-600" />
              <span>นัดรับใน มช.</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              <Handshake className="w-4 h-4 text-cmu-600" />
              <span>จ่ายเงินหน้างาน</span>
            </div>
          </div>

          {/* Core Login Button: "Login with CMU Account" Only (No Password Form) */}
          <div className="relative z-10 space-y-3">
            <button
              onClick={loginWithCmu}
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-semibold text-white bg-gradient-to-r from-cmu-700 via-cmu-600 to-cmu-700 hover:from-cmu-800 hover:to-cmu-800 shadow-lg shadow-cmu-600/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs">
                M
              </div>
              <span className="text-base tracking-wide">Login with CMU Account</span>
            </button>
            <p className="text-[11px] text-slate-400">
              เข้าสู่ระบบผ่าน CPE CMU OAuth (ยืนยันสถานะนักศึกษา มช.)
            </p>

            {/* CPE OAuth Credentials Info Box */}
            <div className="p-3 bg-purple-50/80 border border-purple-200/90 rounded-2xl text-[11px] text-left text-slate-600 space-y-1">
              <p className="font-semibold text-cmu-900 flex items-center gap-1">
                <span>🎓 บัญชีสำหรับเข้าสู่ระบบ (CPE OAuth):</span>
              </p>
              <p className="text-slate-600">
                • <strong>นักศึกษา:</strong> ใช้อีเมล มช. ของคุณเอง (เช่น <code className="text-cmu-700 font-mono">640610xxx@cmu.ac.th</code>)
              </p>
              <p className="text-slate-600">
                • <strong>อาจารย์ทดสอบ:</strong> <code className="text-cmu-700 font-mono">wichai.t@cmu.ac.th</code> หรือ <code className="text-cmu-700 font-mono">supaporn.k@cmu.ac.th</code>
              </p>
              <p className="text-amber-800 font-medium pt-0.5">
                🔑 รหัสผ่านเริ่มต้น: <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">1234567890</code>
              </p>
            </div>
          </div>

          {/* Local Dev / Mock Account Selector */}
          <div className="relative z-10 mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowDevOptions(!showDevOptions)}
              className="text-xs text-cmu-600 hover:text-cmu-800 font-medium inline-flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>โหมดพัฒนาในเครื่อง (Local Mock CMU Account)</span>
              <span className="text-[10px] text-slate-400">{showDevOptions ? '▲' : '▼'}</span>
            </button>

            {showDevOptions && (
              <div className="mt-4 p-4 bg-purple-50/70 border border-purple-100 rounded-2xl text-left animate-in fade-in duration-200">
                <p className="text-xs font-semibold text-cmu-900 mb-2">
                  เลือกบัญชีนักศึกษาทดสอบ (จำลอง CMU OAuth):
                </p>
                <div className="space-y-2">
                  {mockPresets.map((p) => (
                    <button
                      key={p.studentId}
                      type="button"
                      onClick={() => handleSelectMock(p)}
                      className="w-full text-left p-2.5 bg-white rounded-xl border border-purple-200/80 hover:border-cmu-500 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-800">{p.name}</span>
                        <span className="text-[10px] font-mono text-cmu-700 bg-purple-100 px-1.5 py-0.5 rounded">
                          {p.studentId}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleCustomMock} className="mt-3 pt-3 border-t border-purple-200/60">
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    หรือกรอกรหัสนักศึกษาเอง:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เช่น 650610999"
                      value={customStudentId}
                      onChange={(e) => setCustomStudentId(e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-cmu-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-cmu-600 hover:bg-cmu-700 text-white rounded-lg text-xs font-medium"
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
