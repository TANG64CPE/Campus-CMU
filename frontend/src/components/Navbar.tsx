import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, PlusCircle, User as UserIcon, LogOut, ChevronDown, Sparkles, MapPin } from 'lucide-react';

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

  // Mock accounts for instant local testing
  const mockStudents = [
    { studentId: '650610001', name: 'สมชาย เชียงใหม่ (CPE)', email: 'somchai_cpe@cmu.ac.th' },
    { studentId: '650610002', name: 'อภิญญา ภูพิงค์ (CS)', email: 'apinya_cs@cmu.ac.th' },
    { studentId: '650610003', name: 'ธนากร ดอยสุเทพ (Arch)', email: 'thanakorn_arch@cmu.ac.th' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('marketplace')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cmu-700 via-cmu-600 to-cmu-500 flex items-center justify-center text-white shadow-md shadow-cmu-600/20 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cmu-700 to-cmu-500 bg-clip-text text-transparent">
                  CampusMart
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-100 text-cmu-700 border border-purple-200">
                  CMU
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                ตลาดนัดนักศึกษามหาวิทยาลัยเชียงใหม่
              </p>
            </div>
          </button>

          {/* Quick Search on larger screens */}
          {currentView === 'marketplace' && (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="ค้นหาหนังสือ, บอร์ดไมโครคอนโทรลเลอร์, อุปกรณ์ IT..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Sell Item Button */}
                <button
                  onClick={() => onNavigate('create')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                    currentView === 'create'
                      ? 'bg-cmu-700 text-white shadow-cmu-600/30'
                      : 'bg-gradient-to-r from-cmu-600 to-cmu-700 hover:from-cmu-700 hover:to-cmu-800 text-white'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">ลงขายสินค้า</span>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-cmu-300 hover:bg-purple-50/50 transition-all text-sm font-medium text-slate-700"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cmu-100 text-cmu-700 flex items-center justify-center font-bold text-xs">
                      {user.studentId.slice(-3)}
                    </div>
                    <div className="hidden sm:block text-left text-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{user.name}</div>
                      <div className="text-slate-400 font-mono text-[10px]">{user.studentId}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400">เข้าสู่ระบบโดย CMU Account</p>
                        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                        <p className="text-xs text-cmu-600 font-mono">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => onNavigate('profile')}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4 text-cmu-600" />
                          <span>โปรไฟล์ & รายการของฉัน</span>
                        </button>

                        <button
                          onClick={() => onNavigate('marketplace')}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4 text-cmu-600" />
                          <span>หน้าตลาดสินค้า (Feed)</span>
                        </button>
                      </div>

                      {/* Mock Student Quick Switcher */}
                      <div className="border-t border-slate-100 pt-2 pb-1 px-3">
                        <p className="text-[11px] font-semibold text-slate-400 px-1 mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" /> สลับบัญชีทดสอบ (Local Dev)
                        </p>
                        {mockStudents.map((s) => (
                          <button
                            key={s.studentId}
                            onClick={(e) => {
                              e.stopPropagation();
                              mockLogin(s);
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                              user.studentId === s.studentId
                                ? 'bg-purple-50 text-cmu-700 font-bold'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{s.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {s.studentId.slice(-3)}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          onClick={logout}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>ออกจากระบบ</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-cmu-600 hover:bg-cmu-700 text-white shadow-md shadow-cmu-600/20 transition-all"
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
