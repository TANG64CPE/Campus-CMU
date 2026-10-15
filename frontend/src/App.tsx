import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MarketplacePage } from './pages/MarketplacePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CreateProductPage } from './pages/CreateProductPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { BannedAccountPage } from './pages/BannedAccountPage';
import { ChatInbox } from './components/ChatInbox';
import { isAdminRole, isContactComplete } from './types';
import { AlertTriangle } from 'lucide-react';

type AppView = 'marketplace' | 'detail' | 'create' | 'profile' | 'login' | 'admin' | 'banned';

const readRoute = (): { view: AppView; productId: string | null } => {
  const productMatch = window.location.pathname.match(/^\/products\/([^/]+)\/?$/);
  if (productMatch) {
    return { view: 'detail', productId: decodeURIComponent(productMatch[1]) };
  }

  const route = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const views: Record<string, AppView> = {
    create: 'create',
    profile: 'profile',
    login: 'login',
    admin: 'admin',
    banned: 'banned',
  };
  return { view: views[route] || 'marketplace', productId: null };
};

const pathForView = (view: AppView, productId?: string): string => {
  if (view === 'detail' && productId) return `/products/${encodeURIComponent(productId)}`;
  return view === 'marketplace' ? '/' : `/${view}`;
};

const MainApp: React.FC = () => {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const [initialRoute] = useState(readRoute);
  const [currentView, setCurrentView] = useState<AppView>(initialRoute.view);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialRoute.productId);
  const [searchQuery, setSearchQuery] = useState('');
  const currentViewRef = useRef<AppView>(initialRoute.view);
  const marketplaceScrollY = useRef(0);
  const restoreMarketplaceScroll = useRef(false);

  const setRoute = useCallback((view: AppView, productId?: string, replace = false) => {
    if (view === 'detail' && currentViewRef.current === 'marketplace') {
      marketplaceScrollY.current = window.scrollY;
    }
    const path = pathForView(view, productId);
    if (replace) {
      window.history.replaceState({ view, productId }, '', path);
    } else if (window.location.pathname !== path) {
      window.history.pushState({ view, productId }, '', path);
    }
    currentViewRef.current = view;
    setCurrentView(view);
    setSelectedProductId(view === 'detail' ? productId || null : null);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const route = readRoute();
      if (currentViewRef.current === 'detail' && route.view === 'marketplace') {
        restoreMarketplaceScroll.current = true;
      }
      currentViewRef.current = route.view;
      setCurrentView(route.view);
      setSelectedProductId(route.productId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Admin accounts do not have a profile or listing flow. Redirect direct URL
  // visits after authentication has resolved so those pages are never exposed.
  useEffect(() => {
    if (authLoading || !isAdminRole(user?.role)) return;
    if (currentViewRef.current === 'profile' || currentViewRef.current === 'create') {
      setRoute('admin', undefined, true);
    }
  }, [authLoading, user?.role, setRoute]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.isBanned && currentViewRef.current !== 'banned') {
      setRoute('banned', undefined, true);
    } else if (!user && currentViewRef.current === 'banned') {
      setRoute('login', undefined, true);
    }
  }, [authLoading, user?.isBanned, setRoute]);

  useEffect(() => {
    const handleBannedAccount = () => {
      void refreshUser().then(() => setRoute('banned', undefined, true));
    };
    window.addEventListener('campusmart:account-banned', handleBannedAccount);
    return () => window.removeEventListener('campusmart:account-banned', handleBannedAccount);
  }, [refreshUser, setRoute]);

  // Handle URL callback from CMU OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
      setRoute('marketplace', undefined, true);
    }
  }, [setRoute]);

  const restoreMarketplacePosition = useCallback(() => {
    if (!restoreMarketplaceScroll.current) return;
    restoreMarketplaceScroll.current = false;

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, marketplaceScrollY.current);
    window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousScrollBehavior;
    });
  }, []);

  const handleNavigate = (view: string, productId?: string) => {
    if (user?.isBanned) {
      setRoute('banned', undefined, true);
      return;
    }
    const shouldRestoreMarketplace = currentViewRef.current === 'detail' && view === 'marketplace';
    if (shouldRestoreMarketplace) restoreMarketplaceScroll.current = true;

    if (view === 'detail' && productId) {
      setRoute('detail', productId);
    } else if (view === 'create') {
      if (!user) {
        setRoute('login');
      } else if (isAdminRole(user.role)) {
        setRoute('admin');
      } else if (!isContactComplete(user)) {
        setRoute('profile');
      } else {
        setRoute('create');
      }
    } else if (view === 'profile') {
      if (!user) {
        setRoute('login');
      } else if (isAdminRole(user.role)) {
        setRoute('admin');
      } else {
        setRoute('profile');
      }
    } else if (view === 'admin') {
      setRoute('admin');
    } else if (view === 'login') {
      setRoute('login');
    } else {
      setRoute('marketplace');
    }
    if (!shouldRestoreMarketplace) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (id: string) => {
    setRoute('detail', id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    restoreMarketplaceScroll.current = false;
    setRoute('marketplace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-primary/10 selection:text-ink-deep font-sans">
      {/* Keep the login screen focused on its authentication card. */}
      {currentView !== 'login' && currentView !== 'banned' && (
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAccountSwitch={() => handleNavigate('marketplace')}
          onLogout={() => void handleLogout()}
        />
      )}

      {/* Global Incomplete Contact Warning Banner */}
      {user && !isAdminRole(user.role) && !isContactComplete(user) && currentView !== 'profile' && currentView !== 'marketplace' && (
        <div className="bg-surface-soft border-b border-hairline px-4 py-2.5 text-caption sm:text-body-sm text-ink">
          <div className="max-w-clickup mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-ink-secondary shrink-0" />
              <span>
                <strong>ข้อมูลติดต่อยังไม่สมบูรณ์</strong> กรุณาระบุเบอร์โทรศัพท์และ Social Media ในหน้าโปรไฟล์เพื่อเปิดใช้งานการกดจองและลงขายสินค้า
              </span>
            </div>
            <button
              onClick={() => {
                handleNavigate('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="btn-primary-pill text-xs px-3.5 py-1 whitespace-nowrap shrink-0 shadow-tinted-xs"
            >
              กรอกข้อมูลติดต่อในโปรไฟล์ →
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'marketplace' && (
          <MarketplacePage
            onSelectProduct={handleSelectProduct}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNavigateToCreate={() => handleNavigate('create')}
            onNavigateToProfile={() => handleNavigate('profile')}
            contactIncomplete={Boolean(user && !isAdminRole(user.role) && !isContactComplete(user))}
            canSell={!isAdminRole(user?.role)}
            onProductsLoaded={restoreMarketplacePosition}
          />
        )}

        {currentView === 'detail' && selectedProductId && (
          <ProductDetailPage
            productId={selectedProductId}
            onBack={() => handleNavigate('marketplace')}
            onNavigateToLogin={() => handleNavigate('login')}
            onNavigateToProfile={() => handleNavigate('profile')}
          />
        )}

        {currentView === 'create' && (
          <CreateProductPage
            onSuccess={(newId) => handleSelectProduct(newId)}
            onCancel={() => handleNavigate('marketplace')}
            onNavigateToProfile={() => handleNavigate('profile')}
            onNavigateToLogin={() => handleNavigate('login')}
          />
        )}

        {currentView === 'profile' && authLoading && (
          <div className="max-w-clickup mx-auto px-4 py-16 text-center text-body-sm text-ink-secondary" role="status">
            กำลังตรวจสอบบัญชีของคุณ…
          </div>
        )}

        {currentView === 'profile' && !authLoading && !isAdminRole(user?.role) && (
          <ProfilePage
            onSelectProduct={handleSelectProduct}
            onNavigateToFeed={() => handleNavigate('marketplace')}
          />
        )}

        {currentView === 'admin' && (
          <AdminPage
            onNavigateHome={() => handleNavigate('marketplace')}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'banned' && user?.isBanned && (
          <BannedAccountPage user={user} />
        )}

        {currentView === 'login' && (
          <LoginPage onLoginSuccess={() => handleNavigate('marketplace')} />
        )}
      </main>

      {user && !authLoading && !user.isBanned && !isAdminRole(user.role) && currentView !== 'login' && (
        <ChatInbox key={user.id} user={user} />
      )}

      {currentView !== 'login' && currentView !== 'banned' && (
        <footer className="relative flex min-h-[420px] items-end overflow-hidden py-8 text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-bottom"
            style={{
              backgroundImage: "linear-gradient(180deg, #fffded 0%, rgba(255,253,237,0.9) 18%, rgba(255,253,237,0.52) 44%, rgba(255,253,237,0.08) 65%, rgba(25,25,25,0.48) 86%, rgba(25,25,25,0.98) 100%), url('/campus-market-banner.jpg')",
              backgroundPosition: 'center bottom',
              backgroundSize: 'cover',
            }}
          />
          <div className="relative z-10 w-full max-w-clickup mx-auto px-4 sm:px-[40px]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-body-sm text-white/85">
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-heading-sm tracking-tight-sm text-white">
                  CampusMart
                </span>
                <span className="text-white/80">ตลาดนัดของใช้มือสองสำหรับนักศึกษา มหาวิทยาลัยเชียงใหม่</span>
              </div>

              <div className="flex items-center gap-4 text-body-sm">
                <span className="hover:text-white cursor-pointer transition-colors duration-clickup ease-clickup">
                  นโยบายความปลอดภัย
                </span>
                <span className="text-white/55">•</span>
                <span className="hover:text-white cursor-pointer transition-colors duration-clickup ease-clickup">
                  จุดนัดรับใน มช.
                </span>
                <span className="text-white/55">•</span>
                <span className="text-white/70">© 2026 CampusMart</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
