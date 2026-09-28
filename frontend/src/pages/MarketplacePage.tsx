import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { productApi } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import {
  Search,
  BookOpen,
  Cpu,
  Home,
  PenTool,
  Layers,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  MapPin,
  Handshake,
  Sparkles,
} from 'lucide-react';

interface MarketplacePageProps {
  onSelectProduct: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  onSelectProduct,
  searchQuery,
  onSearchChange,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'available' | 'all'>('all');

  const categories = [
    { id: 'all', label: 'ทั้งหมด', icon: Layers, countLabel: 'All Items' },
    { id: 'micro', label: 'ฮาร์ดแวร์ & IT', icon: Cpu, keyword: 'บอร์ด|ESP32|คีย์บอร์ด|Apple|IT|Pencil|จอ|สาย|RAM', countLabel: 'Hardware' },
    { id: 'books', label: 'หนังสือเรียน & เอกสาร', icon: BookOpen, keyword: 'หนังสือ|แคลคูลัส|ฟิสิกส์|ชีท|ข้อสอบ|เคมี|Textbook', countLabel: 'Books & Sheets' },
    { id: 'arch', label: 'เครื่องเขียน & สถาปัตย์', icon: PenTool, keyword: 'สถาปัตย์|กระดาน|ไม้ที|สี|โมเดล|Copic', countLabel: 'Art & Design' },
    { id: 'dorm', label: 'ของใช้หอพัก', icon: Home, keyword: 'หอ|พัดลม|โคมไฟ|กล่อง|หม้อ|ตู้|ราว', countLabel: 'Dorm Essentials' },
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productApi.getProducts({
        search: searchQuery,
        available: availabilityFilter === 'available' ? 'true' : 'all',
      });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, availabilityFilter]);

  // Client-side category filtering based on title keywords
  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    const currentCat = categories.find((c) => c.id === selectedCategory);
    if (!currentCat || !currentCat.keyword) return true;
    const regex = new RegExp(currentCat.keyword, 'i');
    return regex.test(p.title);
  });

  return (
    <div className="max-w-clickup mx-auto px-4 sm:px-[40px] py-6 pb-20">
      {/* Mobile Search Bar (ClickUp pill style) */}
      <div className="md:hidden mb-5">
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาหนังสือ, บอร์ดไมโครคอนโทรลเลอร์..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-surface border border-hairline-strong rounded-pill py-2.5 pl-10 pr-9 text-body-sm focus:outline-none focus:border-primary focus:bg-canvas focus:ring-2 focus:ring-primary/10 transition-all duration-clickup ease-clickup placeholder:text-ink-disabled font-sans"
          />
          <Search className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-3" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-2.5 text-caption text-ink-tertiary hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Hero Section — design.md card-section: surface bg, xl (25px) radius, 60px padding */}
      <div className="card-section p-6 sm:p-10 mb-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-primary-soft/10 via-brand-link/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          {/* Eyebrow badge — Sometype Mono uppercase, xxs (4px) radius */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xxs bg-surface-soft border border-hairline mb-3">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="eyebrow-mono text-[11px] text-ink-deep font-semibold">
              CMU PEER-TO-PEER MARKETPLACE
            </span>
          </div>

          {/* Plus Jakarta Sans Display Headline — display-lg (40px / 650 / -1.6px) */}
          <h1 className="font-display font-extrabold text-2xl sm:text-display-lg tracking-tight-lg text-ink leading-[1.18]">
            ส่งต่อของใช้มือสอง ภายใน มช.{' '}
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              นัดรับปลอดภัยในมอ
            </span>
          </h1>

          <p className="text-ink-secondary text-body-sm sm:text-body-md mt-3 leading-relaxed max-w-xl font-sans">
            ระบบตลาดนัดสำหรับนักศึกษามหาวิทยาลัยเชียงใหม่ นัดส่งมอบและตรวจสอบสินค้าตัวต่อตัว
            ณ จุดนัดรับยอดนิยม (หอสมุดกลาง, ลานสัก, โรงอาหาร มช.) จ่ายเงินสดหรือสแกนจ่ายหน้างาน หมดกังวลเรื่องการโดนโกง
          </p>

          {/* Feature highlights — badge-pill style (full radius, 4px 10px) */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-canvas border border-hairline text-body-sm font-medium text-ink-deep shadow-tinted-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-green" />
              <span>ยืนยันตัวตนด้วย CMU Account</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-canvas border border-hairline text-body-sm font-medium text-ink-deep shadow-tinted-xs">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>นัดรับในมหาวิทยาลัย</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-canvas border border-hairline text-body-sm font-medium text-ink-deep shadow-tinted-xs">
              <Handshake className="w-3.5 h-3.5 text-brand-orange" />
              <span>ชำระเงินหน้างาน 0% หักค่าธรรมเนียม</span>
            </span>
          </div>
        </div>
      </div>

      {/* Category Strip — design.md Workspace-App Tile Grid: md (12px) radius, 1px hairline */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="eyebrow-mono text-caption text-ink-tertiary">หมวดหมู่สินค้า</h2>
            <span className="text-[10px] text-ink-disabled font-mono">• CATEGORIES</span>
          </div>

          {/* Availability Filter Toggle — ClickUp Pill Segment Control */}
          <div className="inline-flex p-1 bg-surface-soft rounded-pill border border-hairline text-body-sm font-medium text-ink-secondary">
            <button
              onClick={() => setAvailabilityFilter('all')}
              className={`px-3 py-1 rounded-pill transition-all duration-clickup ease-clickup ${
                availabilityFilter === 'all'
                  ? 'bg-canvas text-ink font-semibold shadow-tinted-xs border border-hairline'
                  : 'hover:text-ink'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setAvailabilityFilter('available')}
              className={`px-3 py-1 rounded-pill transition-all duration-clickup ease-clickup ${
                availabilityFilter === 'available'
                  ? 'bg-canvas text-accent-green font-semibold shadow-tinted-xs border border-hairline'
                  : 'hover:text-ink'
              }`}
            >
              พร้อมส่งมอบ
            </button>
          </div>
        </div>

        {/* 5-Column Workspace App Tiles — card-tile spec: md (12px) radius */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-start p-3 sm:p-3.5 rounded-md text-left transition-all duration-clickup ease-clickup relative ${
                  isSelected
                    ? 'bg-canvas border-2 border-primary shadow-tinted-sm -translate-y-0.5'
                    : 'bg-canvas border border-hairline hover:border-hairline-strong hover:bg-surface/50'
                }`}
              >
                {/* 36px icon chip — full radius (circle) per app-icon-chip spec */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2.5 transition-colors duration-clickup ease-clickup ${
                    isSelected
                      ? 'bg-brand-gradient text-white'
                      : 'bg-surface text-ink-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2]" />
                </div>

                <div className="w-full">
                  <span
                    className={`block text-body-sm font-semibold leading-tight truncate ${
                      isSelected ? 'text-primary' : 'text-ink'
                    }`}
                  >
                    {cat.label}
                  </span>
                  <span className="block text-[10px] font-mono text-ink-tertiary truncate mt-0.5">
                    {cat.countLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed Subheader */}
      <div className="flex items-center justify-between mb-4 pt-2 border-t border-hairline">
        <p className="text-body-sm text-ink-secondary">
          พบ <span className="font-bold text-ink">{filteredProducts.length}</span> รายการ
          {searchQuery && (
            <span>
              {' '}
              สำหรับ <span className="font-semibold text-primary">"{searchQuery}"</span>
            </span>
          )}
        </p>

        <button
          onClick={fetchProducts}
          className="text-body-sm text-ink-secondary hover:text-primary flex items-center gap-1.5 transition-colors duration-clickup ease-clickup"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px]">REFRESH</span>
        </button>
      </div>

      {/* Products Grid — 4-Column Feature Card Layout */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-canvas rounded-lg border border-hairline p-4 animate-pulse"
            >
              <div className="aspect-[4/3] bg-surface rounded-md mb-3" />
              <div className="h-5 bg-surface-soft rounded w-1/3 mb-2" />
              <div className="h-4 bg-surface rounded w-3/4 mb-4" />
              <div className="h-3 bg-surface-soft rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => onSelectProduct(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 card-section my-6">
          <AlertCircle className="w-10 h-10 text-ink-disabled mx-auto mb-3" />
          <h3 className="font-display text-heading-sm font-bold text-ink">ไม่พบสินค้าในหมวดหมู่นี้</h3>
          <p className="text-body-sm text-ink-tertiary mt-1 max-w-sm mx-auto">
            ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะครับ
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              onSearchChange('');
            }}
            className="btn-secondary-sm mt-4 px-4 py-2 text-button-md"
          >
            แสดงสินค้าทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};
