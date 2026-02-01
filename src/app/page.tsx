'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';

export default function Home() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading state while checking authentication
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo size={64} showText={false} className="animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" />
        </div>
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    </div>
  );
}
