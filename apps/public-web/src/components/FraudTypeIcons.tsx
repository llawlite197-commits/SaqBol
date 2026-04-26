type IconProps = {
  className?: string;
};

export function PhoneFraudIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20.5 10.5h8.2c1.5 0 2.8 1 3.2 2.5l2.3 8.4c.4 1.4-.2 2.9-1.4 3.7l-4.8 3.2c3.1 6.5 8.3 11.7 14.8 14.8l3.2-4.8c.8-1.2 2.3-1.8 3.7-1.4l8.4 2.3c1.5.4 2.5 1.7 2.5 3.2v8.2c0 2.4-2 4.4-4.4 4.3C30.4 54.1 9.9 33.6 9.1 7.8c-.1-2.4 1.9-4.3 4.3-4.3h7.1"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GlobeFraudIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r="24"
        stroke="currentColor"
        strokeWidth="6"
      />
      <path
        d="M8 32h48M32 8c7 7 10.5 15 10.5 24S39 49 32 56M32 8c-7 7-10.5 15-10.5 24S25 49 32 56"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CardFraudIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect
        x="10"
        y="16"
        width="44"
        height="32"
        rx="4"
        stroke="currentColor"
        strokeWidth="6"
      />
      <path
        d="M10 26h44"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GrowthFraudIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path
        d="M10 46l14-14 11 10 19-22"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 20h14v14"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WarningFraudIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path
        d="M32 8l26 46H6L32 8Z"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 24v13"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M32 46h.1"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchFraudIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <circle
        cx="28"
        cy="28"
        r="18"
        stroke="currentColor"
        strokeWidth="6"
      />
      <path
        d="M42 42l13 13"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}