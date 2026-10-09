import type { Resource } from '../engine/types';

const PATHS: Record<Resource, JSX.Element> = {
  // Rupee coin
  cash: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 8h7M8.5 11h7M11 8c2.5 0 3 3 0 3H9l5 5" />
    </>
  ),
  // Phone
  users: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.2" />
      <path d="M11 17.5h2" />
    </>
  ),
  // Two people
  team: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M15.5 14.2c2.4-.3 4.5 1.2 5 4.3" />
    </>
  ),
  // Megaphone
  cred: (
    <>
      <path d="M4 10v4h3l7 4V6L7 10H4z" />
      <path d="M17.5 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M7 14l1.2 5h2.3L9.6 15" />
    </>
  ),
};

export function ResourceIcon({ kind, size = 16 }: { kind: Resource; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[kind]}
    </svg>
  );
}
