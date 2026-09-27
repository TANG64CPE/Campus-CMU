import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { productApi } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { Search, SlidersHorizontal, BookOpen, Cpu, Home, PenTool, Layers, AlertCircle, RefreshCw } from 'lucide-react';

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
    { id: 'all', label: 'ทั้งหมด', icon: Layers },
    { id: 'micro', label: 'ไมโครคอนโทรลเลอร์ & IT', icon: Cpu, keyword: 'บอร์ด|ESP32|คีย์บอร์ด|Apple|IT|Pencil|จอ' },
    { id: 'books', label: 'หนังสือเรียน & เอกสาร', icon: BookOpen, keyword: 'หนังสือ|แคลคูลัส|ฟิสิกส์|ชีท|ข้อสอบ' },
    { id: 'arch', label: 'เครื่องเขียน & สถาปัตย์', icon: PenTool, keyword: 'สถาปัตย์|กระดาน|ไม้ที|สี' },
    { id: 'dorm', label: 'ของใช้หอพัก', icon: Home, keyword: 'หอ|พัดลม|โคมไฟ|กล่อง' },
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* Mobile Search Bar */}
      <div className="md:hidden mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาหนังสือ, บอร์ดไมโครคอนโทรลเลอร์..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-500 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Banner / CMU Welcome Tagline */}
      <div className="bg-gradient-to-r from-cmu-800 via-cmu-700 to-cmu-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-cmu-600/15 mb-6 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md mb-3">
            <span>ม่วง-ทอง มช. ตลาดนัดปลอดภัย</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ส่งต่อของใช้มือสอง ภายใน มช.
          </h2>
          <p className="text-purple-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
            พบกันที่หอสมุด ลานสัก หรือโรงอาหาร มช. ตรวจสอบสินค้าและจ่ายเงินตัวต่อตัว ไม่ต้องกังวลเรื่องการโกง
          </p>
        </div>
      </div>

      {/* Horizontal Category Scroll (Mobile-First UI) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">หมวดหมู่สินค้า</h3>
          {/* Availability Filter Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-600">
            <button
              onClick={() => setAvailabilityFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                availabilityFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setAvailabilityFilter('available')}
              className={`px-3 py-1 rounded-lg transition-all ${
                availabilityFilter === 'available'
                  ? 'bg-white text-cmu-700 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              พร้อมส่งมอบ
            </button>
          </div>
        </div>

        {/* Scrollable Categories Strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-all shadow-sm ${
                  isSelected
                    ? 'bg-cmu-600 text-white shadow-cmu-600/25 ring-2 ring-cmu-600 ring-offset-2'
                    : 'bg-white text-slate-700 border border-slate-200/80 hover:border-cmu-300 hover:bg-purple-50/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-cmu-600'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Feed Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500 font-medium">
          พบ <span className="font-bold text-slate-800">{filteredProducts.length}</span> รายการ
          {searchQuery && ` สำหรับ "${searchQuery}"`}
        </p>

        <button
          onClick={fetchProducts}
          className="text-xs text-slate-500 hover:text-cmu-600 flex items-center gap-1.5"
          title="รีเฟรชข้อมูล"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเฟรช</span>
        </button>
      </div>

      {/* Products Grid (CSS Grid Card) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
              <div className="aspect-[4/3] bg-slate-200 rounded-xl mb-3"></div>
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
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
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm my-6">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">ไม่พบสินค้าในหมวดนี้</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นดูนะครับ
          </p>
        </div>
      )}
    </div>
  );
};
