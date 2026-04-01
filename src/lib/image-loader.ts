/**
 * Custom image loader — routes Cloudinary images through Cloudinary's own
 * URL-based transformation pipeline instead of Vercel Image Optimization.
 *
 * Architecture rationale:
 * ─────────────────────
 * Before: Browser → Vercel Edge → /_next/image (optimization) → Cloudinary → back
 *   - Every srcSet width × every unique image = a Vercel "Image Transformation"
 *   - Each transformation counted against Vercel plan limits
 *   - Double optimization: Cloudinary already stores 1200×1200 WebP
 *
 * After:  Browser → Cloudinary CDN (direct, single hop)
 *   - Cloudinary applies f_auto (AVIF where supported), q_auto, w_{width}
 *   - Zero Vercel Image Optimization usage
 *   - Faster TTFB: one fewer proxy hop
 *   - Cloudinary CDN caches each variant at the edge
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Cloudinary URLs: insert on-the-fly transformation params
  // e.g. /upload/ → /upload/f_auto,q_auto,w_400/
  if (src.includes("res.cloudinary.com")) {
    const params = [`f_auto`, `q_${quality || "auto"}`, `w_${width}`];
    return src.replace("/upload/", `/upload/${params.join(",")}/`);
  }

  // Local /public images (logos, favicons): serve as-is from origin.
  // These are small static assets that don't benefit from resizing.
  return src;
}
