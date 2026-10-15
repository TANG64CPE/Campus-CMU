import React from 'react';
import { Product } from '../types';
import { Clock, Check, Images } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { getProductImageUrls } from '../utils/productImages';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const formattedPrice = new Intl.NumberFormat('th-TH').format(product.price);
  const imageCount = getProductImageUrls(product).length;

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
        {imageCount > 1 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/80 px-2 py-1 text-[11px] font-medium text-white">
            <Images className="h-3.5 w-3.5" />
            {imageCount}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-2 flex items-baseline gap-1.5">
          <span className="text-sm font-medium text-ink-secondary">฿</span>
          <span className="font-display text-xl font-bold text-black">{formattedPrice}</span>
        </div>
        <h3 className="line-clamp-2 min-h-[44px] text-body-sm font-medium leading-relaxed text-black">
          {product.title}
        </h3>
      </div>
    </button>
  );
};
