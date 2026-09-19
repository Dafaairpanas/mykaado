export function Logo({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className}
      fill="none"
      stroke="currentColor"
    >
      {/* Back card */}
      <g transform="rotate(10 50 50) translate(8, 0)">
        <rect x="20" y="15" width="55" height="70" rx="6" strokeWidth="6" strokeLinejoin="round" fill="var(--color-bg-main, #FAF9F5)" />
      </g>
      
      {/* Front card */}
      <g transform="rotate(-8 50 50) translate(-5, 5)">
        <rect x="20" y="15" width="55" height="70" rx="6" strokeWidth="6" strokeLinejoin="round" fill="var(--color-bg-main, #FAF9F5)" />
        {/* Kanji 学 (simplified representation) */}
        <text 
          x="47.5" 
          y="58" 
          fontSize="40" 
          fontWeight="bold" 
          fontFamily="var(--font-jp), sans-serif" 
          textAnchor="middle" 
          fill="currentColor" 
          stroke="none"
        >
          学
        </text>
      </g>
    </svg>
  );
}
