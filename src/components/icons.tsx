import type { SVGProps } from 'react';

// Hand-drawn, woodcut-flavoured icon set so nothing looks like a stock SaaS
// glyph. All use currentColor and a chunky stroke. API matches how the old
// icon libs were called: <Icon size={14} className="..." />.
export type IconProps = {
  size?: number;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>;

function Svg({
  size = 16,
  className,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ── File operations ─────────────────────────────────────────── */

// New: a fresh curled scroll with a quill plus
export const NewIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3h7l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M14 3v4h4" />
    <path d="M9.5 13.5h5M12 11v5" />
  </Svg>
);

// Open: an open book
export const OpenIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6C9.5 4.5 6.5 4.5 4 6v12c2.5-1.5 5.5-1.5 8 0 2.5-1.5 5.5-1.5 8 0V6c-2.5-1.5-5.5-1.5-8 0z" />
    <path d="M12 6v12" />
  </Svg>
);

// Save: a treasure chest
export const SaveIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10l1.5-3h13L20 10v9H4z" />
    <path d="M4 10h16" />
    <path d="M10.5 10v3h3v-3" />
    <path d="M12 13v2" />
  </Svg>
);

// Print: a stamping press
export const PrintIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 9V4h10v5" />
    <path d="M5 9h14a1 1 0 0 1 1 1v5h-3v5H8v-5H5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z" />
    <path d="M8 15h8" />
  </Svg>
);

// Two stacked pages (duplex)
export const PagesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 3h6l4 4v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M15 3v4h4" />
    <path d="M5 7v13a1 1 0 0 0 1 1h9" />
  </Svg>
);

/* ── Zoom ────────────────────────────────────────────────────── */

export const ZoomInIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="M15.5 15.5L20 20" />
    <path d="M11 8.5v5M8.5 11h5" />
  </Svg>
);

export const ZoomOutIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="M15.5 15.5L20 20" />
    <path d="M8.5 11h5" />
  </Svg>
);

/* ── Status ──────────────────────────────────────────────────── */

export const DotIcon = ({ size = 10, className, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="12" r="6" fill="currentColor" />
  </svg>
);

// Warning: a little banner/shield with a bang
export const AlertIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4l8.5 15H3.5z" />
    <path d="M12 10v4" />
    <path d="M12 16.5v.5" />
  </Svg>
);

/* ── Sound (a herald's horn) ─────────────────────────────────── */

export const SoundOnIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z" />
    <path d="M16 9.5c1.4 1.3 1.4 3.7 0 5" />
    <path d="M18.5 7.5c2.6 2.4 2.6 6.6 0 9" />
  </Svg>
);

export const SoundOffIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z" />
    <path d="M16.5 10l4 4M20.5 10l-4 4" />
  </Svg>
);

/* ── Rich-text toolbar ───────────────────────────────────────── */

export const BoldIcon = (p: IconProps) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M8 5h5a3.3 3.3 0 0 1 0 6.6H8z" />
    <path d="M8 11.6h6a3.4 3.4 0 0 1 0 7H8z" />
  </Svg>
);

export const ItalicIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 5h6M8 19h6M14 5l-4 14" />
  </Svg>
);

export const HeadingIcon = (p: IconProps) => (
  <Svg strokeWidth={2} {...p}>
    <path d="M6 5v14M14 5v14M6 12h8" />
    <path d="M17.5 10.5c.6-.6 1.5-.7 2.1-.1.7.7.4 1.6-.3 2.2L17.5 15h4" />
  </Svg>
);

export const QuoteIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M5 9c0-1.5 1-2.5 2.5-2.5v2c-.6 0-1 .4-1 1V11h2v4H5z"
      fill="currentColor"
    />
    <path
      d="M14 9c0-1.5 1-2.5 2.5-2.5v2c-.6 0-1 .4-1 1V11h2v4h-4z"
      fill="currentColor"
    />
  </Svg>
);

export const BulletListIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="5" cy="6" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="5" cy="18" r="1.4" fill="currentColor" stroke="none" />
  </Svg>
);

export const NumberListIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10 6h10M10 12h10M10 18h10" />
    <path d="M4 5.5l1-.5v4" strokeWidth={1.4} />
    <path d="M3.6 11.4c.3-.6 1.4-.6 1.6.1.2.6-.4 1-1.6 2h2" strokeWidth={1.4} />
  </Svg>
);

/* ── Sidebar block controls ──────────────────────────────────── */

export const ArrowUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19V6" />
    <path d="M6 11l6-6 6 6" />
  </Svg>
);

export const ArrowDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v13" />
    <path d="M6 13l6 6 6-6" />
  </Svg>
);

// Delete: a lit bomb (it goes boom)
export const BombIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="15" r="6" />
    <path d="M15.2 10.8L17 9" />
    <path d="M17 9l2-1.5M19 9l-1.5-2.5M19.6 7.2L21 7" />
    <path d="M9 13.5a2.5 2.5 0 0 1 2-1.2" strokeWidth={1.3} />
  </Svg>
);

/* ── Generic ─────────────────────────────────────────────────── */

export const CheckIcon = ({ className, ...p }: IconProps) => (
  <Svg className={className} {...p}>
    <path d="M5 13l4 4L19 7" />
  </Svg>
);

export const ChevronDownIcon = ({ className, ...p }: IconProps) => (
  <Svg className={className} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

export const ChevronUpIcon = ({ className, ...p }: IconProps) => (
  <Svg className={className} {...p}>
    <path d="M6 15l6-6 6 6" />
  </Svg>
);

export const CloseIcon = ({ className, ...p }: IconProps) => (
  <Svg className={className} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

// Decorative: crossed quill + scroll, for empty states / flourishes
export const QuillScrollIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 16c0-2 1-3 3-3h6c2 0 3 1 3 3v1a2 2 0 0 1-2 2H7" />
    <path d="M19 5c-3 1-6 4-7 8" />
    <path d="M12 13l-1.5.5L11 12z" fill="currentColor" />
  </Svg>
);
