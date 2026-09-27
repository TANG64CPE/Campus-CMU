import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MarketplacePage } from './pages/MarketplacePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CreateProductPage } from './pages/CreateProductPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';

const MainApp: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [currentView, setCurrentView] = useState<'marketplace' | 'detail' | 'create' | 'profile' | 'login'>('marketplace');
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
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

        {currentView === 'login' && (
          <LoginPage onLoginSuccess={() => setCurrentView('marketplace')} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4">
          <p className="font-semibold text-slate-600 mb-1">CampusMart © 2026 - Chiang Mai University</p>
          <p>
            ระบบตลาดนัดของใช้มือสองสำหรับนักศึกษา มช. | ชำระเงินหน้างาน ปลอดภัย 100% Local Environment
          </p>
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
