import * as xlsx from 'xlsx';
import { GoogleSheetAppsScriptResponse, TeacherRecord, TeacherComponent, SummaryStats, ViewMode } from '../types';

/**
 * Normalizes text for matching (uppercased, trimmed, trimmed extra spaces).
 */
export function normalizeKey(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Maps a curricular component to its pedagogical/curricular area.
 * Rules according to user guidelines:
 * - TECNOLOGIA: Programação e Robótica (e Tecnologia / Inovação)
 * - LÍNGUA PORTUGUESA: Língua Portuguesa, OE Língua Portuguesa, Redação e Leitura (e Arte / Inglês)
 * - MATEMÁTICA: Matemática e OE Matemática
 * - CIÊNCIAS DA NATUREZA: Ciências da Natureza, Biologia, Física, Química
 * - CIÊNCIAS HUMANAS: Ciências Humanas, História, Geografia, Filosofia, Sociologia
 */
export function getComponentArea(componentName: string, explicitArea?: string): string {
  if (explicitArea && explicitArea.trim()) {
    const normExplicit = normalizeKey(explicitArea);
    if (
      normExplicit.includes('TECNOLOG') ||
      normExplicit.includes('PROGRAMA') ||
      normExplicit.includes('ROBOTICA') ||
      normExplicit.includes('INOVAC')
    ) {
      return 'TECNOLOGIA';
    }
    if (normExplicit.includes('MATEMATICA')) {
      return 'MATEMÁTICA';
    }
    if (
      normExplicit.includes('PORTUGUES') ||
      normExplicit.includes('REDACAO') ||
      normExplicit.includes('LEITURA') ||
      normExplicit.includes('INGLES') ||
      normExplicit.includes('ARTE')
    ) {
      return 'LÍNGUA PORTUGUESA';
    }
    if (
      normExplicit.includes('NATUREZA') ||
      normExplicit.includes('BIOLOG') ||
      normExplicit.includes('FISIC') ||
      normExplicit.includes('QUIMIC')
    ) {
      return 'CIÊNCIAS DA NATUREZA';
    }
    if (
      normExplicit.includes('HUMANA') ||
      normExplicit.includes('HISTOR') ||
      normExplicit.includes('GEOGRAF') ||
      normExplicit.includes('FILOSOF') ||
      normExplicit.includes('SOCIOL')
    ) {
      return 'CIÊNCIAS HUMANAS';
    }
  }

  const norm = normalizeKey(componentName);

  // Tecnologia: Programação e Robótica
  if (
    norm.includes('ROBOTICA') ||
    norm.includes('PROGRAMA') ||
    norm.includes('TECNOLOG') ||
    norm.includes('INOVAC')
  ) {
    return 'TECNOLOGIA';
  }

  // Língua Portuguesa: Língua Portuguesa, OE Língua Portuguesa, Redação e Leitura
  if (
    norm.includes('PORTUGUES') ||
    norm.includes('REDACAO') ||
    norm.includes('LEITURA') ||
    norm.includes('INGLES') ||
    norm.includes('ARTE')
  ) {
    return 'LÍNGUA PORTUGUESA';
  }

  // Matemática: Matemática e OE Matemática
  if (norm.includes('MATEMATICA')) {
    return 'MATEMÁTICA';
  }

  // Ciências da Natureza
  if (
    norm.includes('NATUREZA') ||
    norm.includes('BIOLOG') ||
    norm.includes('FISIC') ||
    norm.includes('QUIMIC')
  ) {
    return 'CIÊNCIAS DA NATUREZA';
  }

  // Ciências Humanas
  if (
    norm.includes('HUMANA') ||
    norm.includes('HISTOR') ||
    norm.includes('GEOGRAF') ||
    norm.includes('FILOSOF') ||
    norm.includes('SOCIOL')
  ) {
    return 'CIÊNCIAS HUMANAS';
  }

  return componentName.trim().toUpperCase();
}

/**
 * Parses a numeric value safely.
 */
function parseNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

/**
 * Evaluates whether a component row is completed based on the user's rule:
 * "Quando tiver 1 a formação ta concluída, quando tiver em branco ainda não."
 * Also supports affirmative values like 'SIM', 'CONCLUIDO', 1.
 */
export function isRowCompleted(row: Record<string, any>): boolean {
  // First, look specifically for "Formações Concluídas" or similar "concluida" column
  for (const [key, val] of Object.entries(row)) {
    const normKey = normalizeKey(key);
    if (
      normKey.includes('CONCLUIDA') ||
      normKey.includes('CONCLUIDO') ||
      normKey.includes('FORMADO') ||
      normKey.includes('STATUS') ||
      normKey.includes('SITUACAO')
    ) {
      if (val === null || val === undefined) continue;
      const strVal = String(val).trim();
      if (strVal === '') continue; // em branco = ainda não

      const normVal = normalizeKey(strVal);

      // Explicit negatives or empty-like markers
      if (
        normVal === '0' ||
        normVal === '-1' ||
        normVal === 'NAO' ||
        normVal === 'PENDENTE' ||
        normVal === 'EM ANDAMENTO' ||
        normVal === 'REPROVADO' ||
        normVal === 'AUSENTE'
      ) {
        continue;
      }

      // Check numeric 1 or greater
      const num = Number(strVal);
      if (!isNaN(num)) {
        if (num >= 1) return true;
        continue;
      }

      // Check positive keywords
      if (
        normVal === '1' ||
        normVal === 'SIM' ||
        normVal === 'CONCLUIDO' ||
        normVal === 'CONCLUIDA' ||
        normVal === 'FORMADO' ||
        normVal === 'FORMADA' ||
        normVal === 'OK' ||
        normVal === 'APROVADO' ||
        normVal === 'PRESENTE'
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Extracts the numerical value of Formações Concluídas from row.
 * When blank or 0 -> 0. When 1 or positive number -> number (typically 1).
 */
export function getRowConcluidas(row: Record<string, any>): number {
  for (const [key, val] of Object.entries(row)) {
    const normKey = normalizeKey(key);
    if (normKey.includes('CONCLUIDA') || normKey.includes('CONCLUIDO')) {
      if (val === null || val === undefined || String(val).trim() === '') return 0;
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
      if (isRowCompleted(row)) return 1;
    }
  }
  return isRowCompleted(row) ? 1 : 0;
}

/**
 * Extracts Formações Previstas from row (default 1 if blank or unspecified).
 */
export function getRowPrevistas(row: Record<string, any>): number {
  for (const [key, val] of Object.entries(row)) {
    const normKey = normalizeKey(key);
    if (
      normKey.includes('PREVIST') ||
      normKey === 'E' ||
      normKey === 'FORMACOES PREVISTAS' ||
      normKey === 'PREVISTAS'
    ) {
      if (val === null || val === undefined) return 1;
      const strVal = String(val).trim();
      if (strVal === '') return 1;
      const num = Number(strVal);
      if (!isNaN(num) && num >= 0) return num;
    }
  }
  return 1;
}

/**
 * Parses an ArrayBuffer (from .xlsx or .xls file) into GoogleSheetAppsScriptResponse
 */
export function parseSpreadsheetBuffer(buffer: ArrayBuffer, fileName: string): GoogleSheetAppsScriptResponse {
  const workbook = xlsx.read(new Uint8Array(buffer), { type: 'array' });
  const sheets: Record<string, Record<string, any>[]> = {};

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
    sheets[sheetName] = rows;
  });

  return {
    title: fileName || 'Planilha Carregada',
    updatedAt: new Date().toISOString(),
    sheets,
  };
}

/**
 * Transforms raw sheets data from Google Apps Script or uploaded workbook into structured TeacherRecord[].
 * 
 * CORE ARCHITECTURAL LOGIC:
 * 1. Single sheet structure (base primária informada pelo usuário):
 *    - Escola
 *    - Docente
 *    - Área
 *    - Componente
 *    - Formações Previstas (Coluna E - soma total na base: 2.610; Adelaide Rosa: 40; Alberto Salotti: 50)
 *    - Formações Concluídas (Coluna F - soma total na base: 628; Adelaide Rosa: 13; Alberto Salotti: 8)
 * 2. Cada escola mantém seus dados estritamente separados:
 *    - Não há transferência artificial de formações entre escolas que altere a soma da Coluna F da escola.
 *    - Se o professor leciona em 2 escolas, ele aparece em ambas com os respectivos componentes daquela escola.
 * 3. A soma das métricas bate 100% com a base de dados primária:
 *    - Previstas = Soma da Coluna E
 *    - Concluídas = Soma da Coluna F
 *    - Pendentes/Não Concluídas = Previstas - Concluídas
 */
export function processSpreadsheetData(data: GoogleSheetAppsScriptResponse): TeacherRecord[] {
  if (!data || !data.sheets) {
    return [];
  }

  const sheetNames = Object.keys(data.sheets);
  if (sheetNames.length === 0) return [];

  const firstSheetName = sheetNames[0];
  const firstSheetRows = data.sheets[firstSheetName] || [];

  // Check if first sheet is already a self-contained sheet with Docente + Componente
  const isFirstSheetSelfContained = firstSheetRows.some((row) => {
    let hasDoc = false;
    let hasComp = false;
    for (const key of Object.keys(row)) {
      const norm = normalizeKey(key);
      if (norm.includes('DOCENTE') || norm.includes('PROFESSOR') || norm === 'NOME') hasDoc = true;
      if (norm.includes('COMPONENTE') || norm.includes('DISCIPLINA')) hasComp = true;
    }
    return hasDoc && hasComp;
  });

  const isSingleUnifiedSheet = sheetNames.length === 1 || isFirstSheetSelfContained;

  // Build lookup map for legacy multi-sheet mode (sheet 0 lookup)
  const schoolLookupMap = new Map<string, { nome: string; escola: string }>();
  if (!isSingleUnifiedSheet) {
    firstSheetRows.forEach((row) => {
      let nome = '';
      let escola = '';

      for (const [key, val] of Object.entries(row)) {
        const normKey = normalizeKey(key);
        if (normKey.includes('DOCENTE') || normKey.includes('PROFESSOR') || normKey.includes('NOME')) {
          if (!nome && val) nome = String(val).trim();
        }
        if (normKey.includes('ESCOLA') || normKey.includes('UNIDADE') || normKey.includes('U.E')) {
          if (!escola && val) escola = String(val).trim();
        }
      }

      if (nome) {
        const key = normalizeKey(nome);
        if (!schoolLookupMap.has(key)) {
          schoolLookupMap.set(key, {
            nome: nome.toUpperCase().trim(),
            escola: escola ? escola.toUpperCase().trim() : '',
          });
        }
      }
    });
  }

  const startSheetIndex = isSingleUnifiedSheet ? 0 : 1;

  // Raw row data container
  interface RawRowItem {
    docName: string;
    normDocKey: string;
    schoolName: string;
    normSchoolKey: string;
    componentName: string;
    normCompKey: string;
    area: string;
    normAreaKey: string;
    previstas: number;
    isConcluido: boolean;
    concluidas: number;
  }

  const rawItems: RawRowItem[] = [];

  // Read all rows
  for (let s = startSheetIndex; s < sheetNames.length; s++) {
    const sheetName = sheetNames[s];
    const rows = data.sheets[sheetName] || [];

    rows.forEach((row) => {
      let docName = '';
      let rowSchool = '';
      let rowArea = '';
      let rowComponent = '';

      for (const [key, val] of Object.entries(row)) {
        const normKey = normalizeKey(key);
        if (normKey.includes('DOCENTE') || normKey.includes('PROFESSOR') || normKey === 'NOME') {
          if (!docName && val) docName = String(val).trim();
        }
        if (normKey.includes('ESCOLA') || normKey.includes('UNIDADE') || normKey.includes('U.E')) {
          if (!rowSchool && val) rowSchool = String(val).trim();
        }
        if (normKey === 'AREA' || normKey.includes('AREA DO CONHECIMENTO')) {
          if (!rowArea && val) rowArea = String(val).trim();
        }
        if (normKey.includes('COMPONENTE') || normKey.includes('DISCIPLINA')) {
          if (!rowComponent && val) rowComponent = String(val).trim();
        }
      }

      if (!docName) return;

      const normDocKey = normalizeKey(docName);
      const lookup = schoolLookupMap.get(normDocKey);
      const effectiveSchool = (rowSchool || (lookup ? lookup.escola : '')).toUpperCase().trim();
      const normSchoolKey = normalizeKey(effectiveSchool);

      const rawCompName = (rowComponent || sheetName).trim();
      const componentName = rawCompName.toUpperCase();
      const normCompKey = normalizeKey(componentName);

      const area = getComponentArea(componentName, rowArea);
      const normAreaKey = normalizeKey(area);

      // Read previstas and concluidas according to column E and F
      const previstas = getRowPrevistas(row);
      const concluidas = getRowConcluidas(row);
      const isConcluido = concluidas >= 1 || isRowCompleted(row);

      rawItems.push({
        docName: (lookup ? lookup.nome : docName).toUpperCase().trim(),
        normDocKey,
        schoolName: effectiveSchool,
        normSchoolKey,
        componentName,
        normCompKey,
        area,
        normAreaKey,
        previstas,
        isConcluido,
        concluidas,
      });
    });
  }

  // Group strictly by (Escola, Docente)
  // Teacher appears separately in each school where they teach
  interface SchoolTeacherTemp {
    id: string;
    nome: string;
    escola: string;
    normDocKey: string;
    componentsMap: Map<string, TeacherComponent>;
  }

  const schoolTeacherMap = new Map<string, SchoolTeacherTemp>();

  rawItems.forEach((item) => {
    // Unique key per (school, teacher)
    const compositeKey = `${item.normSchoolKey}___${item.normDocKey}`;

    let stRecord = schoolTeacherMap.get(compositeKey);
    if (!stRecord) {
      stRecord = {
        id: compositeKey,
        nome: item.docName,
        escola: item.schoolName,
        normDocKey: item.normDocKey,
        componentsMap: new Map<string, TeacherComponent>(),
      };
      schoolTeacherMap.set(compositeKey, stRecord);
    }

    // Check if this component already exists for this teacher at this school
    const existingComp = stRecord.componentsMap.get(item.normCompKey);
    if (!existingComp) {
      stRecord.componentsMap.set(item.normCompKey, {
        componentName: item.componentName,
        area: item.area,
        previstas: item.previstas,
        concluidas: item.concluidas,
        concluido: item.isConcluido,
      });
    } else {
      // Aggregate previstas from column E and concluidas from column F
      existingComp.previstas += item.previstas;
      existingComp.concluidas += item.concluidas;
      existingComp.concluido = existingComp.concluidas >= 1;
    }
  });

  // Build final TeacherRecord[] list
  const result: TeacherRecord[] = [];

  schoolTeacherMap.forEach((st) => {
    const components = Array.from(st.componentsMap.values());
    if (components.length === 0) return;

    // Distinct areas in this school
    const areaSet = new Set<string>();
    components.forEach((c) => areaSet.add(c.area));
    const areas = Array.from(areaSet);
    const hasMultipleAreas = areas.length > 1 || components.length > 1;

    // Sum of Formações Previstas (Coluna E) and Concluídas (Coluna F) for this teacher in this school
    const totalPrevistas = components.reduce((acc, c) => acc + c.previstas, 0) || 1;
    const totalConcluidas = components.reduce((acc, c) => acc + c.concluidas, 0);
    const isConsolidatedFormado = totalConcluidas > 0;

    result.push({
      id: st.id,
      nome: st.nome,
      escola: st.escola,
      components,
      areas,
      hasMultipleAreas,
      isConsolidatedFormado,
      totalPrevistas,
      totalConcluidas,
    });
  });

  // Sort primarily by ESCOLA (A-Z) and secondarily by PROFESSOR (A-Z)
  return result.sort((a, b) => {
    const cmpEscola = a.escola.localeCompare(b.escola, 'pt-BR');
    if (cmpEscola !== 0) return cmpEscola;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
}

/**
 * Calculates summary metrics adhering strictly to the primary database:
 * 1. "A coluna previstas deve representar exatamente a soma da coluna E 'Formações previstas'."
 * 2. As formações concluídas representam a soma exata da coluna F 'Formações concluídas'.
 * 3. O filtro de escola, área e componente calcula as métricas com exatidão matemática sobre as linhas correspondentes:
 *    - No modo 'formacoes': Total geral de 2.610 previstas e 628 concluídas (Adelaide: 40/13; Alberto Salotti: 50/8)
 *    - No modo 'docentes': Total geral de 1.811 docentes únicos e 544 formados (1.267 não formados)
 */
export function calculateStats(
  teachers: TeacherRecord[],
  filterAreas?: string | string[],
  filterComponents?: string | string[],
  viewMode: ViewMode = 'formacoes'
): SummaryStats {
  // Normalize area filters
  let normFilterAreas: string[] | null = null;
  if (Array.isArray(filterAreas)) {
    const valid = filterAreas.filter((a) => a && a !== 'ALL').map(normalizeKey);
    if (valid.length > 0) normFilterAreas = valid;
  } else if (filterAreas && filterAreas !== 'ALL') {
    normFilterAreas = [normalizeKey(filterAreas)];
  }

  // Normalize component filters
  let normFilterComps: string[] | null = null;
  if (Array.isArray(filterComponents)) {
    const valid = filterComponents.filter((c) => c && c !== 'ALL').map(normalizeKey);
    if (valid.length > 0) normFilterComps = valid;
  } else if (filterComponents && filterComponents !== 'ALL') {
    normFilterComps = [normalizeKey(filterComponents)];
  }

  if (viewMode === 'docentes') {
    // Mode 1: Público-Alvo Real da Rede (1.811 docentes únicos)
    // Cada professor físico é contabilizado exatamente UMA vez no público-alvo geral.
    // O professor é considerado "formado" se concluiu a formação de pelo menos 1 de seus componentes atribuídos.
    const teacherMap = new Map<string, { teacherName: string; isFormado: boolean }>();

    teachers.forEach((t) => {
      const docKey = normalizeKey(t.nome);

      // Check matching components in this teacher record
      const matchingComps = t.components.filter((c) => {
        if (normFilterAreas && !normFilterAreas.includes(normalizeKey(c.area))) {
          return false;
        }
        if (normFilterComps && !normFilterComps.includes(normalizeKey(c.componentName))) {
          return false;
        }
        return true;
      });

      if (matchingComps.length === 0) return;

      const hasConcluida = matchingComps.some((c) => c.concluidas >= 1 || c.concluido);

      if (!teacherMap.has(docKey)) {
        teacherMap.set(docKey, {
          teacherName: t.nome,
          isFormado: hasConcluida,
        });
      } else {
        if (hasConcluida) {
          teacherMap.get(docKey)!.isFormado = true;
        }
      }
    });

    const totalDocentes = teacherMap.size;
    let formados = 0;
    teacherMap.forEach((entry) => {
      if (entry.isFormado) formados += 1;
    });

    const naoFormados = Math.max(0, totalDocentes - formados);
    const pctFormados = totalDocentes > 0 ? Number(((formados / totalDocentes) * 100).toFixed(1)) : 0;
    const pctNaoFormados = totalDocentes > 0 ? Number(((naoFormados / totalDocentes) * 100).toFixed(1)) : 0;

    return {
      previstas: totalDocentes,
      formados,
      naoFormados,
      pctFormados,
      pctNaoFormados,
      totalDocentes,
      viewMode: 'docentes',
    };
  }

  if (viewMode === 'docentes_area') {
    // Mode 2: Docentes por Área de Conhecimento
    // O professor que leciona em 2 ou mais áreas diferentes conta como pessoa distinta em cada uma delas.
    // Ex.: Um professor que leciona em Tecnologia e Matemática conta 1 em Tecnologia e 1 em Matemática.
    const teacherAreaMap = new Map<string, { teacherName: string; area: string; isFormado: boolean }>();

    teachers.forEach((t) => {
      const docKey = normalizeKey(t.nome);

      const matchingComps = t.components.filter((c) => {
        if (normFilterAreas && !normFilterAreas.includes(normalizeKey(c.area))) {
          return false;
        }
        if (normFilterComps && !normFilterComps.includes(normalizeKey(c.componentName))) {
          return false;
        }
        return true;
      });

      if (matchingComps.length === 0) return;

      matchingComps.forEach((c) => {
        const normArea = normalizeKey(c.area || 'GERAL');
        const docAreaKey = `${docKey}____${normArea}`;
        const hasConcluida = c.concluidas >= 1 || c.concluido;

        if (!teacherAreaMap.has(docAreaKey)) {
          teacherAreaMap.set(docAreaKey, {
            teacherName: t.nome,
            area: c.area,
            isFormado: hasConcluida,
          });
        } else {
          if (hasConcluida) {
            teacherAreaMap.get(docAreaKey)!.isFormado = true;
          }
        }
      });
    });

    const totalDocentes = teacherAreaMap.size;
    let formados = 0;
    teacherAreaMap.forEach((entry) => {
      if (entry.isFormado) formados += 1;
    });

    const naoFormados = Math.max(0, totalDocentes - formados);
    const pctFormados = totalDocentes > 0 ? Number(((formados / totalDocentes) * 100).toFixed(1)) : 0;
    const pctNaoFormados = totalDocentes > 0 ? Number(((naoFormados / totalDocentes) * 100).toFixed(1)) : 0;

    return {
      previstas: totalDocentes,
      formados,
      naoFormados,
      pctFormados,
      pctNaoFormados,
      totalDocentes,
      viewMode: 'docentes_area',
    };
  }

  // Mode 3: viewMode === 'formacoes'
  // Soma das formações previstas (Coluna E = 2.610) e concluídas (Coluna F = 628)
  let previstas = 0;
  let formados = 0;

  teachers.forEach((t) => {
    t.components.forEach((c) => {
      // Check area filter
      if (normFilterAreas && !normFilterAreas.includes(normalizeKey(c.area))) {
        return;
      }

      // Check component filter
      if (normFilterComps && !normFilterComps.includes(normalizeKey(c.componentName))) {
        return;
      }

      previstas += c.previstas;
      formados += c.concluidas;
    });
  });

  // Mathematically bound to prevent any anomalies
  formados = Math.min(formados, previstas);
  const naoFormados = Math.max(0, previstas - formados);
  const pctFormados = previstas > 0 ? Number(((formados / previstas) * 100).toFixed(1)) : 0;
  const pctNaoFormados = previstas > 0 ? Number(((naoFormados / previstas) * 100).toFixed(1)) : 0;

  // Total distinct teacher entities for reference
  const uniqueDocKeys = new Set<string>();
  teachers.forEach((t) => {
    t.components.forEach((c) => {
      if (normFilterAreas && !normFilterAreas.includes(normalizeKey(c.area))) return;
      if (normFilterComps && !normFilterComps.includes(normalizeKey(c.componentName))) return;
      uniqueDocKeys.add(normalizeKey(t.nome));
    });
  });

  return {
    previstas,
    formados,
    naoFormados,
    pctFormados,
    pctNaoFormados,
    totalDocentes: uniqueDocKeys.size,
    viewMode: 'formacoes',
  };
}


