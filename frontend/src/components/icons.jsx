function Icon({ children, className = 'h-5 w-5', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function Logo({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
      <rect width="32" height="32" rx="8" fill="#4f46e5" />
      <path d="M9 11h14M9 16h14M9 21h9" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export const IconDashboard = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </Icon>
);

export const IconTransfers = (p) => (
  <Icon {...p}>
    <path d="m16 3 4 4-4 4" />
    <path d="M20 7H4" />
    <path d="m8 21-4-4 4-4" />
    <path d="M4 17h16" />
  </Icon>
);

export const IconPlus = (p) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Icon>
);

export const IconWallet = (p) => (
  <Icon {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <path d="M16 14h2" />
  </Icon>
);

export const IconArrowUpRight = (p) => (
  <Icon {...p}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </Icon>
);

export const IconArrowDownLeft = (p) => (
  <Icon {...p}>
    <path d="M17 7 7 17" />
    <path d="M16 17H7V8" />
  </Icon>
);

export const IconChevronLeft = (p) => (
  <Icon {...p}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const IconLogout = (p) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
);

export const IconClock = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

export const IconSparkles = (p) => (
  <Icon {...p}>
    <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" />
    <path d="M19 5v3M20.5 6.5h-3" />
  </Icon>
);

export const IconTrendingUp = (p) => (
  <Icon {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M17 7h4v4" />
  </Icon>
);

export const IconTrendingDown = (p) => (
  <Icon {...p}>
    <path d="M3 7l6 6 4-4 8 8" />
    <path d="M17 17h4v-4" />
  </Icon>
);

export const IconScale = (p) => (
  <Icon {...p}>
    <path d="M12 3v18" />
    <path d="M7 7h10" />
    <path d="M7 21h10" />
    <path d="m7 7-3 6a3 3 0 0 0 6 0z" />
    <path d="m17 7-3 6a3 3 0 0 0 6 0z" />
  </Icon>
);

export const IconArrowRight = (p) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Icon>
);

export const IconShield = (p) => (
  <Icon {...p}>
    <path d="M12 3l8 3v5c0 4.5-3 7.6-8 9-5-1.4-8-4.5-8-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const IconBolt = (p) => (
  <Icon {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
  </Icon>
);

export const IconLayers = (p) => (
  <Icon {...p}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
  </Icon>
);

