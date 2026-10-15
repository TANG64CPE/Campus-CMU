import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { productApi } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { ScrollReveal } from '../components/ScrollReveal';
import { inferProductCategory, PRODUCT_CATEGORIES, type ProductCategory } from '../utils/productCategories';
import {
  Search,
  BookOpen,
  Cpu,
  CircleEllipsis,
  Home,
  PenTool,
  Layers,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  MapPin,
  Handshake,
  ArrowDown,
  AlertTriangle,
} from 'lucide-react';

interface MarketplacePageProps {
  onSelectProduct: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateToCreate: () => void;
  onNavigateToProfile: () => void;
  contactIncomplete: boolean;
  canSell: boolean;
  onProductsLoaded?: () => void;
}
export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  onSelectProduct,
  searchQuery,
  onSearchChange,
  onNavigateToCreate,
  onNavigateToProfile,
  contactIncomplete,
  canSell,
  onProductsLoaded,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'available' | 'all'>('all');

  const categoryIcons = {
    micro: Cpu,
    books: BookOpen,
    arch: PenTool,
    dorm: Home,
    other: CircleEllipsis,
  } satisfies Record<ProductCategory, typeof Cpu>;

  const categories = [
    { id: 'all', label: 'ทั้งหมด', icon: Layers, countLabel: 'All items' },
    ...PRODUCT_CATEGORIES.map((category) => ({
      id: category.id,
      label: category.label,
      icon: categoryIcons[category.id],
    })),
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
      onProductsLoaded?.();
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, availabilityFilter]);

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === 'all') return true;
    const productCategory = product.category || inferProductCategory(product.title);
    return productCategory === selectedCategory;
  });
  const scrollToFeed = () => document.getElementById('marketplace-feed')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="pb-20">
      <section className="relative isolate flex min-h-[560px] items-center justify-center overflow-hidden sm:min-h-[620px] lg:min-h-[680px]">
        <img
          src="/campus-market-banner.jpg"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-black/25" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent via-[#fffded]/70 to-[#fffded]"
        />

        {contactIncomplete && (
          <div className="absolute inset-x-0 top-[82px] z-20 px-4 sm:px-8 lg:px-10">
            <div className="mx-auto flex max-w-clickup flex-col items-start justify-between gap-3 rounded-xl border border-hairline bg-white/90 px-4 py-3 text-body-sm text-ink shadow-sm backdrop-blur-md sm:flex-row sm:items-center">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ink-secondary" />
                <span>
                  <strong>ข้อมูลติดต่อยังไม่สมบูรณ์</strong> กรุณาระบุเบอร์โทรศัพท์และ Social Media เพื่อเปิดใช้งานการจองและลงขายสินค้า
                </span>
              </div>
              <button
                type="button"
                onClick={onNavigateToProfile}
                className="shrink-0 rounded-full bg-[#191919] px-4 py-2 text-xs font-semibold text-white transition hover:bg-black"
              >
                ไปกรอกข้อมูลติดต่อ →
              </button>
            </div>
          </div>
        )}

        <div className={`relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 pb-12 text-center text-white sm:px-8 sm:pb-16 ${contactIncomplete ? 'translate-y-[-8px] sm:translate-y-[-18px]' : '-translate-y-8 sm:-translate-y-12'}`}>
          <div className="hero-enter">
            <h1 className="font-hero-display text-5xl leading-none tracking-tight text-white drop-shadow-lg sm:text-7xl lg:text-8xl">
              Campus Mart
            </h1>
            <p className="mt-5 text-lg font-medium text-white drop-shadow-md sm:mt-6 sm:text-2xl">
              ตลาดนัดมือสองของนักศึกษา
            </p>
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={scrollToFeed}
                className="inline-flex min-w-48 items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-[#191919] shadow-lg transition hover:-translate-y-0.5 hover:bg-white/90 focus-visible:outline-white"
              >
                เริ่มช้อปปิ้ง <ArrowDown className="h-4 w-4" />
              </button>
              {canSell && (
                <button
                  type="button"
                  onClick={onNavigateToCreate}
                  className="inline-flex min-w-48 items-center justify-center rounded-full border border-white/80 bg-black/20 px-7 py-3.5 text-base font-semibold text-white shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-black/40 focus-visible:outline-white"
                >
                  ลงขายสินค้า
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-clickup mx-auto px-4 sm:px-8 lg:px-10 pt-6 sm:pt-10">
        <div className="md:hidden mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-secondary absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="ค้นหาสินค้าใน มช."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full bg-surface-soft rounded-full py-3 pl-11 pr-4 text-body-sm focus:outline-none focus:ring-2 focus:ring-black/20 placeholder:text-ink-tertiary"
            />
          </div>
        </div>

      <ScrollReveal className="mb-12">
        <section aria-label="วิธีซื้อขาย" className="grid sm:grid-cols-3 border-y border-hairline py-5">
          <div className="flex items-center justify-center gap-3 py-2 sm:py-0 sm:px-5 sm:first:pl-0">
            <ShieldCheck className="w-5 h-5 text-ink" />
            <span className="text-body-sm font-medium">ชุมชนนักศึกษา มช.</span>
          </div>
          <div className="flex items-center justify-center gap-3 py-2 sm:py-0 sm:px-5 sm:border-l sm:border-hairline">
            <MapPin className="w-5 h-5 text-ink" />
            <span className="text-body-sm font-medium">นัดรับในมหาวิทยาลัย</span>
          </div>
          <div className="flex items-center justify-center gap-3 py-2 sm:py-0 sm:px-5 sm:border-l sm:border-hairline">
            <Handshake className="w-5 h-5 text-ink" />
            <span className="text-body-sm font-medium">ตกลงซื้อขายกันโดยตรง</span>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal className="mb-12">
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">เลือกดูตามหมวดหมู่</h2>
          </div>
          <div className="relative inline-flex self-start overflow-hidden rounded-full bg-surface-soft p-1 text-body-sm font-medium sm:self-auto">
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-black transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
                availabilityFilter === 'available' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <button
              onClick={() => setAvailabilityFilter('all')}
              aria-pressed={availabilityFilter === 'all'}
              className={`relative z-10 min-w-24 rounded-full px-4 py-2 transition-colors duration-300 ease-clickup motion-reduce:transition-none ${availabilityFilter === 'all' ? 'text-white' : 'text-ink-secondary hover:text-black'}`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setAvailabilityFilter('available')}
              aria-pressed={availabilityFilter === 'available'}
              className={`relative z-10 min-w-24 rounded-full px-4 py-2 transition-colors duration-300 ease-clickup motion-reduce:transition-none ${availabilityFilter === 'available' ? 'text-white' : 'text-ink-secondary hover:text-black'}`}
            >
              พร้อมซื้อ
            </button>
          </div>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const selected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                aria-pressed={selected}
                className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-3 text-left transition-colors ${selected ? 'bg-black border-black text-white' : 'bg-white border-hairline text-ink hover:border-black'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-body-sm font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      </ScrollReveal>

      <section id="marketplace-feed" className="scroll-mt-24">
        <ScrollReveal className="mb-5">
          <div className="flex items-end justify-between gap-4 pb-4 border-b border-hairline">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">สินค้าที่ลงขายล่าสุด</h2>
              <p className="mt-1 text-body-sm text-ink-secondary">
                {filteredProducts.length} รายการ{searchQuery && <> · ผลการค้นหา “{searchQuery}”</>}
              </p>
            </div>
            <button
              onClick={fetchProducts}
              aria-label="รีเฟรชสินค้า"
              className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-hairline hover:border-black transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="rounded-xl border border-hairline p-3 animate-pulse">
                <div className="aspect-[4/3] bg-surface-soft rounded-lg mb-4" />
                <div className="h-5 bg-surface-soft rounded w-1/3 mb-3" />
                <div className="h-4 bg-surface-soft rounded w-3/4 mb-5" />
                <div className="h-3 bg-surface-soft rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product, index) => (
              <ScrollReveal key={product.id} delay={(index % 4) * 70} className="h-full">
                <ProductCard product={product} onClick={() => onSelectProduct(product.id)} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal>
          <div className="text-center py-16 px-4 rounded-xl bg-surface">
            <AlertCircle className="w-9 h-9 text-ink-secondary mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold">ไม่พบสินค้าในหมวดหมู่นี้</h3>
            <p className="text-body-sm text-ink-secondary mt-2 max-w-sm mx-auto">
              ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะครับ
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); onSearchChange(''); }}
              className="btn-secondary-sm mt-5 px-5"
            >
              แสดงสินค้าทั้งหมด
            </button>
          </div>
          </ScrollReveal>
        )}
      </section>
      </div>
    </div>
  );
};
