import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Clock, RefreshCw, AlertCircle } from 'lucide-react';

interface SyncStatusBadgeProps {
  isDarkMode: boolean;
  currentTeacherCount: number;
  currentLastUpdated: string;
  currentSavedAt?: string;
  onRefreshData?: () => void;
}

export type SyncState = 'synced' | 'pending' | 'checking';

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  isDarkMode,
  currentTeacherCount,
  currentLastUpdated,
  currentSavedAt,
  onRefreshData,
}) => {
  const [syncState, setSyncState] = useState<SyncState>('checking');
  const [details, setDetails] = useState<string>('Verificando integridade com /database.json...');
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkSyncStatus = useCallback(async () => {
    setIsChecking(true);
    setSyncState('checking');

    try {
      // 1. Fetch the server's /database.json directly with cache-busting to bypass browser CDN cache
      const timestamp = Date.now();
      let serverData: any = null;

      try {
        const response = await fetch(`/database.json?_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json') || response.status === 200) {
            serverData = await response.json();
          }
        }
      } catch (err) {
        // Fallback to /api/app-data
      }

      // 2. If /database.json failed, try /api/app-data
      if (!serverData || !Array.isArray(serverData.teachers)) {
        try {
          const apiResp = await fetch(`/api/app-data?_t=${timestamp}`, {
            cache: 'no-store',
          });
          if (apiResp.ok) {
            serverData = await apiResp.json();
          }
        } catch {
          // ignore
        }
      }

      // If we still could not reach the server or data is empty while frontend has data
      if (!serverData || !Array.isArray(serverData.teachers)) {
        if (currentTeacherCount > 0) {
          setSyncState('pending');
          setDetails('Não foi possível validar /database.json no servidor. Aguardando sincronização.');
        } else {
          setSyncState('synced');
          setDetails('Base vazia tanto no frontend quanto no servidor.');
        }
        setIsChecking(false);
        return;
      }

      const serverTeachersCount = serverData.teachers.length;
      const serverLastUpdated = (serverData.lastUpdated || '').trim();
      const serverSavedAt = (serverData.savedAt || '').trim();

      const localSavedAt = (currentSavedAt || '').trim();
      const localLastUpdated = (currentLastUpdated || '').trim();

      // Compare:
      // A) If savedAt is available on both, compare savedAt and count
      // B) If savedAt is missing, compare lastUpdated and count
      const isCountMatch = serverTeachersCount === currentTeacherCount;
      const isTimestampMatch =
        (serverSavedAt && localSavedAt && serverSavedAt === localSavedAt) ||
        (serverLastUpdated && localLastUpdated && serverLastUpdated === localLastUpdated);

      if (isCountMatch && (isTimestampMatch || !localSavedAt)) {
        setSyncState('synced');
        setDetails(
          `Sincronizado: ${serverTeachersCount.toLocaleString('pt-BR')} docentes verificados no /database.json do servidor (Atualizado: ${serverLastUpdated || 'OK'}).`
        );
      } else {
        setSyncState('pending');
        const diffInfo = !isCountMatch
          ? `diferença na contagem (${currentTeacherCount} local vs ${serverTeachersCount} servidor)`
          : `versão pendente (${localLastUpdated} local vs ${serverLastUpdated} servidor)`;
        setDetails(`Pendente: ${diffInfo}. O arquivo /database.json difere da base local.`);
      }
    } catch (e: any) {
      setSyncState('pending');
      setDetails('Erro ao verificar /database.json: ' + (e?.message || 'Falha de conexão.'));
    } finally {
      setIsChecking(false);
    }
  }, [currentTeacherCount, currentLastUpdated, currentSavedAt]);

  // Initial check and auto-verify when parameters change or every 60s
  useEffect(() => {
    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 60000);
    return () => clearInterval(interval);
  }, [checkSyncStatus]);

  return (
    <div
      id="sync-status-indicator"
      className="inline-flex items-center"
      title={details}
    >
      <button
        type="button"
        onClick={checkSyncStatus}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer border select-none ${
          syncState === 'synced'
            ? isDarkMode
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
            : syncState === 'pending'
            ? isDarkMode
              ? 'bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900/50'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
            : isDarkMode
            ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
        }`}
      >
        {/* Status Indicator Icon & Dot */}
        {syncState === 'synced' ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Sincronizado com o servidor</span>
            <span className="sm:hidden">Sincronizado</span>
          </>
        ) : syncState === 'pending' ? (
          <>
            <span className="inline-flex rounded-full h-2 w-2 bg-amber-500" />
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Pendente</span>
          </>
        ) : (
          <>
            <RefreshCw className={`w-3 h-3 text-blue-500 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Verificando...</span>
          </>
        )}
      </button>
    </div>
  );
};
