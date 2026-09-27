import React from 'react';
import { Product } from '../types';
import { MapPin, Tag, Clock } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  // Format price with comma
  const formattedPrice = new Intl.NumberFormat('th-TH').format(product.price);

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-cmu-300 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Product Image Box */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to placeholder if image fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-slate-100 to-purple-100/60 p-4 text-center">
            <Tag className="w-10 h-10 text-cmu-400/80 mb-2 stroke-[1.5]" />
            <span className="text-xs font-medium text-slate-400">รูปภาพตัวอย่างสินค้า</span>
          </div>
        )}

        {/* Status Badge: "ติดจอง" Overlay */}
        {!product.isAvailable ? (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md shadow-amber-500/30 tracking-wide animate-pulse">
              <Clock className="w-3 h-3" />
              ติดจอง
            </span>
          </div>
        ) : (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              พร้อมส่งมอบ
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Price */}
          <div className="flex items-baseline gap-1 text-cmu-700 font-extrabold text-xl mb-1">
            <span className="text-sm font-bold">฿</span>
            <span>{formattedPrice}</span>
          </div>

          {/* Title */}
          <h3 className="font-medium text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-cmu-600 transition-colors">
            {product.title}
          </h3>
        </div>

        {/* Footer info: Location & Seller */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1 text-slate-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-cmu-500 shrink-0" />
            <span className="truncate">{product.meetupLocation}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate">โดย: {product.seller?.name || 'นักศึกษา มช.'}</span>
            <span className="font-mono">{product.seller?.studentId?.slice(-3) ? `รหัส ...${product.seller.studentId.slice(-3)}` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
