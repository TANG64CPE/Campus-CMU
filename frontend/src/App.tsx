import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MarketplacePage } from './pages/MarketplacePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CreateProductPage } from './pages/CreateProductPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { isContactComplete } from './types';
import { AlertTriangle } from 'lucide-react';

type AppView = 'marketplace' | 'detail' | 'create' | 'profile' | 'login' | 'admin';

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
  };
  return { view: views[route] || 'marketplace', productId: null };
};

const pathForView = (view: AppView, productId?: string): string => {
  if (view === 'detail' && productId) return `/products/${encodeURIComponent(productId)}`;
  return view === 'marketplace' ? '/' : `/${view}`;
};

const MainApp: React.FC = () => {
  const { user, refreshUser } = useAuth();
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

  // Handle URL callback from CMU OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
      refreshUser();
      setRoute('marketplace', undefined, true);
    }
  }, [refreshUser, setRoute]);

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
    const shouldRestoreMarketplace = currentViewRef.current === 'detail' && view === 'marketplace';
    if (shouldRestoreMarketplace) restoreMarketplaceScroll.current = true;

    if (view === 'detail' && productId) {
      setRoute('detail', productId);
    } else if (view === 'create') {
      if (!user) {
        setRoute('login');
      } else if (!isContactComplete(user)) {
        setRoute('profile');
      } else {
        setRoute('create');
      }
    } else if (view === 'profile') {
      if (!user) {
        setRoute('login');
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

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-primary/10 selection:text-ink-deep font-sans">
      {/* Keep the login screen focused on its authentication card. */}
      {currentView !== 'login' && (
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {/* Global Incomplete Contact Warning Banner */}
      {user && !isContactComplete(user) && currentView !== 'profile' && (
        <div className="bg-surface-soft border-b border-hairline px-4 py-2.5 text-caption sm:text-body-sm text-ink">
          <div className="max-w-clickup mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-ink-secondary shrink-0" />
              <span>
                <strong>ข้อมูลติดต่อยังไม่สมบูรณ์:</strong> กรุณาระบุเบอร์โทรศัพท์และ Social Media ในหน้าโปรไฟล์เพื่อเปิดใช้งานการกดจองและลงขายสินค้า
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
          />
        )}

        {currentView === 'profile' && (
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

        {currentView === 'login' && (
          <LoginPage onLoginSuccess={() => handleNavigate('marketplace')} />
        )}
      </main>

      <footer className="bg-black text-white py-10 mt-12">
        <div className="max-w-clickup mx-auto px-4 sm:px-[40px]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-body-sm text-white/70">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-heading-sm tracking-tight-sm text-white">
                CampusMart
              </span>
              <span className="text-white/65">ตลาดนัดของใช้มือสองสำหรับนักศึกษา มหาวิทยาลัยเชียงใหม่</span>
            </div>

            <div className="flex items-center gap-4 text-body-sm">
              <span className="hover:text-white cursor-pointer transition-colors duration-clickup ease-clickup">
                นโยบายความปลอดภัย
              </span>
              <span className="text-white/35">•</span>
              <span className="hover:text-white cursor-pointer transition-colors duration-clickup ease-clickup">
                จุดนัดรับใน มช.
              </span>
              <span className="text-white/35">•</span>
              <span className="text-white/50">© 2026 CampusMart</span>
            </div>
          </div>
        </div>
      </footer>
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
