import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { TeacherRecord, ViewMode, StatusFilter } from '../types';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';

interface TeachersTableProps {
  teachers: TeacherRecord[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedSchools?: string[];
  selectedAreas?: string[];
  selectedComponents?: string[];
  viewMode?: ViewMode;
  isDarkMode: boolean;
  lastUpdated?: string;
  statusFilter?: StatusFilter;
  onStatusFilterChange?: (filter: StatusFilter) => void;
}

export const TeachersTable: React.FC<TeachersTableProps> = ({
  teachers,
  searchQuery,
  onSearchChange,
  selectedSchools = [],
  selectedAreas = [],
  selectedComponents = [],
  viewMode = 'docentes',
  isDarkMode,
  lastUpdated,
  statusFilter = 'all',
  onStatusFilterChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<'escola' | 'professor'>('escola');

  // Reset to page 1 whenever filters, search, or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSchools, selectedAreas, selectedComponents, sortBy, statusFilter]);

  // Sort teachers based on user selection (default: Escola A-Z matching Photo 2)
  const sortedTeachers = useMemo(() => {
    const list = [...teachers];
    return list.sort((a, b) => {
      if (sortBy === 'escola') {
        const cmpEscola = a.escola.localeCompare(b.escola, 'pt-BR');
        if (cmpEscola !== 0) return cmpEscola;
        return a.nome.localeCompare(b.nome, 'pt-BR');
      } else {
        const cmpNome = a.nome.localeCompare(b.nome, 'pt-BR');
        if (cmpNome !== 0) return cmpNome;
        return a.escola.localeCompare(b.escola, 'pt-BR');
      }
    });
  }, [teachers, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedTeachers.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const currentTeachers = useMemo(() => {
    return sortedTeachers.slice(startIndex, startIndex + pageSize);
  }, [sortedTeachers, startIndex, pageSize]);

  const getFilterDescription = () => {
    const parts: string[] = [];
    if (selectedSchools.length > 0) {
      parts.push(`Escolas: ${selectedSchools.join(', ')}`);
    }
    if (selectedAreas.length > 0) {
      parts.push(`Áreas: ${selectedAreas.join(', ')}`);
    }
    if (selectedComponents.length > 0) {
      parts.push(`Componentes: ${selectedComponents.join(', ')}`);
    }
    if (statusFilter === 'formados') {
      parts.push('Situação: Apenas Formados');
    } else if (statusFilter === 'nao_formados') {
      parts.push('Situação: Apenas Não Formados');
    }
    if (searchQuery) {
      parts.push(`Busca: "${searchQuery}"`);
    }
    return parts.join(' | ');
  };

  const handleExportExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToExcel(sortedTeachers, `Relacao_Docentes_URE_Sul_3_${dateStr}.xlsx`, lastUpdated);
  };

  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToCSV(sortedTeachers, `Relacao_Docentes_URE_Sul_3_${dateStr}.csv`, lastUpdated);
  };

  const handleExportPDF = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToPDF(sortedTeachers, getFilterDescription(), `Relatorio_Docentes_URE_Sul_3_${dateStr}.pdf`, lastUpdated);
  };

  return (
    <section id="relacao-de-docentes-section" className="mb-12">
      {/* Table Header Bar matching Photo 2 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        {/* Title, Icon and Active Filter Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-colors shrink-0 ${
              isDarkMode ? 'bg-blue-600 text-white' : 'bg-[#12285a] text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <h3
            className={`text-xl md:text-2xl font-bold transition-colors flex items-center gap-2 flex-wrap ${
              isDarkMode ? 'text-white' : 'text-[#0a1b3f]'
            }`}
          >
            <span>Relação de Docentes</span>
            <span
              className={`font-extrabold transition-colors ${
                isDarkMode ? 'text-blue-300' : 'text-[#12285a]'
              }`}
            >
              ({teachers.length})
            </span>
          </h3>

          {/* Active Status Filter Badge with Click-to-Dismiss */}
          {statusFilter === 'formados' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-2xs animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              <span>Apenas Formados</span>
              <button
                type="button"
                onClick={() => onStatusFilterChange?.('all')}
                title="Remover filtro (exibir todos os docentes)"
                className="ml-1 p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-full transition cursor-pointer text-xs leading-none"
              >
                ✕
              </button>
            </span>
          )}

          {statusFilter === 'nao_formados' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 shadow-2xs animate-fadeIn">
              <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
              <span>Apenas Não Formados</span>
              <button
                type="button"
                onClick={() => onStatusFilterChange?.('all')}
                title="Remover filtro (exibir todos os docentes)"
                className="ml-1 p-0.5 hover:bg-rose-200 dark:hover:bg-rose-800 text-rose-900 dark:text-rose-200 rounded-full transition cursor-pointer text-xs leading-none"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        {/* Search Bar and Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 md:w-72">
            <div
              className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                isDarkMode ? 'text-slate-400' : 'text-slate-400'
              }`}
            >
              <Search className="w-4 h-4" />
            </div>
            <input
              id="input-busca-professor"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar professor..."
              className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-sm transition outline-none shadow-2xs border ${
                isDarkMode
                  ? 'bg-[#17223b] border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-900/50'
                  : 'bg-white border-slate-300 hover:border-slate-400 focus:border-[#162f65] focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Export Buttons: Directly save to PC (no print popup) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-export-excel"
              type="button"
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#00874e] hover:bg-[#007040] text-white font-bold text-xs md:text-sm py-2.5 px-4 rounded-xl shadow-xs transition active:scale-98 cursor-pointer"
              title="Baixar planilha Excel (.xlsx) diretamente no computador"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Salvar Excel (.xlsx)</span>
            </button>

            <button
              id="btn-export-csv"
              type="button"
              onClick={handleExportCSV}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-white font-bold text-xs md:text-sm py-2.5 px-4 rounded-xl shadow-xs transition active:scale-98 cursor-pointer ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-[#16337a] hover:bg-[#0f2457]'
              }`}
              title="Baixar arquivo CSV compatível com Excel diretamente no computador"
            >
              <Download className="w-4 h-4" />
              <span>Salvar CSV</span>
            </button>

            <button
              id="btn-export-pdf"
              type="button"
              onClick={handleExportPDF}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-white font-bold text-xs md:text-sm py-2.5 px-3.5 rounded-xl shadow-xs transition active:scale-98 cursor-pointer ${
                isDarkMode
                  ? 'bg-rose-700 hover:bg-rose-600'
                  : 'bg-[#c9183b] hover:bg-[#a61330]'
              }`}
              title="Baixar relatório em PDF (.pdf) formatado diretamente no computador"
            >
              <FileText className="w-4 h-4" />
              <span>Baixar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sorting & Pagination controls bar */}
      <div
        className={`flex items-center justify-between flex-wrap gap-3 text-xs mb-3 px-1 transition-colors ${
          isDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Sort Order Toggle */}
          <div
            className={`flex items-center gap-1.5 border rounded-lg p-0.5 shadow-2xs transition-colors ${
              isDarkMode ? 'bg-[#17223b] border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <span
              className={`font-semibold pl-2 pr-1 text-[11px] uppercase tracking-wider ${
                isDarkMode ? 'text-slate-400' : 'text-slate-400'
              }`}
            >
              Ordem:
            </span>
            <button
              type="button"
              onClick={() => setSortBy('escola')}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition cursor-pointer ${
                sortBy === 'escola'
                  ? isDarkMode
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-[#12285a] text-white shadow-2xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ordena pela Escola primeiro (Foto 2)"
            >
              Escola (A-Z)
            </button>
            <button
              type="button"
              onClick={() => setSortBy('professor')}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition cursor-pointer ${
                sortBy === 'professor'
                  ? isDarkMode
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-[#12285a] text-white shadow-2xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ordena alfabeticamente pelo nome do professor"
            >
              Professor (A-Z)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Linhas por página:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className={`border rounded-md px-2 py-1 text-xs font-semibold cursor-pointer outline-none shadow-2xs transition-colors ${
              isDarkMode
                ? 'bg-[#17223b] border-slate-700 text-slate-200'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Main Table Structure matching Photo 2 with subtle zebra striping */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden transition-colors duration-200 ${
          isDarkMode ? 'bg-[#11192e] border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="overflow-x-auto">
          <table id="table-relacao-docentes" className="w-full text-left border-collapse">
            {/* Table Header matching Photo 2 */}
            <thead>
              <tr
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  isDarkMode
                    ? 'bg-[#0a1020] text-slate-200 border-b border-slate-800'
                    : 'bg-[#132347] text-white'
                }`}
              >
                <th className="py-4 px-6 w-1/3 min-w-[240px]">ESCOLA</th>
                <th className="py-4 px-6 w-1/3 min-w-[240px]">PROFESSOR</th>
                <th className="py-4 px-6 w-1/3 min-w-[240px]">SITUAÇÃO</th>
              </tr>
            </thead>

            {/* Table Body with subtle alternating colors for effortless reading in both Light and Dark mode */}
            <tbody
              className={`divide-y text-sm transition-colors ${
                isDarkMode ? 'divide-slate-800/80' : 'divide-slate-200/60'
              }`}
            >
              {currentTeachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className={`py-16 px-6 text-center transition-colors ${
                      isDarkMode ? 'bg-[#11192e] text-slate-400' : 'bg-white text-slate-500'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-xs ${
                          isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-[#12285a]'
                        }`}
                      >
                        <Database className="w-6 h-6 stroke-[1.75]" />
                      </div>
                      <p
                        className={`font-bold text-base transition-colors ${
                          isDarkMode ? 'text-white' : 'text-[#0a1b3f]'
                        }`}
                      >
                        {statusFilter !== 'all'
                          ? `Nenhum docente ${statusFilter === 'formados' ? 'formado' : 'não formado'} encontrado para os filtros ativos`
                          : teachers.length === 0
                          ? 'Nenhum dado carregado da planilha'
                          : 'Nenhum docente encontrado para os filtros selecionados'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {statusFilter !== 'all' ? (
                          <button
                            type="button"
                            onClick={() => onStatusFilterChange?.('all')}
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs cursor-pointer"
                          >
                            Exibir todos os docentes
                          </button>
                        ) : teachers.length === 0 ? (
                          'Conecte sua planilha Google no botão "Planilha Google" no topo para sincronizar os docentes, escolas e formações.'
                        ) : (
                          'Tente alterar os filtros de escola, componente curricular ou o termo de busca.'
                        )}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTeachers.map((teacher, index) => {
                  // Subtle alternating row color:
                  // In Light mode: pure white and subtle soft slate-50
                  // In Dark mode: #11192e and #0b1222 with hover highlight
                  const isEvenRow = index % 2 === 0;
                  const rowClass = isDarkMode
                    ? isEvenRow
                      ? 'bg-[#11192e] hover:bg-[#1a2542] transition group'
                      : 'bg-[#0b1222] hover:bg-[#1a2542] transition group'
                    : isEvenRow
                    ? 'bg-white hover:bg-blue-50/60 transition group'
                    : 'bg-slate-50/75 hover:bg-blue-50/60 transition group';

                  return (
                    <tr
                      key={teacher.id || index}
                      className={rowClass}
                    >
                      {/* ESCOLA matching Photo 2 */}
                      <td className="py-3.5 px-6 align-top">
                        <span
                          className={`font-bold uppercase text-xs md:text-sm leading-snug block transition-colors ${
                            isDarkMode ? 'text-blue-300' : 'text-[#12285a]'
                          }`}
                        >
                          {teacher.escola}
                        </span>
                      </td>

                      {/* PROFESSOR matching Photo 2 - Only clean name without multiple formations label */}
                      <td className="py-3.5 px-6 align-top">
                        <span
                          className={`font-extrabold uppercase text-xs md:text-sm tracking-wide block transition-colors ${
                            isDarkMode ? 'text-slate-100' : 'text-[#0a1b3f]'
                          }`}
                        >
                          {teacher.nome}
                        </span>
                      </td>

                      {/* SITUAÇÃO matching Photo 2 - Each component formation displayed clearly in front */}
                      <td className="py-3.5 px-6 align-top">
                        <div className="flex flex-col gap-1.5 items-start">
                          {teacher.components.length === 0 ? (
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border transition ${
                                isDarkMode
                                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              SEM COMPONENTE REGISTRADO
                            </span>
                          ) : (
                            teacher.components.map((comp, cIdx) => {
                              const isConcluido = comp.concluido;
                              return (
                                <span
                                  key={cIdx}
                                  className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border transition shadow-2xs ${
                                    isDarkMode
                                      ? isConcluido
                                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                                        : 'bg-rose-950/80 text-rose-300 border-rose-600/60'
                                      : isConcluido
                                      ? 'bg-[#e8f8f0] text-[#00874e] border-[#a2e7c4]'
                                      : 'bg-[#ffecee] text-[#c9183b] border-[#fcc2cb]'
                                  }`}
                                >
                                  {isConcluido ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                                  )}
                                  <span className="uppercase tracking-tight whitespace-nowrap">
                                    {comp.componentName}
                                  </span>
                                  {comp.area && comp.area.toUpperCase() !== comp.componentName.toUpperCase() && (
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                                        isDarkMode
                                          ? isConcluido
                                            ? 'bg-emerald-900/60 text-emerald-200'
                                            : 'bg-rose-900/60 text-rose-200'
                                          : isConcluido
                                          ? 'bg-emerald-100/90 text-emerald-800'
                                          : 'bg-rose-100/90 text-rose-800'
                                      }`}
                                    >
                                      {comp.area}
                                    </span>
                                  )}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {teachers.length > 0 && (
          <div
            className={`px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-colors border-t ${
              isDarkMode
                ? 'bg-[#0a1020] border-slate-800 text-slate-300'
                : 'bg-slate-50/90 border-slate-200 text-slate-600'
            }`}
          >
            <div>
              Mostrando{' '}
              <span className={`font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-[#0a1b3f]'}`}>
                {startIndex + 1}
              </span>{' '}
              a{' '}
              <span className={`font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-[#0a1b3f]'}`}>
                {Math.min(startIndex + pageSize, teachers.length)}
              </span>{' '}
              de{' '}
              <span className={`font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-[#0a1b3f]'}`}>
                {teachers.length}
              </span>{' '}
              docentes
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-lg border transition cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'border-slate-700 bg-[#17223b] text-slate-200 hover:bg-[#203055]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-semibold px-2">
                Página {currentPage} de {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded-lg border transition cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'border-slate-700 bg-[#17223b] text-slate-200 hover:bg-[#203055]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
