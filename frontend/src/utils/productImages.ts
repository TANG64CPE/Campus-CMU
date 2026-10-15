export const MAX_PRODUCT_IMAGES = 5;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export function getProductImageUrls(
  product?: { imageUrl?: string | null; imageUrls?: string[] | null } | null
): string[] {
  const urls = (product?.imageUrls ?? []).filter(Boolean);
  if (urls.length) return urls;
  return product?.imageUrl ? [product.imageUrl] : [];
}

/**
 * Local reference photos for the demo listings, matched by the product title.
 * They are illustrative only; a seller-uploaded image always takes priority.
 * Sources: clickelectronica.com, thebookbun.com, miswag.com, osaoldbook2.com,
 * and megaofficesupplies.com.au.
 */
const productImageReferences: Array<{ pattern: RegExp; src: string }> = [
  { pattern: /esp32|micro.?usb|microcontroller/i, src: '/product-images/esp32.jpg' },
  { pattern: /แคลคูลัส|calculus/i, src: '/product-images/calculus.jpg' },
  { pattern: /apple\s*pencil/i, src: '/product-images/apple-pencil-2.jpg' },
  { pattern: /ฟิสิกส์|physics/i, src: '/product-images/physics-1.jpg' },
  { pattern: /logitech\s*k380|คีย์บอร์ดบลูทูธ/i, src: '/product-images/logitech-k380.png' },
];

export const getProductReferenceImage = (title: string): string | null =>
  productImageReferences.find(({ pattern }) => pattern.test(title))?.src || null;
