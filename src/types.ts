export interface TeacherComponent {
  componentName: string;
  area: string;
  previstas: number;
  concluidas: number;
  concluido: boolean;
}

export interface TeacherRecord {
  id: string;
  nome: string;
  escola: string;
  components: TeacherComponent[];
  areas: string[];
  hasMultipleAreas: boolean;
  isConsolidatedFormado: boolean;
  totalPrevistas: number;
  totalConcluidas: number;
}

export interface GoogleSheetAppsScriptResponse {
  title?: string;
  updatedAt?: string;
  sheets?: Record<string, Record<string, any>[]>;
  error?: string;
}

export type ViewMode = 'docentes' | 'docentes_area' | 'formacoes';
export type StatusFilter = 'all' | 'formados' | 'nao_formados';

export interface FilterState {
  escolas: string[];
  areas: string[];
  componentes: string[];
  search: string;
  viewMode: ViewMode;
}

export interface SummaryStats {
  previstas: number;
  formados: number;
  naoFormados: number;
  pctFormados: number;
  pctNaoFormados: number;
  totalDocentes: number;
  viewMode: ViewMode;
}
