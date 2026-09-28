import React from 'react';
import { Product } from '../types';
import { MapPin, Tag, Clock, CheckCircle2 } from 'lucide-react';

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
      className="group card-feature p-0 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[4/3] bg-surface overflow-hidden border-b border-hairline">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[250ms] ease-clickup"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-surface p-4 text-center">
            <Tag className="w-8 h-8 text-ink-disabled mb-2 stroke-[1.5]" />
            <span className="text-caption font-mono text-ink-tertiary">ภาพตัวอย่างสินค้า</span>
          </div>
        )}

        {/* Status Badge: ClickUp badge-pill style */}
        {!product.isAvailable ? (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-sm text-brand-orange border border-brand-orange/30 shadow-tinted-xs">
              <Clock className="w-3 h-3" />
              ติดจอง
            </span>
          </div>
        ) : (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 backdrop-blur-sm text-accent-green border border-accent-green/30 shadow-tinted-xs">
              <CheckCircle2 className="w-3 h-3" />
              พร้อมส่งมอบ
            </span>
          </div>
        )}
      </div>

      {/* Card Content — 24px padding per card-feature spec */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Price — Plus Jakarta Sans display-md tracking */}
          <div className="flex items-baseline gap-1 font-display font-extrabold text-[20px] text-ink-deep mb-1.5 tracking-tight-sm">
            <span className="text-sm font-semibold text-ink-tertiary">฿</span>
            <span>{formattedPrice}</span>
          </div>

          {/* Title — Graphite Ink body-sm */}
          <h3 className="font-sans font-semibold text-ink text-body-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-[250ms] ease-clickup">
            {product.title}
          </h3>
        </div>

        {/* Footer Meta: Location & Seller with Sometype Mono Student ID */}
        <div className="mt-3 pt-3 border-t border-hairline flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-ink-secondary font-medium text-caption">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{product.meetupLocation}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
            <span className="truncate">โดย: {product.seller?.name || 'นักศึกษา มช.'}</span>
            <span className="font-mono bg-surface-soft px-1.5 py-0.5 rounded-xxs border border-hairline text-ink-secondary text-[10px]">
              {product.seller?.studentId ? `...${product.seller.studentId.slice(-3)}` : 'CMU'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
