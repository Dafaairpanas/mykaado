import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';

export function App() {
  return (
    <>
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      <main className="flex-1 overflow-y-auto pt-8 pb-24 md:pb-8">
        <Outlet />
        
        <footer className="mt-20 pb-8 text-center text-sm font-bold w-full">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <span className="text-[var(--color-text-muted)]">Created with <span className="text-red-500 animate-pulse inline-block">❤</span> by</span>
            <span className="text-[var(--color-btn-text)] bg-[var(--color-accent)] px-4 py-1.5 rounded-[var(--radius-sm)] shadow-[3px_3px_0px_var(--color-shadow-main)] border-[2px] border-[var(--color-border-main)] transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--color-shadow-main)] cursor-default">
              Aditya Rasya Dafa Putra
            </span>
          </div>
        </footer>
      </main>
      <BottomNav />
    </>
  );
}
