'use client';

import { RefreshButton } from '@/components/RefreshButton';

interface HeaderProps {
  onRefreshComplete: () => void;
}

export function Header({ onRefreshComplete }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="page-shell topbar-inner">
        <div className="brand-group">
          <div className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <rect x="1" y="1" width="30" height="30" rx="9" fill="#5645D4" />
              <path d="M8 20.5V12M12 23V9M16 19V12M20 23V7.5M24 17V12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="brand-name">News Pulse</div>
            <div className="brand-subtitle">Topic-clustered news timeline</div>
          </div>
        </div>
        <RefreshButton onRefreshComplete={onRefreshComplete} />
      </div>
    </header>
  );
}
