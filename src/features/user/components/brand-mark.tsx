/** TOEICMaster logo: a speech bubble carrying the letter T. */
export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 38 38">
      <defs>
        <linearGradient id="brand-mark-fill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#b31322" />
          <stop offset="1" stopColor="#ef6a1f" />
        </linearGradient>
      </defs>
      <path
        d="M8 2h22a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H18l-8 6v-6H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6Z"
        fill="url(#brand-mark-fill)"
      />
      <path
        d="M11 8h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5v11a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V13h-5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        fill="#fff"
      />
    </svg>
  );
}
