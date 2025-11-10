import type { SVGProps } from "react";

export const Icons = {
  yoga: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
      <path d="M15.5 15.5l-2-2" />
      <path d'M8.5 15.5l7-7' />
      <path d'M8.5 8.5l2 2' />
      <path d="M12 6V4" />
      <path d="M12 20v-2" />
      <path d="M18 12h2" />
      <path d="M4 12h2" />
    </svg>
  ),
};
