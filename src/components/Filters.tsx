import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';

interface FiltersProps {
  schools: string[];
  areas: string[];
  components: string[];
  selectedSchools: string[];
  selectedAreas: string[];
  selectedComponents: string[];
  onSchoolsChange: (schools: string[]) => void;
  onAreasChange: (areas: string[]) => void;
  onComponentsChange: (components: string[]) => void;
  onClearAllFilters: () => void;
  isDarkMode: boolean;
}

export const Filters: React.FC<FiltersProps> = ({
  schools,
  areas,
  components,
  selectedSchools,
  selectedAreas,
  selectedComponents,
  onSchoolsChange,
  onAreasChange,
  onComponentsChange,
  onClearAllFilters,
  isDarkMode,
}) => {
  const hasActiveFilters =
    selectedSchools.length > 0 ||
    selectedAreas.length > 0 ||
    selectedComponents.length > 0;

  return (
    <section
      id="filtros-de-consulta-card"
      className={`rounded-2xl border p-5 md:p-6 mb-6 transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#11192e] border-slate-800 shadow-sm'
          : 'bg-white border-slate-200/90 shadow-sm'
      }`}
    >
      {/* Header with Title and Clear All */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-colors ${
              isDarkMode
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                : 'bg-[#162f65] text-white'
            }`}
          >
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h3
              className={`text-lg md:text-xl font-bold transition-colors ${
                isDarkMode ? 'text-white' : 'text-[#0a1b3f]'
              }`}
            >
              Filtros de Consulta Múltipla
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Selecione uma ou mais escolas, áreas de conhecimento e componentes curriculares
            </p>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAllFilters}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar todos os filtros</span>
          </button>
        )}
      </div>

      {/* 3 Multi-Select Dropdowns: Escola, Área e Componente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {/* Unidade Escolar */}
        <MultiSelectDropdown
          id="select-unidades-escolares"
          label="UNIDADE ESCOLAR"
          placeholder="Todas as Escolas"
          searchPlaceholder="Pesquisar escola..."
          options={schools}
          selectedValues={selectedSchools}
          onChange={onSchoolsChange}
          isDarkMode={isDarkMode}
        />

        {/* Área do Conhecimento */}
        <MultiSelectDropdown
          id="select-areas-conhecimento"
          label="ÁREA DO CONHECIMENTO"
          placeholder="Todas as Áreas"
          searchPlaceholder="Pesquisar área..."
          options={areas}
          selectedValues={selectedAreas}
          onChange={onAreasChange}
          isDarkMode={isDarkMode}
        />

        {/* Componente Curricular */}
        <MultiSelectDropdown
          id="select-componentes-curriculares"
          label="COMPONENTE CURRICULAR"
          placeholder="Todos os Componentes"
          searchPlaceholder="Pesquisar componente..."
          options={components}
          selectedValues={selectedComponents}
          onChange={onComponentsChange}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Active Filter Chips/Tags */}
      {hasActiveFilters && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center flex-wrap gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider mr-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Filtros Ativos:
          </span>

          {/* School tags */}
          {selectedSchools.map((school) => (
            <span
              key={`school-${school}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isDarkMode
                  ? 'bg-blue-950/60 border-blue-800/60 text-blue-200'
                  : 'bg-blue-50 border-blue-200 text-[#12285a]'
              }`}
            >
              <span className="font-semibold">Escola:</span>
              <span className="truncate max-w-[200px]">{school}</span>
              <button
                type="button"
                onClick={() => onSchoolsChange(selectedSchools.filter((s) => s !== school))}
                className="hover:opacity-75 transition cursor-pointer p-0.5"
                title="Remover escola"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Area tags */}
          {selectedAreas.map((area) => (
            <span
              key={`area-${area}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isDarkMode
                  ? 'bg-purple-950/60 border-purple-800/60 text-purple-200'
                  : 'bg-purple-50 border-purple-200 text-purple-900'
              }`}
            >
              <span className="font-semibold">Área:</span>
              <span className="truncate max-w-[200px]">{area}</span>
              <button
                type="button"
                onClick={() => onAreasChange(selectedAreas.filter((a) => a !== area))}
                className="hover:opacity-75 transition cursor-pointer p-0.5"
                title="Remover área"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Component tags */}
          {selectedComponents.map((comp) => (
            <span
              key={`comp-${comp}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isDarkMode
                  ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <span className="font-semibold">Componente:</span>
              <span className="truncate max-w-[200px]">{comp}</span>
              <button
                type="button"
                onClick={() => onComponentsChange(selectedComponents.filter((c) => c !== comp))}
                className="hover:opacity-75 transition cursor-pointer p-0.5"
                title="Remover componente"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
};
