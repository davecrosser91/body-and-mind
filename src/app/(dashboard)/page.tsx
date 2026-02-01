'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root dashboard page - redirects to /dashboard
 */
export default function RootDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-text-muted">Redirecting...</div>
    </div>
  );
}
