import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MarketplacePage } from './pages/MarketplacePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CreateProductPage } from './pages/CreateProductPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';

const MainApp: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [currentView, setCurrentView] = useState<'marketplace' | 'detail' | 'create' | 'profile' | 'login' | 'admin'>('marketplace');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle URL callback from CMU OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
      refreshUser();
      // Clean URL query
      window.history.replaceState({}, document.title, window.location.pathname);
      setCurrentView('marketplace');
    }
  }, [refreshUser]);

  const handleNavigate = (view: string, productId?: string) => {
    if (view === 'detail' && productId) {
      setSelectedProductId(productId);
      setCurrentView('detail');
    } else if (view === 'create') {
      if (!user) {
        setCurrentView('login');
      } else {
        setCurrentView('create');
      }
    } else if (view === 'profile') {
      if (!user) {
        setCurrentView('login');
      } else {
        setCurrentView('profile');
      }
    } else if (view === 'admin') {
      setCurrentView('admin');
    } else if (view === 'login') {
      setCurrentView('login');
    } else {
      setCurrentView('marketplace');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-primary-soft/30 selection:text-ink-deep font-sans">
      {/* Top Navbar (60px height, hairline border) */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'marketplace' && (
          <MarketplacePage
            onSelectProduct={handleSelectProduct}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentView === 'detail' && selectedProductId && (
          <ProductDetailPage
            productId={selectedProductId}
            onBack={() => setCurrentView('marketplace')}
            onNavigateToLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'create' && (
          <CreateProductPage
            onSuccess={(newId) => handleSelectProduct(newId)}
            onCancel={() => setCurrentView('marketplace')}
          />
        )}

        {currentView === 'profile' && (
          <ProfilePage
            onSelectProduct={handleSelectProduct}
            onNavigateToFeed={() => setCurrentView('marketplace')}
          />
        )}

        {currentView === 'admin' && (
          <AdminPage
            onNavigateHome={() => setCurrentView('marketplace')}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'login' && (
          <LoginPage onLoginSuccess={() => setCurrentView('marketplace')} />
        )}
      </main>

      {/* Footer Region (ClickUp footer spec: canvas bg, 1px hairline, ink-secondary typography) */}
      <footer className="bg-canvas border-t border-hairline py-10 mt-12">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-secondary">
            <div className="flex items-center gap-3">
              <span className="font-display font-extrabold text-base tracking-tight text-ink">
                Campus<span className="bg-brand-gradient bg-clip-text text-transparent">Mart</span>
              </span>
              <span className="eyebrow-mono bg-surface-soft text-ink-deep px-2 py-0.5 rounded-xxs border border-hairline text-[10px]">
                CMU CPE
              </span>
              <span className="text-ink-tertiary">|</span>
              <span className="text-ink-tertiary">ตลาดนัดของใช้มือสองสำหรับนักศึกษา มหาวิทยาลัยเชียงใหม่</span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="hover:text-brand-link cursor-pointer transition-colors">
                นโยบายความปลอดภัย
              </span>
              <span className="text-hairline-strong">•</span>
              <span className="hover:text-brand-link cursor-pointer transition-colors">
                จุดนัดรับใน มช.
              </span>
              <span className="text-hairline-strong">•</span>
              <span className="font-mono text-ink-tertiary">© 2026 CampusMart CMU</span>
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
