import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Target, Briefcase, Search, Plus, Monitor, Building2, Users, RefreshCw, Settings2 } from 'lucide-react';
import { getUsers } from '../services/api';
import AddMemberModal from './AddMemberModal';
import SectorManagementModal from './SectorManagementModal';

// Types
interface Sector {
  id: string;
  name: string;
  color: string;
  description?: string;
  _count?: {
    users: number;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  sector: Sector | null;
  sectorId: string | null;
  isActive: boolean;
  pipelineType: string | null;
  _count?: {
    assignedLeads: number;
  };
}

type TeamRole = 'Administracao' | 'Vendas' | 'Producao' | 'Pos-Venda' | 'Outros';

interface TeamManagementProps {
  onMonitor: (user: any) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ onMonitor }) => {
  const [filter, setFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);

  // Fetch team members and sectors
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      // Fetch users
      const usersResponse = await fetch(`${baseUrl}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('[TeamManagement] Users loaded:', usersData.length, usersData);
        setMembers(usersData);
      } else {
        console.error('[TeamManagement] Error loading users:', usersResponse.status, await usersResponse.text());
      }

      // Fetch sectors
      const sectorsResponse = await fetch(`${baseUrl}/users/sectors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (sectorsResponse.ok) {
        const sectorsData = await sectorsResponse.json();
        console.log('[TeamManagement] Setores carregados:', sectorsData.length, sectorsData);
        setSectors(sectorsData);
      } else {
        console.error('[TeamManagement] Erro ao buscar setores:', sectorsResponse.status, await sectorsResponse.text());
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map role to category
  const getRoleCategory = (role: string): TeamRole => {
    switch (role) {
      case 'admin':
      case 'strategic':
        return 'Administracao';
      case 'sdr':
      case 'closer_ht':
      case 'closer_lt':
      case 'manager_sales':
        return 'Vendas';
      case 'production':
      case 'manager_production':
        return 'Producao';
      case 'post_sales':
        return 'Pos-Venda';
      default:
        return 'Outros';
    }
  };

  // Categories definition
  const CATEGORIES: TeamRole[] = ['Administracao', 'Vendas', 'Producao', 'Pos-Venda', 'Outros'];
  const visibleCategories = filter === 'Todos' ? CATEGORIES : [filter as TeamRole];

  // Style helpers
  const getRoleStyle = (role: TeamRole) => {
    switch (role) {
      case 'Administracao': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Vendas': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Producao': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Pos-Venda': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getSectionHeaderColor = (role: TeamRole) => {
    switch (role) {
      case 'Administracao': return 'bg-purple-500';
      case 'Vendas': return 'bg-rose-500';
      case 'Producao': return 'bg-blue-500';
      case 'Pos-Venda': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getRoleName = (role: string): string => {
    const roleNames: Record<string, string> = {
      admin: 'Admin',
      sdr: 'SDR',
      closer_ht: 'Closer HT',
      closer_lt: 'Closer LT',
      production: 'Produção',
      post_sales: 'Pós-Venda',
      manager_sales: 'Ger. Vendas',
      manager_production: 'Ger. Produção',
      strategic: 'Estratégico'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="h-dvh flex flex-col bg-[#f8fafc] animate-in fade-in duration-700">
      <header className="px-10 pt-10 pb-8 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Team Launchpad</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Centro de Comando da Equipe</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSectorModal(true)}
              className="bg-violet-50 text-violet-600 px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-violet-100 transition-all border border-violet-200"
              title="Gerenciar Setores"
            >
              <Settings2 size={16} /> Setores
            </button>
            <button
              onClick={() => fetchData()}
              className="bg-slate-100 text-slate-600 p-4 rounded-2xl hover:bg-slate-200 transition-all"
              title="Atualizar"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-rose-600 text-white px-8 py-4 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/20 active:scale-95 transition-all hover:bg-rose-700"
            >
              <Plus size={16} /> Adicionar Membro
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
            {['Todos', 'Administracao', 'Vendas', 'Producao', 'Pos-Venda'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:border-rose-600/50 transition-all shadow-inner"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <RefreshCw size={48} className="mb-4 animate-spin opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Carregando equipe...</p>
          </div>
        ) : (
          <>
            {visibleCategories.map((category) => {
              // Filter members by category and search
              const categoryMembers = members
                .filter(member => (member.isActive !== false) && getRoleCategory(member.role) === category)
                .filter(member =>
                  member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  member.email?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

              if (categoryMembers.length === 0) return null;

              return (
                <div key={category} className="animate-in slide-in-from-bottom-4 duration-500">
                  {/* Section Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-1.5 h-8 rounded-full ${getSectionHeaderColor(category)}`}></div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{category}</h2>
                    <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-2 py-1 rounded-lg border border-slate-200">
                      {categoryMembers.length.toString().padStart(2, '0')}
                    </span>
                    <div className="h-px bg-slate-100 flex-1"></div>
                  </div>

                  {/* Member Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {categoryMembers.map((member) => (
                      <div
                        key={member.id}
                        className="group bg-white border border-slate-100 rounded-[3rem] p-8 shadow-lg shadow-slate-200/50 hover:shadow-2xl hover:border-rose-600/20 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
                      >
                        {/* Avatar and Status */}
                        <div className="flex flex-col items-center mb-6">
                          <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-rose-600 text-3xl group-hover:scale-105 transition-transform duration-500">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          </div>

                          <h3 className="text-xl font-black text-slate-900 tracking-tighter text-center uppercase">
                            {member.name}
                          </h3>

                          {/* Role Badge */}
                          <div className={`mt-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getRoleStyle(getRoleCategory(member.role))}`}>
                            {getRoleName(member.role)}
                          </div>

                          {/* Sector Badge */}
                          {member.sector && (
                            <div
                              className="mt-2 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center gap-1"
                              style={{
                                backgroundColor: `${member.sector.color}15`,
                                color: member.sector.color,
                                border: `1px solid ${member.sector.color}30`
                              }}
                            >
                              <Building2 size={10} />
                              {member.sector.name}
                            </div>
                          )}
                        </div>

                        {/* KPI */}
                        <div className="bg-slate-50 rounded-3xl p-6 mb-8 flex flex-col items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Leads Ativos</span>
                          <div className="text-3xl font-black text-slate-900 tracking-tighter">
                            {member._count?.assignedLeads || 0}
                          </div>
                        </div>

                        {/* Action */}
                        <button
                          onClick={() => onMonitor(member)}
                          className="w-full bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 group-hover:shadow-xl group-hover:shadow-rose-600/20"
                        >
                          <Monitor size={16} /> Monitorar Workspace
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {members.filter(m => m.isActive && m.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Users size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest mb-2">Nenhum membro encontrado</p>
                <p className="text-xs text-slate-300">Clique em "Adicionar Membro" para começar</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchData}
        sectors={sectors}
      />

      {/* Sector Management Modal */}
      <SectorManagementModal
        isOpen={showSectorModal}
        onClose={() => setShowSectorModal(false)}
        onUpdate={fetchData}
      />
    </div>
  );
};

export default TeamManagement;
