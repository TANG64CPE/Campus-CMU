import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isAdminRole } from '../types';
import { ShoppingBag, PlusCircle, User as UserIcon, LogOut, ChevronDown, Sparkles, Search, Shield } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, productId?: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAccountSwitch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  searchQuery,
  onSearchChange,
  onAccountSwitch,
}) => {
  const { user, logout, mockLogin } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isAdmin = isAdminRole(user?.role);

  // Mock accounts for quick local testing
  const mockStudents = [
    { studentId: '650610001', name: 'สมชาย เชียงใหม่ (CPE)', email: 'somchai_cpe@cmu.ac.th', role: 'STUDENT' },
    { studentId: '650610002', name: 'อภิญญา ภูพิงค์ (CS)', email: 'apinya_cs@cmu.ac.th', role: 'STUDENT' },
    { studentId: '650610003', name: 'ธนากร ดอยสุเทพ (Arch)', email: 'thanakorn_arch@cmu.ac.th', role: 'STUDENT' },
    { studentId: 'ADMIN001', name: 'อาจารย์ ผู้ดูแลระบบ (Admin CPE)', email: 'admin_cpe@cmu.ac.th', role: 'ADMIN' },
  ];

  return (
    /* ── Top Nav (design.md: top-nav) ───────────────────
       bg: canvas, text: ink, body-md, height: 60px, padding: 0 40px
       Sticky on scroll with subtle resting-state hairline
       ────────────────────────────────────────────────── */
    <nav
      className={`sticky top-0 z-40 backdrop-blur-xl ${
        currentView === 'marketplace' ? 'mb-[-68px] bg-canvas/35' : 'bg-canvas/70'
      }`}
      style={{ height: '68px' }}
    >
      <div className="max-w-clickup mx-auto px-4 sm:px-[40px]">
        <div className="flex items-center justify-between h-[68px] gap-4">
          {/* Navigation search */}
          {currentView === 'marketplace' && (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ค้นหาหนังสือ, บอร์ดไมโครคอนโทรลเลอร์, อุปกรณ์ IT..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-surface-soft text-ink text-body-sm pl-10 pr-9 py-2.5 rounded-pill border border-transparent focus:outline-none focus:border-primary focus:bg-canvas focus:ring-2 focus:ring-primary/10 transition-all duration-clickup ease-clickup placeholder:text-ink-disabled font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-2.5 text-caption text-ink-tertiary hover:text-ink transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Action buttons */}
          <div className="ml-auto flex items-center gap-2.5">
            {user ? (
              <>
                {/* Admin System Button for Admins */}
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className="flex items-center gap-1.5 rounded-pill border border-white bg-white px-3.5 py-2 text-button-md font-medium text-[#191919] transition-all duration-clickup ease-clickup hover:bg-white/90"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>ระบบ Admin</span>
                  </button>
                )}

                {/* Primary listing action */}
                <button
                  onClick={() => onNavigate('create')}
                  disabled={isAdmin}
                  title={isAdmin ? 'บัญชี Admin ไม่สามารถลงขายสินค้าได้' : undefined}
                  className={`flex items-center gap-1.5 rounded-pill px-4 py-2 text-button-md transition-all duration-clickup ease-clickup shadow-tinted-xs ${
                    isAdmin
                      ? 'cursor-not-allowed border border-white bg-white text-[#191919]'
                      : currentView === 'create'
                        ? 'bg-ink-deep text-canvas'
                        : 'bg-ink text-canvas hover:bg-ink-deep'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ลงขายสินค้า</span>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-2 rounded-pill border p-1 text-body-sm font-medium text-ink transition-all duration-clickup ease-clickup sm:px-2.5 sm:py-1.5 ${isAdmin ? 'border-white bg-white hover:bg-white/90' : 'border-hairline hover:border-hairline-strong hover:bg-surface'}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-surface-soft text-ink font-bold text-caption flex items-center justify-center border border-hairline overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.name.trim().charAt(0).toLocaleUpperCase() || '?'
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="font-semibold text-ink leading-tight line-clamp-1 text-body-sm">{user.name}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-ink-tertiary" />
                  </button>

                  {/* Dropdown Menu (14px card-feature radius, hairline border, tinted shadow) */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-canvas rounded-xl shadow-tinted-md border border-hairline p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-hairline">
                        <div className="flex items-center justify-between">
                          <p className="eyebrow-mono text-[10px] text-ink-tertiary">บัญชีผู้ใช้</p>
                          {isAdmin && (
                            <span className="eyebrow-mono text-[9px] font-bold text-primary bg-surface-soft px-2 py-1 rounded-full">
                              {user.role}
                            </span>
                          )}
                        </div>
                        <p className="text-body-sm font-bold text-ink truncate mt-0.5">{user.name}</p>
                        <p className="text-[11px] text-ink-secondary truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        {isAdmin && (
                          <button
                            onClick={() => onNavigate('admin')}
                            className="w-full px-4 py-2.5 text-left text-body-sm font-semibold text-primary hover:bg-surface-soft flex items-center gap-2 transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>ระบบจัดการผู้ใช้ (Admin)</span>
                          </button>
                        )}

                        {!isAdmin && (
                          <button
                            onClick={() => onNavigate('profile')}
                            className="w-full px-4 py-2.5 text-left text-body-sm font-medium text-ink hover:bg-surface-soft flex items-center gap-2 transition-colors"
                          >
                            <UserIcon className="w-3.5 h-3.5" />
                            <span>โปรไฟล์ & รายการของฉัน</span>
                          </button>
                        )}

                        <button
                          onClick={() => onNavigate('marketplace')}
                          className="w-full px-4 py-2.5 text-left text-body-sm font-medium text-ink hover:bg-surface-soft flex items-center gap-2 transition-colors"
                        >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          <span>หน้าตลาดสินค้า (Feed)</span>
                        </button>
                      </div>

                      {/* Mock Student Quick Switcher */}
                      <div className="border-t border-hairline pt-2 pb-1 px-3">
                        <p className="eyebrow-mono text-[10px] text-ink-tertiary px-1 mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-brand-orange" /> สลับบัญชีทดสอบ
                        </p>
                        {mockStudents.map((s) => (
                          <button
                            key={s.studentId}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowUserMenu(false);
                              void mockLogin(s).then(onAccountSwitch);
                            }}
                            className={`w-full text-left text-body-sm px-3 py-2 rounded-full transition-colors duration-clickup ease-clickup flex items-center justify-between ${
                              user.studentId === s.studentId
                                ? 'bg-black text-white font-medium'
                                : 'text-ink-secondary hover:bg-surface-soft'
                            }`}
                          >
                            <span className="truncate">{s.name}</span>
                            <span className="text-[10px] text-ink-disabled font-mono">
                              {s.studentId.slice(-3)}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-hairline pt-1 mt-1">
                        <button
                          onClick={() => {
                            void logout().then(() => onNavigate('marketplace'));
                          }}
                          className="w-full px-4 py-2.5 text-left text-body-sm font-semibold text-accent-red hover:bg-surface-soft flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>ออกจากระบบ</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Gradient Pill CTA for Log in */
              <button
                onClick={() => onNavigate('login')}
                className="inline-flex items-center justify-center rounded-full border border-white/80 bg-white/90 px-5 py-2.5 text-button-md font-semibold text-[#191919] shadow-sm backdrop-blur-md transition hover:bg-white"
              >
                <span>เข้าสู่ระบบ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
