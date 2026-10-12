import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { productApi } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { ProductImage } from '../components/ProductImage';
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
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface MarketplacePageProps {
  onSelectProduct: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onProductsLoaded?: () => void;
}
export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  onSelectProduct,
  searchQuery,
  onSearchChange,
  onProductsLoaded,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'available' | 'all'>('all');
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  const categories = [
    { id: 'all', label: 'ทั้งหมด', icon: Layers, countLabel: 'All items' },
    { id: 'micro', label: 'ฮาร์ดแวร์ & IT', icon: Cpu, keyword: 'บอร์ด|ESP32|คีย์บอร์ด|Apple|IT|Pencil|จอ|สาย|RAM', countLabel: 'Hardware' },
    { id: 'books', label: 'หนังสือเรียน & เอกสาร', icon: BookOpen, keyword: 'หนังสือ|แคลคูลัส|ฟิสิกส์|ชีท|ข้อสอบ|เคมี|Textbook', countLabel: 'Books & sheets' },
    { id: 'arch', label: 'เครื่องเขียน & สถาปัตย์', icon: PenTool, keyword: 'สถาปัตย์|กระดาน|ไม้ที|สี|โมเดล|Copic', countLabel: 'Art & design' },
    { id: 'dorm', label: 'ของใช้หอพัก', icon: Home, keyword: 'หอ|พัดลม|โคมไฟ|กล่อง|หม้อ|ตู้|ราว', countLabel: 'Dorm essentials' },
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
    const category = categories.find((item) => item.id === selectedCategory);
    return !category?.keyword || new RegExp(category.keyword, 'i').test(product.title);
  });
  const heroProducts = products.slice(0, 3);
  const activeHeroProduct = heroProducts.length > 0
    ? heroProducts[activeHeroIndex % heroProducts.length]
    : null;

  useEffect(() => {
    if (heroProducts.length < 2) return;
    const interval = window.setInterval(() => {
      setActiveHeroIndex((index) => (index + 1) % heroProducts.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [heroProducts.length]);

  const scrollToFeed = () => document.getElementById('marketplace-feed')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="max-w-clickup mx-auto px-4 sm:px-8 lg:px-10 pt-6 sm:pt-10 pb-20">
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

      <section className="grid lg:grid-cols-[1.12fr_0.88fr] gap-6 lg:gap-8 items-stretch mb-14 sm:mb-16">
        <div className="flex flex-col justify-center py-4 sm:py-8 lg:py-10">
          <p className="eyebrow-mono text-ink-secondary mb-4">CAMPUSMART · CHIANG MAI UNIVERSITY</p>
          <h1 className="font-display text-[38px] sm:text-[52px] leading-[1.14] font-bold max-w-2xl">
            ของดีใกล้ตัว
            <br />
            ส่งต่อกันใน มช.
          </h1>
          <p className="mt-5 max-w-xl text-body-md text-ink-secondary leading-relaxed">
            ตลาดมือสองของนักศึกษา มหาวิทยาลัยเชียงใหม่ เลือกซื้อของใช้ต่อจากเพื่อน นัดรับในมหาวิทยาลัย แล้วชำระเงินกันโดยตรง
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button onClick={scrollToFeed} className="btn-primary-pill px-6 py-3">
              เลือกดูสินค้า <ArrowDown className="w-4 h-4" />
            </button>
            <span className="text-body-sm text-ink-secondary">ซื้อขายกันง่าย ๆ ในแคมปัส</span>
          </div>
        </div>

        <div className="relative min-h-[260px] sm:min-h-[300px] overflow-hidden rounded-xl bg-surface-soft">
          {activeHeroProduct ? (
            <>
              <button
                type="button"
                onClick={() => onSelectProduct(activeHeroProduct.id)}
                aria-label={`ดูสินค้า ${activeHeroProduct.title}`}
                className="absolute inset-0 w-full text-left"
              >
                <ProductImage
                  product={activeHeroProduct}
                  loading="eager"
                  className="h-full w-full object-cover"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/5" />
                <div className="absolute inset-x-0 bottom-0 z-10 p-6 pr-24 text-white sm:p-8 sm:pr-28">
                  <p className="eyebrow-mono mb-2 text-white/80">สินค้าแนะนำในแคมปัส</p>
                  <h2 className="line-clamp-2 text-xl font-bold leading-snug text-white sm:text-2xl">
                    {activeHeroProduct.title}
                  </h2>
                  <p className="mt-2 text-lg font-semibold text-white">
                    ฿{new Intl.NumberFormat('th-TH').format(activeHeroProduct.price)}
                  </p>
                </div>
              </button>

              {!activeHeroProduct.imageUrl && (
                <span className="absolute bottom-4 right-4 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-ink-secondary">
                  ภาพตัวอย่าง
                </span>
              )}

              {heroProducts.length > 1 && (
                <>
                  <span className="absolute right-5 top-5 z-20 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                    {String((activeHeroIndex % heroProducts.length) + 1).padStart(2, '0')} / {String(heroProducts.length).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveHeroIndex((index) => (index - 1 + heroProducts.length) % heroProducts.length)}
                    aria-label="ดูสินค้าก่อนหน้า"
                    className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-colors hover:bg-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHeroIndex((index) => (index + 1) % heroProducts.length)}
                    aria-label="ดูสินค้าถัดไป"
                    className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition-colors hover:bg-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5">
                    {heroProducts.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setActiveHeroIndex(index)}
                        aria-label={`ดูสินค้าแนะนำรายการที่ ${index + 1}`}
                        aria-pressed={index === activeHeroIndex % heroProducts.length}
                        className={`h-2 rounded-full transition-all ${index === activeHeroIndex % heroProducts.length ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center sm:min-h-[300px]">
              <p className="text-body-sm text-ink-secondary">
                {loading ? 'กำลังโหลดสินค้าแนะนำ…' : 'ยังไม่มีสินค้าแนะนำ'}
              </p>
            </div>
          )}
        </div>
      </section>

      <section aria-label="วิธีซื้อขาย" className="grid sm:grid-cols-3 border-y border-hairline py-5 mb-12">
        <div className="flex items-center gap-3 py-2 sm:py-0 sm:px-5 sm:first:pl-0">
          <ShieldCheck className="w-5 h-5 text-ink" />
          <span className="text-body-sm font-medium">ชุมชนนักศึกษา มช.</span>
        </div>
        <div className="flex items-center gap-3 py-2 sm:py-0 sm:px-5 sm:border-l sm:border-hairline">
          <MapPin className="w-5 h-5 text-ink" />
          <span className="text-body-sm font-medium">นัดรับในมหาวิทยาลัย</span>
        </div>
        <div className="flex items-center gap-3 py-2 sm:py-0 sm:px-5 sm:border-l sm:border-hairline">
          <Handshake className="w-5 h-5 text-ink" />
          <span className="text-body-sm font-medium">ตกลงซื้อขายกันโดยตรง</span>
        </div>
      </section>

      <section className="mb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-5">
          <div>
            <p className="eyebrow-mono text-ink-secondary mb-1">BROWSE BY CATEGORY</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">เลือกดูตามหมวดหมู่</h2>
          </div>
          <div className="inline-flex self-start sm:self-auto p-1 bg-surface-soft rounded-full text-body-sm font-medium">
            <button
              onClick={() => setAvailabilityFilter('all')}
              className={`rounded-full px-4 py-2 transition-colors ${availabilityFilter === 'all' ? 'bg-black text-white' : 'text-ink-secondary hover:text-black'}`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setAvailabilityFilter('available')}
              className={`rounded-full px-4 py-2 transition-colors ${availabilityFilter === 'available' ? 'bg-black text-white' : 'text-ink-secondary hover:text-black'}`}
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

      <section id="marketplace-feed" className="scroll-mt-24">
        <div className="flex items-end justify-between gap-4 mb-5 pb-4 border-b border-hairline">
          <div>
            <p className="eyebrow-mono text-ink-secondary mb-1">CAMPUS FINDS</p>
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
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onClick={() => onSelectProduct(product.id)} />
            ))}
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
};
