export const MAX_PRODUCT_IMAGES = 5;

export function resolveProductImageUrls(
  imageUrl?: string | null,
  imageUrls?: string[] | null
): string[] {
  const urls = (imageUrls ?? []).map((url) => url.trim()).filter(Boolean);
  if (urls.length) {
    return [...new Set(urls)];
  }

  const fallback = imageUrl?.trim();
  return fallback ? [fallback] : [];
}
