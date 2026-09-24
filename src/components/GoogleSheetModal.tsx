import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  Link,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Clock,
  Upload,
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineUrl: string;
  onSaveUrl: (url: string) => Promise<void>;
  onRefreshNow: () => Promise<void>;
  onResetToDefault: () => void;
  onFileUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  isDarkMode?: boolean;
}

const APPS_SCRIPT_CODE = `/**
 * Código para colocar no Google Apps Script da sua planilha:
 * 1. Na planilha, clique em Extensões > Apps Script
 * 2. Substitua o conteúdo do arquivo Código.gs por este código abaixo
 * 3. Clique em "Implantar" (botão azul no topo) > "Gerenciar implantações" ou "Nova implantação"
 * 4. Tipo: Selecione "App da Web"
 * 5. Executar como: "Eu"
 * 6. Quem pode acessar: SELECIONE "Qualquer pessoa" (MUITO IMPORTANTE para permitir que o app acesse sem tela de login)
 * 7. Copie o URL gerado (termina em /exec) e cole no painel!
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    var result = {
      title: ss.getName(),
      updatedAt: new Date().toISOString(),
      sheets: {}
    };
    
    for (var s = 0; s < sheets.length; s++) {
      var sheet = sheets[s];
      var sheetName = sheet.getName();
      var data = sheet.getDataRange().getValues();
      
      if (data.length > 1) {
        var headers = data[0].map(function(h) { 
          return String(h).trim(); 
        });
        
        var rows = [];
        for (var i = 1; i < data.length; i++) {
          var rowObj = {};
          var hasMeaningfulData = false;
          
          for (var j = 0; j < headers.length; j++) {
            var header = headers[j];
            var val = data[i][j];
            
            if (val instanceof Date) {
              val = Utilities.formatDate(val, Session.getScriptTimeZone(), "dd/MM/yyyy");
            }
            
            rowObj[header] = val;
            if (val !== "" && val !== null && val !== undefined) {
              hasMeaningfulData = true;
            }
          }
          
          if (hasMeaningfulData) {
            rows.push(rowObj);
          }
        }
        result.sheets[sheetName] = rows;
      } else {
        result.sheets[sheetName] = [];
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  onlineUrl,
  onSaveUrl,
  onRefreshNow,
  onResetToDefault,
  onFileUpload,
  isLoading,
  error,
  lastUpdated,
  autoSyncEnabled,
  onToggleAutoSync,
  isDarkMode = false,
}) => {
  const [inputUrl, setInputUrl] = useState(onlineUrl);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setUploadStatus(null);
    await onSaveUrl(inputUrl.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    try {
      setUploadStatus(`Processando ${file.name}...`);
      await onFileUpload(file);
      setUploadStatus(`Arquivo "${file.name}" carregado com sucesso!`);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setUploadStatus(null);
      }, 3000);
    } catch (err: any) {
      setUploadStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`rounded-2xl shadow-xl border w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden transition-colors ${
          isDarkMode ? 'bg-[#11192e] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between transition-colors ${
            isDarkMode ? 'bg-[#091021] text-white border-b border-slate-800' : 'bg-[#132347] text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <Database className="w-4 h-4 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Painel ADM - Atualização de Dados</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  URE Sul 3
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80">Acesso Restrito do Administrador (Senha: 343950)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Admin explanation banner */}
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              isDarkMode
                ? 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <strong>Regra de Atualização:</strong> O aplicativo não conecta em tempo real continuamente.
              Sempre que você atualizar aqui (por link ou enviando a planilha), os dados são gravados no próprio
              aplicativo e comitados no Git, ficando permanentemente salvos e disponíveis para todos os usuários.
            </div>
          </div>

          {/* Status banner */}
          <div
            className={`border rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 transition-colors ${
              isDarkMode ? 'bg-[#17223b] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Última sincronização registrada na base:
              </p>
              <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#0a1b3f]'}`}>
                {lastUpdated}
              </p>
            </div>

            <button
              type="button"
              onClick={onRefreshNow}
              disabled={isLoading}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer disabled:opacity-50 border ${
                isDarkMode
                  ? 'bg-blue-900/60 text-blue-200 border-blue-600 hover:bg-blue-800'
                  : 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Sincronizando...' : 'Atualizar Dados Agora'}</span>
            </button>
          </div>

          {/* Error notice if any */}
          {error && (
            <div
              className={`p-3.5 border rounded-xl text-xs flex items-start gap-2 ${
                isDarkMode
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Aviso de conexão:</p>
                <p>{error}</p>
                <p className={`mt-1 text-[11px] ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                  Dica: Você também pode salvar a planilha no seu computador e usar a aba <strong>"Enviar Arquivo (.xlsx)"</strong> abaixo!
                </p>
              </div>
            </div>
          )}

          {/* Success notice */}
          {saveSuccess && (
            <div
              className={`p-3.5 border rounded-xl text-xs flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{uploadStatus || 'Conexão salva e sincronizada com sucesso!'}</span>
            </div>
          )}

          {/* Mode Tabs: URL vs Upload Arquivo */}
          <div className={`flex border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
                activeTab === 'url'
                  ? isDarkMode
                    ? 'border-blue-400 text-blue-400'
                    : 'border-[#16337a] text-[#16337a]'
                  : isDarkMode
                  ? 'border-transparent text-slate-400 hover:text-slate-200'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Link className="w-4 h-4" />
              <span>Link Online (Google Sheets / Apps Script)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
                activeTab === 'file'
                  ? isDarkMode
                    ? 'border-blue-400 text-blue-400'
                    : 'border-[#16337a] text-[#16337a]'
                  : isDarkMode
                  ? 'border-transparent text-slate-400 hover:text-slate-200'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Enviar Arquivo (.xlsx / .csv)</span>
            </button>
          </div>

          {activeTab === 'url' ? (
            /* Tab 1: URL Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="input-web-app-url"
                  className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-blue-300' : 'text-[#12285a]'
                  }`}
                >
                  Link da Planilha ou Google Apps Script
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Link className="w-4 h-4" />
                  </div>
                  <input
                    id="input-web-app-url"
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/... ou https://script.google.com/macros/s/.../exec"
                    className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono transition outline-none border ${
                      isDarkMode
                        ? 'bg-[#17223b] border-slate-700 text-slate-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-900/50'
                        : 'bg-white border-slate-300 focus:border-[#162f65] focus:ring-2 focus:ring-blue-100 text-slate-800'
                    }`}
                  />
                </div>
                <div
                  className={`mt-2 space-y-1 text-[11px] p-3 rounded-xl border ${
                    isDarkMode
                      ? 'bg-[#17223b] border-slate-700 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <p className={`font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Formatos aceitos:
                  </p>
                  <p>• <strong>Link do Google Sheets:</strong> Cole o link da barra de endereço. Lembre-se de colocar a planilha como <em>"Qualquer pessoa com o link pode ler"</em>.</p>
                  <p>• <strong>Link do Google Apps Script:</strong> URL de Web App terminada em <code className={`font-bold ${isDarkMode ? 'text-blue-300' : 'text-slate-800'}`}>/exec</code> (com acesso liberado para "Qualquer pessoa").</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#16337a] hover:bg-[#0f2457] text-white font-bold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isLoading ? 'Conectando e Gravando...' : 'Salvar e Atualizar Base (Git Commit)'}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onResetToDefault}
                    className={`text-xs underline transition cursor-pointer ${
                      isDarkMode ? 'text-rose-400 hover:text-rose-300' : 'text-rose-700 hover:text-rose-900'
                    }`}
                    title="Apaga os dados e o link da planilha, restaurando para o padrão"
                  >
                    Resetar base de dados
                  </button>
                </div>
              </div>

              {/* Persistence Notice replacing auto-sync */}
              <div className={`pt-3 border-t text-xs ${isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold">Persistência Estável no Próprio App</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Os dados são salvos internamente e confirmados no Git. Não há requisições em tempo real periódicas consumindo recursos dos usuários.
                </p>
              </div>
            </form>
          ) : (
            /* Tab 2: File Upload (Drag and Drop / File Input) */
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? isDarkMode
                      ? 'border-blue-400 bg-blue-950/40'
                      : 'border-[#16337a] bg-blue-50/50'
                    : isDarkMode
                    ? 'border-slate-700 hover:border-blue-400 bg-[#17223b] hover:bg-blue-950/30'
                    : 'border-slate-300 hover:border-[#16337a] bg-slate-50/50 hover:bg-blue-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-blue-950 text-blue-400' : 'bg-blue-100 text-[#16337a]'
                  }`}
                >
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    Arraste o arquivo .xlsx da planilha aqui ou clique para selecionar
                  </p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Suporta a planilha com as colunas: Escola, Docente, Área, Componente, Formações Previstas e Formações Concluídas (1 = Concluído, em branco = Pendente)
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 bg-[#16337a] hover:bg-[#0f2457] text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow-xs"
                >
                  Selecionar Arquivo do Computador
                </button>
              </div>

              <div
                className={`p-3 border rounded-xl text-xs ${
                  isDarkMode
                    ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <strong>Estrutura da planilha:</strong> Apenas 1 aba contendo <strong>Escola</strong>, <strong>Docente</strong>, <strong>Área</strong>, <strong>Componente</strong>, <strong>Formações Previstas</strong> e <strong>Formações Concluídas</strong>. Se tiver 1 está concluída; se estiver em branco, ainda não.
              </div>
            </div>
          )}

          {/* Instructions and Apps Script Code Accordion */}
          <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className={`text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-[#16337a] hover:text-[#0f2457]'
              }`}
            >
              <span>{showCode ? 'Ocultar instruções do Google Apps Script' : 'Ver instruções e código do Google Apps Script'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {showCode && (
              <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Código.gs
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>
                <pre className="bg-[#091021] text-slate-200 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
                  {APPS_SCRIPT_CODE}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`border-t px-6 py-3 flex justify-end transition-colors ${
            isDarkMode ? 'bg-[#091021] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`border font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer ${
              isDarkMode
                ? 'bg-[#17223b] border-slate-700 text-slate-200 hover:bg-[#203055]'
                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

