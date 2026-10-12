import React from 'react';
import { Product } from '../types';
import { MapPin, Clock, Check } from 'lucide-react';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const formattedPrice = new Intl.NumberFormat('th-TH').format(product.price);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl border border-hairline bg-white text-left transition-colors hover:border-black focus-visible:outline-black"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-soft">
        <ProductImage
          product={product}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
        />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${product.isAvailable ? 'bg-black text-white' : 'bg-white text-black'}`}>
          {product.isAvailable ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {product.isAvailable ? 'พร้อมซื้อ' : 'มีคนจองแล้ว'}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-2 flex items-baseline gap-1.5">
          <span className="text-sm font-medium text-ink-secondary">฿</span>
          <span className="font-display text-xl font-bold text-black">{formattedPrice}</span>
        </div>
        <h3 className="line-clamp-2 min-h-[44px] text-body-sm font-medium leading-relaxed text-black group-hover:underline decoration-1 underline-offset-4">
          {product.title}
        </h3>
        <div className="mt-4 flex items-center gap-2 border-t border-hairline pt-3 text-caption text-ink-secondary">
          <MapPin className="h-4 w-4 shrink-0 text-black" />
          <span className="truncate">{product.meetupLocation}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-caption text-ink-tertiary">
          <span className="truncate">ลงขายโดย {product.seller?.name || 'นักศึกษา มช.'}</span>
          <span className="shrink-0">{product.seller?.studentId ? `#${product.seller.studentId.slice(-3)}` : 'CMU'}</span>
        </div>
      </div>
    </button>
  );
};
