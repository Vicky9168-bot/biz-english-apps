import Image from 'next/image'

// 品牌 logo（圖形＋字標）。SVG 由 tools/brand/make_logo.py 產生，放在 public/brand/。
// 原檔四周留了一圈空白，所以高度要比字面上的大一點才會看起來合適。
export function BrandLogo({ className = 'h-11 w-auto' }: { className?: string }) {
  return (
    <Image
      src="/brand/bizvoice-logo.svg"
      alt="BizVoice"
      width={327}
      height={102}
      unoptimized
      priority
      className={className}
    />
  )
}
