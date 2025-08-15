'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import type { AppRouter } from '@/lib/trpc';

export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000,
        retry: (failureCount, error: any) => {
          if (failureCount >= 3) return false;
          
          const errorMessage = error?.message?.toLowerCase() || '';
          
          if (errorMessage.includes('fetch failed') || 
              errorMessage.includes('network') ||
              errorMessage.includes('timeout')) {
            return failureCount < 3;
          }
          
          if (errorMessage.includes('503') || 
              errorMessage.includes('service unavailable')) {
            return failureCount < 2;
          }
          
          return failureCount < 1;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: (failureCount, error: any) => {
          const errorMessage = error?.message?.toLowerCase() || '';
          
          if (errorMessage.includes('503') || 
              errorMessage.includes('service unavailable')) {
            return failureCount < 2;
          }
          
          if (errorMessage.includes('network') ||
              errorMessage.includes('fetch failed')) {
            return failureCount < 1;
          }
          
          return false;
        },
        retryDelay: 3000,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            (process.env.NODE_ENV === 'development' &&
              typeof window !== 'undefined') ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: '/api/trpc',
          headers: () => ({
            'Content-Type': 'application/json',
          }),
          fetch: async (url, options) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            try {
              const response = await fetch(url, {
                ...options,
                signal: controller.signal,
              });
              
              clearTimeout(timeoutId);
              return response;
            } catch (error: any) {
              clearTimeout(timeoutId);
              
              if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please try again.');
              }
              
              if (!navigator.onLine) {
                throw new Error('No internet connection. Please check your network.');
              }
              
              throw error;
            }
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}