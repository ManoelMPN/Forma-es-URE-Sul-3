import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { StatCards } from './components/StatCards';
import { TeachersTable } from './components/TeachersTable';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { TeacherRecord, SummaryStats, ViewMode, StatusFilter } from './types';
import databaseData from './data/database.json';
import {
  processSpreadsheetData,
  parseSpreadsheetBuffer,
  calculateStats,
  normalizeKey
} from './services/dataProcessor';

// Cache key versioned to ensure exact adherence to primary database column E and F sums
const CACHE_VERSION = 'v6_exact_primary_db';
const CACHE_KEY_TEACHERS = `ure_sul3_cached_teachers_${CACHE_VERSION}`;
const CACHE_KEY_UPDATED = `ure_sul3_last_updated_${CACHE_VERSION}`;

// Extract bundled data safely across different bundlers/environments (Vite, Vercel, Node)
const rawBundledData: any = (databaseData as any)?.default || databaseData || {};
const bundledTeachers: TeacherRecord[] =
  rawBundledData && Array.isArray(rawBundledData.teachers) && rawBundledData.teachers.length > 0
    ? (rawBundledData.teachers as TeacherRecord[])
    : [];
const bundledLastUpdated: string =
  rawBundledData && rawBundledData.lastUpdated && rawBundledData.lastUpdated !== '--/--/----'
    ? rawBundledData.lastUpdated
    : '';
const bundledOnlineUrl: string =
  rawBundledData && rawBundledData.onlineUrl
    ? rawBundledData.onlineUrl
    : '';
const bundledSavedAt: string =
  rawBundledData && rawBundledData.savedAt
    ? rawBundledData.savedAt
    : '';

export default function App() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>(() => {
    // 1. Initial priority: Bundled database data
    if (bundledTeachers.length > 0) {
      return bundledTeachers;
    }

    // 2. Check local cached teachers
    const saved = localStorage.getItem(CACHE_KEY_TEACHERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((t: TeacherRecord) => t.components && t.components.length > 0);
          if (valid.length > 0) {
            return valid;
          }
        }
      } catch (e) {
        console.error('Failed to parse cached teachers', e);
      }
    }
    return [];
  });

  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    if (bundledLastUpdated) {
      return bundledLastUpdated;
    }
    return localStorage.getItem(CACHE_KEY_UPDATED) || '--/--/----';
  });

  const [savedAt, setSavedAt] = useState<string>(() => {
    return localStorage.getItem('ure_sul3_saved_at') || bundledSavedAt || '';
  });

  const [onlineUrl, setOnlineUrl] = useState<string>(() => {
    const local = localStorage.getItem('ure_sul3_sheet_url');
    if (local) return local;
    if (bundledOnlineUrl) {
      return bundledOnlineUrl;
    }
    return '';
  });

  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(false);

  // Admin authentication state (password: 343950)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('ure_admin_auth') === 'true';
  });
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState<boolean>(false);

  const handleOpenAdmin = () => {
    if (isAdmin) {
      setIsModalOpen(true);
    } else {
      setIsAdminPasswordModalOpen(true);
    }
  };

  const handleAdminSuccess = (password: string) => {
    setIsAdmin(true);
    sessionStorage.setItem('ure_admin_auth', 'true');
    sessionStorage.setItem('ure_admin_pwd', password);
    setIsAdminPasswordModalOpen(false);
    setIsModalOpen(true);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('ure_admin_auth');
    sessionStorage.removeItem('ure_admin_pwd');
  };

  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('ure_sul3_view_mode') as ViewMode) || 'docentes';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleStatusFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
    // Smoothly scroll to the table so the user immediately views the filtered list
    setTimeout(() => {
      const tableSection = document.getElementById('relacao-de-docentes-section');
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('ure_sul3_view_mode', mode);
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ure_sul3_dark_mode') === 'true';
  });

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('ure_sul3_dark_mode', String(next));
      return next;
    });
  };

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Format date helper for Brasilia/SP time: "DD/MM/YYYY às HH:mm"
  const formatDateTimeBR = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  };

  // Fetch data from online Google Sheet or Google Apps Script Web App
  const fetchDataFromSheet = useCallback(
    async (urlToFetch: string, isBackground: boolean = false) => {
      if (!urlToFetch || !urlToFetch.startsWith('http')) return;

      if (!isBackground) {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        let data: any = null;
        let lastFailureReason = '';

        // 1. Try our backend proxy first to avoid any CORS or sheet format issues
        try {
          const proxyResp = await fetch(`/api/fetch-sheet?url=${encodeURIComponent(urlToFetch)}`);
          const json = await proxyResp.json().catch(() => null);
          if (proxyResp.ok && json && !json.error) {
            data = json;
          } else if (json && json.error) {
            lastFailureReason = json.error;
          }
        } catch (proxyErr: any) {
          console.warn('Proxy network error, falling back to direct fetch:', proxyErr);
          lastFailureReason = proxyErr?.message || '';
        }

        // 2. Fallback: Direct fetch
        if (!data || data.error) {
          try {
            const directResp = await fetch(urlToFetch, { redirect: 'follow' });
            if (directResp.ok) {
              const directJson = await directResp.json().catch(() => null);
              if (directJson && !directJson.error) {
                data = directJson;
              }
            }
          } catch (directErr) {
            console.warn('Direct fetch failed, trying public CORS proxy:', directErr);
          }
        }

        // 3. Fallback: Public CORS proxy
        if (!data || data.error) {
          try {
            const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlToFetch)}`;
            const corsResp = await fetch(corsProxyUrl);
            if (corsResp.ok) {
              const corsJson = await corsResp.json().catch(() => null);
              if (corsJson && !corsJson.error) {
                data = corsJson;
              }
            }
          } catch (corsErr) {
            console.warn('CORS proxy failed:', corsErr);
          }
        }

        if (!data) {
          throw new Error(
            lastFailureReason ||
              'Não foi possível obter os dados da planilha. Verifique se o link está acessível como "Qualquer pessoa com o link" ou use a aba "Enviar Arquivo (.xlsx)" para importar o arquivo diretamente do seu computador.'
          );
        }

        if (data.error) {
          throw new Error(`Erro na planilha/script: ${data.error}`);
        }

        const processed = processSpreadsheetData(data);
        if (processed.length === 0) {
          throw new Error('Nenhum docente com componente foi encontrado na estrutura da planilha.');
        }

        setTeachers(processed);
        localStorage.setItem(CACHE_KEY_TEACHERS, JSON.stringify(processed));

        let newTimestamp = formatDateTimeBR(new Date());
        if (data.updatedAt) {
          try {
            const parsedDate = new Date(data.updatedAt);
            if (!isNaN(parsedDate.getTime())) {
              newTimestamp = formatDateTimeBR(parsedDate);
            }
          } catch (e) {
            // fallback to current
          }
        }

        setLastUpdated(newTimestamp);
        localStorage.setItem(CACHE_KEY_UPDATED, newTimestamp);

        // Persist to src/data/database.json and perform Git commit
        await persistToServerAndGit(processed, newTimestamp, urlToFetch);
      } catch (err: any) {
        console.error('Erro ao sincronizar planilha:', err);
        setError(
          err.message ||
            'Não foi possível conectar à planilha. Verifique a URL e as permissões de acesso.'
        );
      } finally {
        if (!isBackground) {
          setIsRefreshing(false);
        }
      }
    },
    [onlineUrl]
  );

  // Helper to persist updated dataset in server src/data/database.json and perform git commit
  const persistToServerAndGit = async (records: TeacherRecord[], timestamp: string, currentUrl?: string) => {
    try {
      const adminPassword = sessionStorage.getItem('ure_admin_pwd') || '343950';
      const res = await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: adminPassword,
          teachers: records,
          lastUpdated: timestamp,
          onlineUrl: currentUrl !== undefined ? currentUrl : onlineUrl,
          autoSyncEnabled: false,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.savedAt) {
          setSavedAt(json.savedAt);
          localStorage.setItem('ure_sul3_saved_at', json.savedAt);
        }
      }
    } catch (err) {
      console.warn('Nota ao salvar dados no servidor/git:', err);
    }
  };

  // Direct file upload handler (.xlsx or .csv)
  const handleFileUpload = async (file: File) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const sheetData = parseSpreadsheetBuffer(buffer, file.name);
      const processed = processSpreadsheetData(sheetData);

      if (processed.length === 0) {
        throw new Error('Nenhum docente com componente foi identificado no arquivo enviado. Verifique se o arquivo possui as abas de componentes.');
      }

      setTeachers(processed);
      localStorage.setItem(CACHE_KEY_TEACHERS, JSON.stringify(processed));

      const newTimestamp = formatDateTimeBR(new Date());
      setLastUpdated(newTimestamp);
      localStorage.setItem(CACHE_KEY_UPDATED, newTimestamp);

      // Persist to src/data/database.json and perform Git commit
      await persistToServerAndGit(processed, newTimestamp, onlineUrl);
    } catch (err: any) {
      console.error('Erro ao processar arquivo:', err);
      setError(err.message || 'Erro ao processar o arquivo da planilha.');
      throw err;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load saved app data from server or static database on startup
  useEffect(() => {
    const fetchAppData = async () => {
      // 1. Try /api/app-data (Express server)
      try {
        const res = await fetch('/api/app-data');
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data && data.hasData && Array.isArray(data.teachers) && data.teachers.length > 0) {
              setTeachers(data.teachers);
              if (data.lastUpdated && data.lastUpdated !== '--/--/----') {
                setLastUpdated(data.lastUpdated);
                localStorage.setItem(CACHE_KEY_UPDATED, data.lastUpdated);
              }
              if (data.savedAt) {
                setSavedAt(data.savedAt);
                localStorage.setItem('ure_sul3_saved_at', data.savedAt);
              }
              if (data.onlineUrl) {
                setOnlineUrl(data.onlineUrl);
                localStorage.setItem('ure_sul3_sheet_url', data.onlineUrl);
              }
              localStorage.setItem(CACHE_KEY_TEACHERS, JSON.stringify(data.teachers));
              return;
            }
          }
        }
      } catch {
        // ignore and fallback
      }

      // 2. Try static /database.json (Vercel CDN static asset) if teachers not yet loaded
      try {
        const res = await fetch('/database.json');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.teachers) && data.teachers.length > 0) {
            setTeachers(data.teachers);
            if (data.lastUpdated && data.lastUpdated !== '--/--/----') {
              setLastUpdated(data.lastUpdated);
              localStorage.setItem(CACHE_KEY_UPDATED, data.lastUpdated);
            }
            if (data.savedAt) {
              setSavedAt(data.savedAt);
              localStorage.setItem('ure_sul3_saved_at', data.savedAt);
            }
            if (data.onlineUrl) {
              setOnlineUrl(data.onlineUrl);
              localStorage.setItem('ure_sul3_sheet_url', data.onlineUrl);
            }
            localStorage.setItem(CACHE_KEY_TEACHERS, JSON.stringify(data.teachers));
          }
        }
      } catch {
        // ignore
      }
    };

    fetchAppData();
  }, []);

  const handleManualRefresh = async () => {
    if (onlineUrl) {
      await fetchDataFromSheet(onlineUrl, false);
    } else {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        setLastUpdated(formatDateTimeBR(new Date()));
      }, 500);
    }
  };

  const handleSaveUrl = async (newUrl: string) => {
    setOnlineUrl(newUrl);
    localStorage.setItem('ure_sul3_sheet_url', newUrl);
    if (newUrl) {
      await fetchDataFromSheet(newUrl, false);
    }
  };

  const handleResetToDefault = async () => {
    try {
      const adminPassword = sessionStorage.getItem('ure_admin_pwd') || '343950';
      await fetch('/api/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
    } catch {}

    setTeachers([]);
    setLastUpdated('--/--/----');
    setOnlineUrl('');
    localStorage.removeItem(CACHE_KEY_TEACHERS);
    localStorage.removeItem(CACHE_KEY_UPDATED);
    localStorage.removeItem('ure_sul3_sheet_url');
    setError(null);
  };

  // Clear all cached data and re-sync freshly from the spreadsheet URL
  const handleClearAndResync = async () => {
    await handleResetToDefault();
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    localStorage.setItem('ure_sul3_autosync', String(enabled));
  };

  // Distinct schools strictly from actual loaded teachers data
  const availableSchools = useMemo(() => {
    const schoolSet = new Set<string>();
    teachers.forEach((t) => {
      if (t.escola && t.escola.trim()) {
        schoolSet.add(t.escola.trim());
      }
    });
    return Array.from(schoolSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [teachers]);

  // Distinct areas strictly from actual loaded teachers data
  const availableAreas = useMemo(() => {
    const areaSet = new Set<string>();
    teachers.forEach((t) => {
      t.components.forEach((c) => {
        if (c.area && c.area.trim()) {
          areaSet.add(c.area.trim());
        }
      });
    });
    return Array.from(areaSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [teachers]);

  // Distinct components strictly from actual loaded teachers data, filtered by areas if selected
  const availableComponents = useMemo(() => {
    const compSet = new Set<string>();
    const normAreas = selectedAreas.map(normalizeKey);
    teachers.forEach((t) => {
      t.components.forEach((c) => {
        if (normAreas.length > 0 && !normAreas.includes(normalizeKey(c.area))) {
          return;
        }
        if (c.componentName && c.componentName.trim()) {
          compSet.add(c.componentName.trim());
        }
      });
    });
    return Array.from(compSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [teachers, selectedAreas]);

  // Clear all active filters helper
  const handleClearAllFilters = () => {
    setSelectedSchools([]);
    setSelectedAreas([]);
    setSelectedComponents([]);
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Base filtered teachers (by school, area, component, and text search)
  const baseFilteredTeachers = useMemo(() => {
    const normSearch = normalizeKey(searchQuery);
    const normSchools = selectedSchools.map(normalizeKey);
    const normAreas = selectedAreas.map(normalizeKey);
    const normComponents = selectedComponents.map(normalizeKey);

    return teachers.filter((t) => {
      // Filter by School
      if (normSchools.length > 0 && !normSchools.includes(normalizeKey(t.escola))) {
        return false;
      }

      // Filter by Area
      if (normAreas.length > 0) {
        const hasArea = t.components.some((c) => normAreas.includes(normalizeKey(c.area)));
        if (!hasArea) return false;
      }

      // Filter by Component
      if (normComponents.length > 0) {
        const hasComp = t.components.some((c) => normComponents.includes(normalizeKey(c.componentName)));
        if (!hasComp) return false;
      }

      // Filter by Search Query
      if (normSearch) {
        const matchesName = normalizeKey(t.nome).includes(normSearch);
        const matchesSchool = normalizeKey(t.escola).includes(normSearch);
        const matchesComp = t.components.some(
          (c) =>
            normalizeKey(c.componentName).includes(normSearch) ||
            normalizeKey(c.area).includes(normSearch)
        );
        if (!matchesName && !matchesSchool && !matchesComp) {
          return false;
        }
      }

      return true;
    });
  }, [teachers, selectedSchools, selectedAreas, selectedComponents, searchQuery]);

  // Dynamic statistics adhering strictly to the selected view mode
  // Calculated on baseFilteredTeachers so the 3 big cards always display aggregate KPI counts
  const summaryStats: SummaryStats = useMemo(() => {
    return calculateStats(baseFilteredTeachers, selectedAreas, selectedComponents, viewMode);
  }, [baseFilteredTeachers, selectedAreas, selectedComponents, viewMode]);

  // Teachers displayed in table, taking into account the active statusFilter from the cards
  const displayedTeachers = useMemo(() => {
    if (statusFilter === 'all') {
      return baseFilteredTeachers;
    }

    const normAreas = selectedAreas.map(normalizeKey);
    const normComponents = selectedComponents.map(normalizeKey);

    return baseFilteredTeachers.filter((t) => {
      // Find components matching active area/component filters
      const matchingComps = t.components.filter((c) => {
        if (normAreas.length > 0 && !normAreas.includes(normalizeKey(c.area))) {
          return false;
        }
        if (normComponents.length > 0 && !normComponents.includes(normalizeKey(c.componentName))) {
          return false;
        }
        return true;
      });

      if (viewMode === 'formacoes') {
        if (statusFilter === 'formados') {
          // Teacher has at least one matching completed formation
          return matchingComps.length > 0
            ? matchingComps.some((c) => c.concluidas >= 1 || c.concluido)
            : t.totalConcluidas > 0 || t.isConsolidatedFormado;
        } else {
          // Teacher has at least one matching pending formation
          return matchingComps.length > 0
            ? matchingComps.some((c) => c.concluidas === 0 || !c.concluido)
            : t.totalConcluidas === 0;
        }
      }

      // In 'docentes' and 'docentes_area' modes:
      const isFormado = matchingComps.length > 0
        ? matchingComps.some((c) => c.concluidas >= 1 || c.concluido)
        : (t.totalConcluidas > 0 || t.isConsolidatedFormado);

      if (statusFilter === 'formados') {
        return isFormado;
      } else {
        return !isFormado;
      }
    });
  }, [baseFilteredTeachers, statusFilter, selectedAreas, selectedComponents, viewMode]);

  return (
    <div
      className={`min-h-screen transition-colors duration-200 antialiased selection:bg-blue-600 selection:text-white pb-16 ${
        isDarkMode ? 'bg-[#090e1d] text-slate-100' : 'bg-[#f0f4f9] text-slate-800'
      }`}
    >
      {/* Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section with ADM Button */}
        <Header
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          onRefresh={handleManualRefresh}
          onOpenSettings={handleOpenAdmin}
          isOnlineConnected={teachers.length > 0}
          onlineUrl={onlineUrl}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onClearAndResync={handleClearAndResync}
          isAdmin={isAdmin}
          onAdminLogout={handleAdminLogout}
          teacherCount={teachers.length}
          savedAt={savedAt}
        />

        {/* Global error / connection notice banner if an online sync error occurs */}
        {error && (
          <div
            id="banner-sync-error"
            className={`mb-6 p-4 rounded-2xl border shadow-xs flex items-start justify-between gap-3 text-xs transition-colors ${
              isDarkMode
                ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-rose-500/20 text-rose-600 shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm">Aviso de Sincronização da Planilha</p>
                <p className="leading-relaxed">{error}</p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenAdmin}
                    className="font-bold underline hover:opacity-80 cursor-pointer"
                  >
                    Abrir opções de conexão ou enviar arquivo .xlsx
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="font-semibold opacity-80 hover:opacity-100 cursor-pointer"
                  >
                    Usar dados padrão
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="p-1 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-600 transition cursor-pointer"
              title="Dispensar aviso"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Filtros de Consulta Section com seleção múltipla */}
        <Filters
          schools={availableSchools}
          areas={availableAreas}
          components={availableComponents}
          selectedSchools={selectedSchools}
          selectedAreas={selectedAreas}
          selectedComponents={selectedComponents}
          onSchoolsChange={setSelectedSchools}
          onAreasChange={(areas) => {
            setSelectedAreas(areas);
          }}
          onComponentsChange={setSelectedComponents}
          onClearAllFilters={handleClearAllFilters}
          isDarkMode={isDarkMode}
        />

        {/* 3 Stat Cards Section com Seletor Docentes vs Formações inserido acima dos cards */}
        <StatCards
          stats={summaryStats}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          isDarkMode={isDarkMode}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
        />

        {/* Relação de Docentes Table Section matching Photo 2 */}
        <TeachersTable
          teachers={displayedTeachers}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSchools={selectedSchools}
          selectedAreas={selectedAreas}
          selectedComponents={selectedComponents}
          viewMode={viewMode}
          isDarkMode={isDarkMode}
          lastUpdated={lastUpdated}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
        />
      </main>

      {/* Google Sheet Sync Modal for Admin */}
      <GoogleSheetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onlineUrl={onlineUrl}
        onSaveUrl={handleSaveUrl}
        onRefreshNow={handleManualRefresh}
        onResetToDefault={handleResetToDefault}
        onFileUpload={handleFileUpload}
        isLoading={isRefreshing}
        error={error}
        lastUpdated={lastUpdated}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={handleToggleAutoSync}
        isDarkMode={isDarkMode}
      />

      {/* Admin Password Modal (Password: 343950) */}
      <AdminPasswordModal
        isOpen={isAdminPasswordModalOpen}
        onClose={() => setIsAdminPasswordModalOpen(false)}
        onSuccess={handleAdminSuccess}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
