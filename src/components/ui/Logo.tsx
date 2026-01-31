'use client';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 32, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Left half - Body (amber) */}
        <path
          d="M16 2 A14 14 0 0 0 16 30"
          fill="#E8A854"
        />
        {/* Right half - Mind (teal) */}
        <path
          d="M16 2 A14 14 0 0 1 16 30"
          fill="#5BCCB3"
        />
      </svg>
      {showText && (
        <span className="text-xl font-bold text-text-primary">
          BODY <span className="text-text-muted">&amp;</span> MIND
        </span>
      )}
    </div>
  );
}
