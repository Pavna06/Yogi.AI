'use client';

/**
 * @fileoverview This is the root server page for the application.
 *
 * Its sole responsibility is to render the main client-side dashboard component,
 * which contains all the application's UI and logic. This separation keeps the
 * entry point clean and simple.
 */

import { DashboardClient } from '@/features/dashboard/components/DashboardClient';

export default function Home() {
  return <DashboardClient />;
}
