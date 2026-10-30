// components/icons/CategoryIcons.tsx
import type { FC, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const categoryIcons: Record<string, FC<IconProps>> = {
  parfums: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 3h6l3 7v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V10l3-7z" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="14" y2="18" />
    </svg>
  ),
  montres: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="7" />
      <polyline points="12 9 12 12 14.5 14.5" />
      <path d="M12 2v2M12 20v2M5.13 5.13L6.5 6.5M18.5 18.5l1.37 1.37" />
    </svg>
  ),
  telephones: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  ),
  lunettes: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="7" cy="14" r="3" />
      <circle cx="17" cy="14" r="3" />
      <path d="M10 14h4M4 10l3-4h10l3 4" />
    </svg>
  ),
  accessoires: (props) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8 6l-2 4h12l-2-4" />
      <rect x="6" y="10" width="12" height="9" rx="1.5" />
      <circle cx="12" cy="14.5" r="2.5" />
    </svg>
  ),
};

export function CategoryIcon({
  name,
  className,
  ...props
}: {
  name: string;
  className?: string;
} & Omit<IconProps, "children">) {
  const Icon = categoryIcons[name];
  if (!Icon) return null;
  return <Icon className={className} {...props} />;
}