
import React, { useState, useEffect } from 'react';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, Zap, ChevronDown, Users, User } from 'lucide-react';
import * as api from '../services/api';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

interface DevUser {
  id: string;
  name: string;
  email: string;
  role: string;
  pipelineType: string | null;
  isOnline: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev Panel State
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [devUsers, setDevUsers] = useState<DevUser[]>([]);
  const [loadingDevUsers, setLoadingDevUsers] = useState(false);
  const [loggingInAs, setLoggingInAs] = useState<string | null>(null);

  // Fetch dev users when panel is opened
  useEffect(() => {
    if (showDevPanel && devUsers.length === 0) {
      fetchDevUsers();
    }
  }, [showDevPanel]);

  const fetchDevUsers = async () => {
    setLoadingDevUsers(true);
    try {
      const response = await fetch(`${API_URL}/users/dev-list`);
      if (response.ok) {
        const users = await response.json();
        setDevUsers(users);
      }
    } catch (err) {
      console.error('Failed to fetch dev users:', err);
    } finally {
      setLoadingDevUsers(false);
    }
  };

  const handleDevLogin = async (user: DevUser) => {
    setLoggingInAs(user.id);
    setError(null);
    try {
      // Use dev login endpoint that bypasses password
      const response = await fetch(`${API_URL}/auth/dev-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.token, data.user);
      } else {
        setError('Dev login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Dev login failed');
    } finally {
      setLoggingInAs(null);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.login(email, password);
      onLogin(response.token, response.user);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setIsAdminLoading(true);
    setError(null);

    try {
      const response = await api.login('admin@nobremarketing.com.br', 'admin123');
      onLogin(response.token, response.user);
    } catch (err: any) {
      console.error('Admin login failed:', err);
      setError(err.message || 'Falha no login de admin.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'closer_ht': return 'bg-rose-100 text-rose-700';
      case 'closer_lt': return 'bg-blue-100 text-blue-700';
      case 'sdr': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'closer_ht': return 'Closer HT';
      case 'closer_lt': return 'Closer LT';
      case 'sdr': return 'SDR';
      case 'manager_sales': return 'Gerente';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">
      {/* Decorative Light Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-rose-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-rose-600/30 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Nobre CRM</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Marketing Intelligence</p>
        </div>

        <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Identificação</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:outline-none focus:border-rose-600/50 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Senha Segura</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:outline-none focus:border-rose-600/50 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="pt-2 space-y-4">
              <button
                type="submit"
                disabled={isLoading || isAdminLoading}
                className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-600/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Acessar Dashboard <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleQuickAdminLogin}
                disabled={isLoading || isAdminLoading}
                className="w-full py-4 bg-slate-50 border border-slate-200 border-dashed hover:border-rose-600/50 hover:bg-white text-slate-400 hover:text-rose-600 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                {isAdminLoading ? <Loader2 className="animate-spin" size={16} /> : (
                  <>
                    <Zap size={16} fill="currentColor" /> Entrar como Admin
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Dev Panel Toggle */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => setShowDevPanel(!showDevPanel)}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-colors"
            >
              <Users size={14} />
              Dev Panel - Trocar Usuário
              <ChevronDown size={14} className={`transition-transform ${showDevPanel ? 'rotate-180' : ''}`} />
            </button>

            {showDevPanel && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {loadingDevUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin text-amber-500" size={20} />
                  </div>
                ) : devUsers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Nenhum usuário encontrado</p>
                ) : (
                  devUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleDevLogin(user)}
                      disabled={loggingInAs === user.id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 transition-all text-left group disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 truncate">{user.name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{user.pipelineType || 'Sem pipeline'}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                      </div>
                      {loggingInAs === user.id ? (
                        <Loader2 className="animate-spin text-amber-500" size={16} />
                      ) : (
                        <ArrowRight size={14} className="text-amber-400 group-hover:text-amber-600 transition-colors" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-600 transition-colors">Solicitar acesso ao TI</button>
          </div>
        </div>

        <p className="text-center mt-10 text-[9px] text-slate-300 font-black uppercase tracking-[0.4em]">© 2024 Nobre Marketing Group</p>
      </div>
    </div>
  );
};

export default Login;
