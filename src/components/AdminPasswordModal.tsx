import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (password: string) => void;
  isDarkMode?: boolean;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isDarkMode = false,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor, informe a senha de acesso.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const resp = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await resp.json().catch(() => ({}));

      if (resp.ok && data.authorized) {
        sessionStorage.setItem('ure_admin_auth', 'true');
        sessionStorage.setItem('ure_admin_pwd', password.trim());
        setPassword('');
        setError(null);
        onSuccess(password.trim());
      } else {
        setError(data.error || 'Senha incorreta. Apenas o administrador autorizado pode conectar a planilha.');
      }
    } catch {
      // Fallback client-side check if offline
      if (password.trim() === '343950') {
        sessionStorage.setItem('ure_admin_auth', 'true');
        sessionStorage.setItem('ure_admin_pwd', password.trim());
        setPassword('');
        setError(null);
        onSuccess(password.trim());
      } else {
        setError('Senha incorreta. Apenas o administrador autorizado pode conectar a planilha.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDarkMode
            ? 'bg-[#11192e] border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-[#0d1424]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30' : 'bg-[#162f65] text-white shadow-xs'
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 id="admin-modal-title" className="font-bold text-base">
                Acesso do Administrador
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Gerenciamento e Conexão de Planilha
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              isDarkMode
                ? 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
            <div>
              A conexão e atualização da base de dados são restritas ao responsável da URE Sul 3.
              Para os demais usuários, todos os dados já são exibidos preenchidos e atualizados.
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password-input"
              className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Senha de Acesso
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                placeholder="Digite a senha de 6 dígitos"
                className={`w-full py-2.5 pl-3.5 pr-10 rounded-xl text-sm font-medium border outline-none transition ${
                  isDarkMode
                    ? 'bg-[#17223b] border-slate-700 text-white placeholder-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-900/50'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#162f65] focus:ring-2 focus:ring-blue-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                isDarkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-md disabled:opacity-50 active:scale-95 ${
                isDarkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-[#162f65] hover:bg-[#12285a]'
              }`}
            >
              {isVerifying ? 'Verificando...' : 'Liberar Acesso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
