// Lucide-style line icons, 1.5px stroke, brand colours, no fills.

export function CheckIcon() {
  return (
    <svg className="rpg-answer-check" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="var(--sgb-mid-blue)" strokeWidth="1.5" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke="var(--sgb-mid-blue)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
