import { useState } from 'react';
import { Package } from 'lucide-react';

const SIZE_MAP = {
  xs: { width: 26, height: 26, iconSize: 13, radius: 4 },
  sm: { width: 34, height: 34, iconSize: 15, radius: 5 },
  md: { width: 44, height: 44, iconSize: 20, radius: 6 },
  lg: { width: 64, height: 64, iconSize: 26, radius: 8 },
  xl: { width: 140, height: 140, iconSize: 40, radius: 8 },
  full: { width: '100%', height: '100%', iconSize: 32, radius: 0 }
};

export default function ProductThumbnail({
  src,
  alt = 'Product image',
  size = 'sm',
  className = '',
  style = {}
}) {
  const [hasError, setHasError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
  }
  const sizeConfig = SIZE_MAP[size] || (typeof size === 'number' ? { width: size, height: size, iconSize: Math.round(size * 0.45), radius: 6 } : SIZE_MAP.sm);

  const containerStyle = {
    width: typeof sizeConfig.width === 'number' ? `${sizeConfig.width}px` : sizeConfig.width,
    height: typeof sizeConfig.height === 'number' ? `${sizeConfig.height}px` : sizeConfig.height,
    borderRadius: `${sizeConfig.radius}px`,
    backgroundColor: 'var(--bg-surface-secondary)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
    ...style
  };

  if (!src || hasError) {
    return (
      <div
        className={`product-thumbnail-placeholder ${className}`}
        style={containerStyle}
        title={alt}
      >
        <Package
          size={sizeConfig.iconSize}
          style={{ color: 'var(--text-muted)', opacity: 0.7 }}
        />
      </div>
    );
  }

  return (
    <div className={`product-thumbnail ${className}`} style={containerStyle}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    </div>
  );
}
