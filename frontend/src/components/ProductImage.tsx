import React, { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { Product } from '../types';
import { getProductImageUrls, getProductReferenceImage } from '../utils/productImages';

interface ProductImageProps {
  product: Pick<Product, 'id' | 'title' | 'imageUrl' | 'imageUrls'>;
  className?: string;
  loading?: 'eager' | 'lazy';
}

export const ProductImage: React.FC<ProductImageProps> = ({ product, className = '', loading = 'lazy' }) => {
  const referenceImage = getProductReferenceImage(product.title);
  const [uploadedImageFailed, setUploadedImageFailed] = useState(false);
  const [referenceImageFailed, setReferenceImageFailed] = useState(false);

  useEffect(() => {
    setUploadedImageFailed(false);
    setReferenceImageFailed(false);
  }, [product.id, product.imageUrl, product.imageUrls, product.title]);

  const primaryImageUrl = getProductImageUrls(product)[0] || null;
  const imageUrl = primaryImageUrl && !uploadedImageFailed
    ? primaryImageUrl
    : referenceImage && !referenceImageFailed
      ? referenceImage
      : null;
  const isReferenceImage = Boolean(imageUrl && imageUrl === referenceImage);

  return (
    <>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.title}
          loading={loading}
          className={className}
          onError={() => {
            if (imageUrl === primaryImageUrl) setUploadedImageFailed(true);
            else setReferenceImageFailed(true);
          }}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-tertiary">
          <Tag className="h-8 w-8 stroke-[1.4]" />
          <span className="text-caption">ไม่มีรูปสินค้า</span>
        </div>
      )}
      {isReferenceImage && (
        <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-ink-secondary shadow-sm">
          ภาพตัวอย่าง
        </span>
      )}
    </>
  );
};
