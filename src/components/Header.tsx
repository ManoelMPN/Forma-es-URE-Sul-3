import React from 'react';
import { RotateCw, Database, CheckCircle2, Moon, Sun, Trash2, Lock, Unlock, LogOut } from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge';

interface HeaderProps {
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  isOnlineConnected: boolean;
  onlineUrl: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onClearAndResync?: () => void;
  isAdmin?: boolean;
  onAdminLogout?: () => void;
  teacherCount?: number;
  savedAt?: string;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  isRefreshing,
  onRefresh,
  onOpenSettings,
  isOnlineConnected,
  onlineUrl,
  isDarkMode,
  onToggleDarkMode,
  onClearAndResync,
  isAdmin = false,
  onAdminLogout,
  teacherCount,
  savedAt,
}) => {
  return (
    <header className="pt-8 pb-4 text-center">
      <div className="max-w-4xl mx-auto px-4">
        {/* Main Title matching Photo 1 */}
        <h1
          id="main-app-title"
          className={`text-3xl sm:text-4xl md:text-[42px] font-black tracking-tight uppercase leading-none transition-colors ${
            isDarkMode ? 'text-white' : 'text-[#0a1b3f]'
          }`}
        >
          FORMAÇÕES - URE SUL 3
        </h1>

        {/* Subtitle matching Photo 1 */}
        <h2
          id="main-app-subtitle"
          className={`mt-3 text-base sm:text-lg md:text-xl font-bold uppercase tracking-wide transition-colors ${
            isDarkMode ? 'text-blue-300' : 'text-[#12285a]'
          }`}
        >
          2º SEMESTRE - ANOS FINAIS / ENSINO MÉDIO
        </h2>

        {/* Controls Bar: Sync Status, ADM, Dark Mode Toggle */}
        <div
          className={`mt-3.5 flex items-center justify-center gap-2.5 flex-wrap text-sm transition-colors ${
            isDarkMode ? 'text-slate-300' : 'text-[#475569]'
          }`}
        >
          {/* Discrete Sync Status Indicator */}
          <SyncStatusBadge
            isDarkMode={isDarkMode}
            currentTeacherCount={teacherCount || 0}
            currentLastUpdated={lastUpdated}
            currentSavedAt={savedAt}
            onRefreshData={onRefresh}
          />

          {/* ADM Button (Protected by password 343950) */}
          <button
            id="btn-admin-access"
            type="button"
            onClick={onOpenSettings}
            title={
              isAdmin
                ? 'Painel do Administrador (Autorizado)'
                : 'Acesso Restrito ADM (Requer senha)'
            }
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer shadow-2xs active:scale-95 ${
              isAdmin
                ? isDarkMode
                  ? 'bg-blue-900/70 text-blue-200 border-blue-500 hover:bg-blue-800'
                  : 'bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-200'
                : isDarkMode
                ? 'bg-[#152038] text-slate-300 border-slate-700 hover:text-white hover:bg-[#1d2c4e]'
                : 'bg-white text-slate-700 border-slate-300 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {isAdmin ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-blue-400" />
                <span>ADM (Liberado)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>ADM</span>
              </>
            )}
          </button>

          {/* Admin Logout button if admin is active */}
          {isAdmin && onAdminLogout && (
            <button
              id="btn-admin-logout"
              type="button"
              onClick={onAdminLogout}
              title="Encerrar sessão de administrador"
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <LogOut className="w-3 h-3 text-rose-500" />
              <span>Sair</span>
            </button>
          )}

          {/* Dark Mode Toggle Button */}
          <button
            id="btn-toggle-dark-mode"
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            aria-label={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border shadow-2xs ${
              isDarkMode
                ? 'bg-[#17233e] text-amber-300 border-amber-400/40 hover:bg-[#203055]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span>Modo Escuro</span>
              </>
            )}
          </button>

          {/* Clean Reset & Re-sync button - ONLY for admin */}
          {isAdmin && onClearAndResync && (
            <button
              id="btn-clear-and-resync"
              type="button"
              onClick={onClearAndResync}
              title="Limpar todos os dados em cache e sincronizar novamente da planilha"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer shadow-2xs ${
                isDarkMode
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800 hover:bg-rose-900/70'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Resetar Dados</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
