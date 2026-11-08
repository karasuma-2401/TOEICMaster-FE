import type { ReactNode, SVGProps } from "react";

// Inline stroke icons (lucide geometry) so Speaking adds no shared dependency.
function icon(body: ReactNode) {
  return function Icon({
    size = 18,
    ...props
  }: SVGProps<SVGSVGElement> & { size?: number }) {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
        width={size}
        {...props}
      >
        {body}
      </svg>
    );
  };
}

export const MicIcon = icon(
  <>
    <rect height="13" rx="3" width="6" x="9" y="2" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
  </>,
);
export const MicOffIcon = icon(
  <>
    <path d="m2 2 20 20M18.9 13a7 7 0 0 0 .1-1v-2M5 10v2a7 7 0 0 0 11.5 5.3M15 9.3V5a3 3 0 0 0-5.7-1.3M9 9v3a3 3 0 0 0 4.9 2.3M12 19v3" />
  </>,
);
export const HeadphonesIcon = icon(
  <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />,
);
export const AudioLinesIcon = icon(
  <path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3" />,
);
export const TimerIcon = icon(
  <>
    <path d="M10 2h4M12 14l3-3" />
    <circle cx="12" cy="14" r="8" />
  </>,
);
export const CheckIcon = icon(<path d="M20 6 9 17l-5-5" />);
export const CheckCircleIcon = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </>,
);
export const CircleIcon = icon(<circle cx="12" cy="12" r="10" />);
export const XIcon = icon(<path d="M18 6 6 18M6 6l12 12" />);
export const AlertTriangleIcon = icon(
  <>
    <path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" />
    <path d="M12 9v4M12 17h.01" />
  </>,
);
export const AlertCircleIcon = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </>,
);
export const InfoIcon = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </>,
);
export const LockIcon = icon(
  <>
    <rect height="11" rx="2" width="18" x="3" y="11" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>,
);
export const ClockIcon = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>,
);
export const AwardIcon = icon(
  <>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1" />
  </>,
);
export const PlayIcon = icon(<path d="m6 3 14 9-14 9V3Z" />);
export const SquareIcon = icon(
  <rect height="14" rx="2" width="14" x="5" y="5" />,
);
export const PencilIcon = icon(
  <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />,
);
export const ArchiveIcon = icon(
  <>
    <rect height="5" rx="1" width="20" x="2" y="3" />
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" />
  </>,
);
export const FileTextIcon = icon(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
    <path d="M14 2v6h6M16 13H8M16 17H8" />
  </>,
);
export const MonitorIcon = icon(
  <>
    <rect height="14" rx="2" width="20" x="2" y="3" />
    <path d="M8 21h8M12 17v4" />
  </>,
);
export const LinkIcon = icon(
  <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />,
);
export const ArrowLeftIcon = icon(<path d="m12 19-7-7 7-7M19 12H5" />);
export const LoaderIcon = icon(<path d="M21 12a9 9 0 1 1-6.2-8.6" />);
export const SearchIcon = icon(
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </>,
);
export const ArrowRightIcon = icon(<path d="M5 12h14M12 5l7 7-7 7" />);
