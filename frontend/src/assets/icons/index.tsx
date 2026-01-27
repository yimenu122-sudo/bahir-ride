export const BahirRideLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#a)">
      <path d="M40 30c0-11.046-8.954-20-20-20S0 18.954 0 30s8.954 20 20 20 20-8.954 20-20Z" fill="#2563EB"/>
      <path d="M20 18a2 2 0 0 1 2 2v20a2 2 0 1 1-4 0V20a2 2 0 0 1 2-2Z" fill="#fff"/>
      <path d="M12 26a2 2 0 0 1 2 2v6a2 2 0 1 1-4 0v-6a2 2 0 0 1 2-2ZM28 26a2 2 0 0 1 2 2v6a2 2 0 1 1-4 0v-6a2 2 0 0 1 2-2Z" fill="#fff"/>
    </g>
    <text x="50" y="38" fontFamily="Outfit, sans-serif" fontWeight="bold" fontSize="24" fill="#111827">Bahir Ride</text>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h200v60H0z"/>
      </clipPath>
    </defs>
  </svg>
);

export const CarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

export const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);
