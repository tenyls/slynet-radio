import React from 'react';
import { MainTab } from '../types/radio';
import { Flame, LayoutGrid, Sparkles, Search, Heart, Clock, Video, Mic2, Tv } from 'lucide-react';

interface BottomNavProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  favoritesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  favoritesCount,
}) => {
  const tabs = [
    { id: 'popular' as MainTab, label: 'Топ', icon: Flame },
    { id: 'artists' as MainTab, label: 'Группы', icon: Mic2 },
    { id: 'genres' as MainTab, label: 'Жанры', icon: LayoutGrid },
    { id: 'moods' as MainTab, label: 'Вайб', icon: Sparkles },
    { id: 'webcams' as MainTab, label: 'Камеры', icon: Video },
    { id: 'tv' as MainTab, label: 'ТВ', icon: Tv },
    { id: 'search' as MainTab, label: 'Поиск', icon: Search },
    {
      id: 'favorites' as MainTab,
      label: 'Избранное',
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
    },
    { id: 'history' as MainTab, label: 'История', icon: Clock },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-1 pb-safe">
      <div className="grid grid-cols-9 h-full items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[36px] touch-manipulation transition-colors"
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                    isActive
                      ? 'text-emerald-400 scale-110'
                      : tab.id === 'moods'
                      ? 'text-lime-400/80'
                      : tab.id === 'webcams'
                      ? 'text-cyan-400/80'
                      : 'text-zinc-400'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-3.5 bg-rose-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center font-mono">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[8px] sm:text-[9px] font-medium tracking-tight mt-1 truncate max-w-[42px] ${
                  isActive
                    ? 'text-emerald-400 font-bold'
                    : 'text-zinc-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
