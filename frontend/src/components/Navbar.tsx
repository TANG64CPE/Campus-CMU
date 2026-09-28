import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, PlusCircle, User as UserIcon, LogOut, ChevronDown, Sparkles, Search, Shield } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, productId?: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  searchQuery,
  onSearchChange,
}) => {
  const { user, logout, mockLogin } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Mock accounts for quick local testing
  const mockStudents = [
    { studentId: '650610001', name: 'สมชาย เชียงใหม่ (CPE)', email: 'somchai_cpe@cmu.ac.th', role: 'STUDENT' },
    { studentId: '650610002', name: 'อภิญญา ภูพิงค์ (CS)', email: 'apinya_cs@cmu.ac.th', role: 'STUDENT' },
    { studentId: '650610003', name: 'ธนากร ดอยสุเทพ (Arch)', email: 'thanakorn_arch@cmu.ac.th', role: 'STUDENT' },
    { studentId: 'ADMIN001', name: 'อาจารย์ ผู้ดูแลระบบ (Admin CPE)', email: 'admin_cpe@cmu.ac.th', role: 'ADMIN' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-md border-b border-hairline transition-all">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-[60px] gap-4">
          {/* Brand Wordmark & Logo */}
          <button
            onClick={() => onNavigate('marketplace')}
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            {/* ClickUp Brand Voltage Gradient Icon */}
            <div className="w-9 h-9 rounded-pill bg-brand-gradient flex items-center justify-center text-white shadow-tinted-sm group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-[19px] tracking-tight text-ink group-hover:text-primary transition-colors">
                Campus<span className="bg-brand-gradient bg-clip-text text-transparent">Mart</span>
              </span>
              {/* Sometype Mono Eyebrow Badge (4px radius) */}
              <span className="eyebrow-mono bg-surface-soft text-ink-deep px-1.5 py-0.5 rounded-xxs border border-hairline font-mono text-[10px]">
                CMU
              </span>
            </div>
          </button>

          {/* Quick Search on larger screens (ClickUp search input design) */}
          {currentView === 'marketplace' && (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ค้นหาหนังสือ, บอร์ดไมโครคอนโทรลเลอร์, อุปกรณ์ IT..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-surface text-ink text-xs pl-10 pr-9 py-2 rounded-pill border border-hairline-strong focus:outline-none focus:border-primary focus:bg-canvas focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-ink-disabled font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-2.5 text-xs text-ink-tertiary hover:text-ink"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                {/* Admin System Button for Admins */}
                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-xs font-semibold tracking-[-0.15px] border transition-all ${
                      currentView === 'admin'
                        ? 'bg-purple-50 text-primary border-primary font-bold shadow-tinted-xs'
                        : 'bg-canvas text-ink hover:text-primary hover:border-primary border-hairline'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>ระบบ Admin</span>
                  </button>
                )}

                {/* Sell Item Button — ClickUp Dark Pill CTA (#292d34, 20px radius) */}
                <button
                  onClick={() => onNavigate('create')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-pill text-xs font-semibold tracking-[-0.15px] transition-all shadow-tinted-xs ${
                    currentView === 'create'
                      ? 'bg-ink-deep text-canvas'
                      : 'bg-ink hover:bg-ink-deep text-canvas'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ลงขายสินค้า</span>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-pill border border-hairline hover:border-hairline-strong hover:bg-surface transition-all text-xs font-medium text-ink"
                  >
                    <div className="w-7 h-7 rounded-full bg-surface-soft text-ink font-mono font-bold text-xs flex items-center justify-center border border-hairline">
                      {user.studentId.slice(-3)}
                    </div>
                    <div className="hidden sm:block text-left text-xs">
                      <div className="font-semibold text-ink leading-tight line-clamp-1">{user.name}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-ink-tertiary" />
                  </button>

                  {/* Dropdown Menu (14px card-feature radius, hairline border, tinted shadow) */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-canvas rounded-lg shadow-tinted-md border border-hairline py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-hairline">
                        <div className="flex items-center justify-between">
                          <p className="eyebrow-mono text-[10px] text-ink-tertiary">CMU ACCOUNT</p>
                          {user.role === 'ADMIN' && (
                            <span className="eyebrow-mono text-[9px] font-bold text-primary bg-purple-50 px-1 rounded-xxs border border-purple-200">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-ink truncate mt-0.5">{user.name}</p>
                        <p className="text-[11px] text-brand-link font-mono truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        {user.role === 'ADMIN' && (
                          <button
                            onClick={() => onNavigate('admin')}
                            className="w-full px-4 py-2 text-left text-xs font-semibold text-primary hover:bg-surface flex items-center gap-2"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>ระบบจัดการผู้ใช้ (Admin)</span>
                          </button>
                        )}

                        <button
                          onClick={() => onNavigate('profile')}
                          className="w-full px-4 py-2 text-left text-xs font-medium text-ink hover:bg-surface flex items-center gap-2"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-primary" />
                          <span>โปรไฟล์ & รายการของฉัน</span>
                        </button>

                        <button
                          onClick={() => onNavigate('marketplace')}
                          className="w-full px-4 py-2 text-left text-xs font-medium text-ink hover:bg-surface flex items-center gap-2"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-primary" />
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
                              mockLogin(s);
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left text-xs px-2 py-1.5 rounded-sm transition-colors flex items-center justify-between ${
                              user.studentId === s.studentId
                                ? 'bg-surface-soft text-primary font-bold'
                                : 'text-ink-secondary hover:bg-surface'
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
                          onClick={logout}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-accent-red hover:bg-red-50 flex items-center gap-2"
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
                className="btn-gradient-pill px-4 py-2 text-xs font-semibold tracking-[-0.15px] shadow-tinted-sm"
              >
                <span>เข้าสู่ระบบ CMU</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
