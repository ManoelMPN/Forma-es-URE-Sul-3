import React from 'react';
import { Users, Check, X, GraduationCap, UserCheck } from 'lucide-react';
import { SummaryStats, ViewMode, StatusFilter } from '../types';

interface StatCardsProps {
  stats: SummaryStats;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isDarkMode: boolean;
  statusFilter?: StatusFilter;
  onStatusFilterChange?: (filter: StatusFilter) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  stats,
  viewMode,
  onViewModeChange,
  isDarkMode,
  statusFilter = 'all',
  onStatusFilterChange,
}) => {
  // Brazilian number format (1.811, 2.610, 628, etc.)
  const formatPtBrNumber = (val: number): string => {
    return new Intl.NumberFormat('pt-BR').format(val);
  };

  const isDocentesUnicos = viewMode === 'docentes';
  const isDocentesArea = viewMode === 'docentes_area';
  const isFormacoes = viewMode === 'formacoes';

  const handleCardClick = (target: StatusFilter) => {
    if (!onStatusFilterChange) return;
    if (target === 'all') {
      onStatusFilterChange('all');
    } else if (target === statusFilter) {
      // Toggle off if already active
      onStatusFilterChange('all');
    } else {
      onStatusFilterChange(target);
    }
  };

  return (
    <section id="stat-cards-wrapper" className="mb-8">
      {/* Option to choose between DOCENTES (PÚBLICO-ALVO), DOCENTES POR ÁREA, or FORMAÇÕES */}
      <div
        id="selector-docentes-formacoes"
        className={`rounded-2xl border p-4 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition duration-200 ${
          isDarkMode
            ? 'bg-[#11192e] border-slate-800'
            : 'bg-white border-slate-200/90 shadow-xs'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 mt-0.5 sm:mt-0 ${
              isDarkMode
                ? isFormacoes
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                  : isDocentesArea
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                  : 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                : isFormacoes
                ? 'bg-[#009b5a] text-white'
                : isDocentesArea
                ? 'bg-[#4f46e5] text-white'
                : 'bg-[#162f65] text-white'
            }`}
          >
            {isFormacoes ? (
              <GraduationCap className="w-5 h-5" />
            ) : isDocentesArea ? (
              <UserCheck className="w-5 h-5" />
            ) : (
              <Users className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4
              className={`text-sm md:text-base font-bold transition-colors flex items-center gap-2 flex-wrap ${
                isDarkMode ? 'text-white' : 'text-[#0a1b3f]'
              }`}
            >
              <span>Visualizar Dados por:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide ${
                  isFormacoes
                    ? isDarkMode
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isDocentesArea
                    ? isDarkMode
                      ? 'bg-purple-950 text-purple-300 border border-purple-700/60'
                      : 'bg-purple-100 text-purple-800 border border-purple-300'
                    : isDarkMode
                    ? 'bg-blue-950 text-blue-300 border border-blue-700/60'
                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                }`}
              >
                {isFormacoes
                  ? 'Formações Previstas (Base: 2.610)'
                  : isDocentesArea
                  ? 'Docentes por Área de Conhecimento'
                  : 'Público-Alvo (Docentes Únicos: 1.811)'}
              </span>
            </h4>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {isFormacoes
                ? 'Soma total de formações atribuídas por componente (Coluna E: 2.610 Previstas | Coluna F: 628 Concluídas)'
                : isDocentesArea
                ? 'Docentes que atuam em 2 ou mais áreas contam como pessoas distintas em cada área de atuação'
                : 'Público-alvo real de professores físicos da rede URE Sul 3 (1.811 docentes únicos | 544 formados)'}
            </p>
          </div>
        </div>

        {/* 3 Mode Selector Buttons */}
        <div
          role="radiogroup"
          aria-label="Escolha do modo de cálculo"
          className={`flex items-center p-1 rounded-xl border shrink-0 flex-wrap gap-1 ${
            isDarkMode ? 'bg-[#0d1424] border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {/* Option 1: Público-Alvo (Docentes Únicos - 1.811) */}
          <button
            type="button"
            role="radio"
            aria-checked={isDocentesUnicos}
            onClick={() => onViewModeChange('docentes')}
            title="Público-alvo total de 1.811 professores físicos únicos"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isDocentesUnicos
                ? isDarkMode
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#162f65] text-white shadow-md'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Público-Alvo (1.811)</span>
          </button>

          {/* Option 2: Docentes por Área */}
          <button
            type="button"
            role="radio"
            aria-checked={isDocentesArea}
            onClick={() => onViewModeChange('docentes_area')}
            title="Docentes considerados como pessoas distintas para cada área em que atuam"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isDocentesArea
                ? isDarkMode
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#4f46e5] text-white shadow-md'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Docentes por Área</span>
          </button>

          {/* Option 3: Por Formações (2.610) */}
          <button
            type="button"
            role="radio"
            aria-checked={isFormacoes}
            onClick={() => onViewModeChange('formacoes')}
            title="Soma de formações previstas em cada componente curricular (2.610)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isFormacoes
                ? isDarkMode
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#009b5a] text-white shadow-md'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Por Formações (2.610)</span>
          </button>
        </div>
      </div>

      {/* 3 Stat Cards Container */}
      <div id="stat-cards-container" className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {/* Card 1: PREVISTAS / TOTAL */}
        <button
          type="button"
          id="card-previstas"
          onClick={() => handleCardClick('all')}
          title="Clique para ver todos os docentes na lista abaixo"
          className={`group rounded-2xl border-2 p-6 shadow-xs flex flex-col justify-between relative text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg focus:outline-none ${
            statusFilter === 'all'
              ? isDarkMode
                ? 'bg-[#11192e] border-blue-500 shadow-blue-950/50 ring-2 ring-blue-500/70'
                : 'bg-white border-[#16337a] ring-2 ring-blue-600/30 shadow-md'
              : isDarkMode
              ? 'bg-[#11192e]/80 border-slate-800 opacity-80 hover:opacity-100 hover:border-blue-500/60'
              : 'bg-white/80 border-slate-200 opacity-85 hover:opacity-100 hover:border-[#16337a]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span
                className={`text-xs md:text-sm font-bold tracking-wider uppercase transition-colors block ${
                  isDarkMode ? 'text-blue-300' : 'text-[#12285a]'
                }`}
              >
                {isFormacoes
                  ? 'FORMAÇÕES PREVISTAS'
                  : isDocentesArea
                  ? 'DOCENTES POR ÁREA'
                  : 'DOCENTES PREVISTOS'}
              </span>
              <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isFormacoes
                  ? 'Soma total da Coluna E (Base: 2.610)'
                  : isDocentesArea
                  ? 'Docentes contabilizados por área de atuação'
                  : 'Público-alvo de docentes únicos (Base: 1.811)'}
              </span>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-colors shrink-0 ${
                isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#16337a] text-white'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline">
            <span
              className={`text-4xl md:text-5xl font-black tracking-tight transition-colors ${
                isDarkMode ? 'text-white' : 'text-[#0a1b3f]'
              }`}
            >
              {formatPtBrNumber(stats.previstas)}
            </span>
          </div>

          {/* Interactive footer prompt */}
          <div
            className={`mt-4 pt-3 border-t text-xs font-semibold flex items-center justify-between transition-colors ${
              statusFilter === 'all'
                ? isDarkMode
                  ? 'border-blue-500/30 text-blue-300'
                  : 'border-blue-200 text-blue-800'
                : isDarkMode
                ? 'border-slate-800 text-slate-400 group-hover:text-blue-300'
                : 'border-slate-200 text-slate-500 group-hover:text-blue-700'
            }`}
          >
            {statusFilter === 'all' ? (
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Exibindo todos na lista
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span>Clique para exibir todos</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </span>
            )}
          </div>
        </button>

        {/* Card 2: FORMADOS / CONCLUÍDAS */}
        <button
          type="button"
          id="card-formados"
          onClick={() => handleCardClick('formados')}
          title="Clique para filtrar apenas os docentes formados na lista abaixo"
          className={`group rounded-2xl border border-t-4 p-6 shadow-xs flex flex-col justify-between relative text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg focus:outline-none ${
            statusFilter === 'formados'
              ? isDarkMode
                ? 'bg-[#11192e] border-emerald-500/80 border-t-emerald-500 ring-2 ring-emerald-500 shadow-lg shadow-emerald-950/40'
                : 'bg-white border-emerald-400 border-t-[#009b5a] ring-2 ring-emerald-500/60 shadow-md'
              : isDarkMode
              ? 'bg-[#11192e] border-slate-800 border-t-emerald-500 hover:border-emerald-600/60 shadow-emerald-950/20'
              : 'bg-white border-slate-200 border-t-[#009b5a] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span
                className={`text-xs md:text-sm font-bold tracking-wider uppercase transition-colors block ${
                  isDarkMode ? 'text-emerald-400' : 'text-[#00874e]'
                }`}
              >
                {isFormacoes
                  ? 'FORMAÇÕES CONCLUÍDAS'
                  : isDocentesArea
                  ? 'DOCENTES FORMADOS NA ÁREA'
                  : 'DOCENTES FORMADOS'}
              </span>
              <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isFormacoes
                  ? 'Soma total da Coluna F (Base: 628)'
                  : isDocentesArea
                  ? 'Docentes formados na respectiva área pedagógica'
                  : 'Docentes com formação realizada (Base: 544)'}
              </span>
            </div>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs transition-colors shrink-0 ${
                isDarkMode ? 'bg-emerald-600 text-white' : 'bg-[#009b5a] text-white'
              }`}
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline flex-wrap gap-2">
            <span
              className={`text-4xl md:text-5xl font-black tracking-tight transition-colors ${
                isDarkMode ? 'text-emerald-400' : 'text-[#00874e]'
              }`}
            >
              {formatPtBrNumber(stats.formados)}
            </span>
            <span
              className={`text-xl md:text-2xl font-bold transition-colors ${
                isDarkMode ? 'text-emerald-300' : 'text-[#00874e]'
              }`}
            >
              ({stats.pctFormados.toFixed(1).replace('.', ',')}%)
            </span>
          </div>

          {/* Interactive footer prompt */}
          <div
            className={`mt-4 pt-3 border-t text-xs font-semibold flex items-center justify-between transition-colors ${
              statusFilter === 'formados'
                ? isDarkMode
                  ? 'border-emerald-500/40 text-emerald-300'
                  : 'border-emerald-200 text-emerald-800'
                : isDarkMode
                ? 'border-slate-800 text-slate-400 group-hover:text-emerald-300'
                : 'border-slate-200 text-slate-500 group-hover:text-[#00874e]'
            }`}
          >
            {statusFilter === 'formados' ? (
              <>
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Filtrando: Apenas Formados
                </span>
                <span className="text-[11px] underline opacity-90 hover:opacity-100">Limpar ✕</span>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <span>Clique para filtrar formados</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </span>
            )}
          </div>
        </button>

        {/* Card 3: NÃO FORMADOS / PENDENTES */}
        <button
          type="button"
          id="card-nao-formado"
          onClick={() => handleCardClick('nao_formados')}
          title="Clique para filtrar apenas os docentes não formados na lista abaixo"
          className={`group rounded-2xl border border-t-4 p-6 shadow-xs flex flex-col justify-between relative text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg focus:outline-none ${
            statusFilter === 'nao_formados'
              ? isDarkMode
                ? 'bg-[#11192e] border-rose-500/80 border-t-rose-500 ring-2 ring-rose-500 shadow-lg shadow-rose-950/40'
                : 'bg-white border-rose-400 border-t-[#d90429] ring-2 ring-rose-500/60 shadow-md'
              : isDarkMode
              ? 'bg-[#11192e] border-slate-800 border-t-rose-500 hover:border-rose-600/60 shadow-rose-950/20'
              : 'bg-white border-slate-200 border-t-[#d90429] hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span
                className={`text-xs md:text-sm font-bold tracking-wider uppercase transition-colors block ${
                  isDarkMode ? 'text-rose-400' : 'text-[#c9183b]'
                }`}
              >
                {isFormacoes
                  ? 'FORMAÇÕES PENDENTES'
                  : isDocentesArea
                  ? 'DOCENTES PENDENTES NA ÁREA'
                  : 'DOCENTES NÃO FORMADOS'}
              </span>
              <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isFormacoes
                  ? 'Previstas menos concluídas (Base: 1.982)'
                  : isDocentesArea
                  ? 'Docentes sem conclusão na área pedagógica'
                  : 'Docentes sem formação concluída (Base: 1.267)'}
              </span>
            </div>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs transition-colors shrink-0 ${
                isDarkMode ? 'bg-rose-600 text-white' : 'bg-[#d90429] text-white'
              }`}
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline flex-wrap gap-2">
            <span
              className={`text-4xl md:text-5xl font-black tracking-tight transition-colors ${
                isDarkMode ? 'text-rose-400' : 'text-[#c9183b]'
              }`}
            >
              {formatPtBrNumber(stats.naoFormados)}
            </span>
            <span
              className={`text-xl md:text-2xl font-bold transition-colors ${
                isDarkMode ? 'text-rose-300' : 'text-[#c9183b]'
              }`}
            >
              ({stats.pctNaoFormados.toFixed(1).replace('.', ',')}%)
            </span>
          </div>

          {/* Interactive footer prompt */}
          <div
            className={`mt-4 pt-3 border-t text-xs font-semibold flex items-center justify-between transition-colors ${
              statusFilter === 'nao_formados'
                ? isDarkMode
                  ? 'border-rose-500/40 text-rose-300'
                  : 'border-rose-200 text-rose-800'
                : isDarkMode
                ? 'border-slate-800 text-slate-400 group-hover:text-rose-300'
                : 'border-slate-200 text-slate-500 group-hover:text-[#c9183b]'
            }`}
          >
            {statusFilter === 'nao_formados' ? (
              <>
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                  </span>
                  Filtrando: Apenas Não Formados
                </span>
                <span className="text-[11px] underline opacity-90 hover:opacity-100">Limpar ✕</span>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <span>Clique para filtrar não formados</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Explanatory Footnote Banner: Entenda os números da base */}
      <div
        className={`mt-4 rounded-xl border p-3.5 text-xs transition duration-200 ${
          isDarkMode
            ? 'bg-[#0d1424] border-slate-800 text-slate-300'
            : 'bg-blue-50/70 border-blue-200/80 text-blue-950'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 font-black text-xs">
            ℹ️
          </div>
          <div className="space-y-1">
            <span className="font-bold tracking-tight block">
              Entenda os números da sua base primária:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-0.5">
              <div>
                <strong className={isDarkMode ? 'text-blue-300' : 'text-blue-900'}>
                  1. Público-Alvo (1.811 docentes):
                </strong>{' '}
                Total de pessoas físicas (professores únicos) na rede. Deles,{' '}
                <strong>544</strong> (30,0%) já concluíram formação em pelo menos um componente.
              </div>
              <div>
                <strong className={isDarkMode ? 'text-purple-300' : 'text-purple-900'}>
                  2. Docentes por Área:
                </strong>{' '}
                Professores em mais de uma área (ex: Matemática e Tecnologia) são avaliados em cada área de conhecimento em que atuam.
              </div>
              <div>
                <strong className={isDarkMode ? 'text-emerald-300' : 'text-emerald-900'}>
                  3. Formações Previstas (2.610):
                </strong>{' '}
                Soma de todas as linhas de componentes (Coluna E). Das 2.610 formações previstas,{' '}
                <strong>628</strong> (24,1%) foram concluídas (Coluna F).
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
