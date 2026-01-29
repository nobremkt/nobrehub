import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, RefreshCw, Settings2, Users, Pencil, Trash2, Building2, Check, X, Shield } from 'lucide-react';
import { supabaseGetUsersWithSector, supabaseGetSectorsWithCount, supabaseDeactivateUser, supabaseUpdateUser } from '../services/supabaseApi';
import AddMemberModal from './AddMemberModal';
import SectorManagementModal from './SectorManagementModal';
import { ROLE_LABELS } from '../config/permissions';

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
}

interface TeamManagementProps {
  onMonitor?: (user: any) => void;
}

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'closer_ht', label: 'Closer High Ticket' },
  { value: 'closer_lt', label: 'Closer Low Ticket' },
  { value: 'sdr', label: 'SDR' },
  { value: 'production', label: 'Produção' },
  { value: 'post_sales', label: 'Pós-Venda' },
  { value: 'manager_sales', label: 'Gerente de Vendas' },
  { value: 'manager_production', label: 'Gerente de Produção' },
  { value: 'strategic', label: 'Estratégico' }
];

const TeamManagement: React.FC<TeamManagementProps> = () => {
  const [filter, setFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkSectorModal, setShowBulkSectorModal] = useState(false);
  const [showBulkRoleModal, setShowBulkRoleModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const usersData = await supabaseGetUsersWithSector();
      setMembers(usersData as unknown as TeamMember[]);
      const sectorsData = await supabaseGetSectorsWithCount();
      setSectors(sectorsData);
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Clear selection when filter or search changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filter, searchTerm]);

  const getRoleName = (role: string): string => {
    return ROLE_LABELS[role] || role || 'Membro';
  };

  const visibleTabs = ['Todos', ...sectors.map(s => s.name)];
  const hasUnassignedMembers = members.some(m => !m.sectorId && (m.isActive !== false));
  if (hasUnassignedMembers) {
    visibleTabs.push('Sem Setor');
  }

  const filteredMembers = members
    .filter(member => {
      if (member.isActive === false) return false;
      if (filter === 'Todos') return true;
      if (filter === 'Sem Setor') return !member.sectorId;
      const sector = sectors.find(s => s.name === filter);
      return member.sectorId === sector?.id || member.sector?.name === filter;
    })
    .filter(member =>
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMembers.map(m => m.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Individual actions
  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setShowAddModal(true);
  };

  const handleRemove = async (member: TeamMember) => {
    if (!confirm(`Tem certeza que deseja desativar ${member.name}?`)) return;
    try {
      await supabaseDeactivateUser(member.id);
      fetchData();
    } catch (error) {
      console.error('Failed to deactivate member:', error);
      alert('Erro ao desativar membro');
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingMember(null);
  };

  // Bulk actions
  const handleBulkChangeSector = async (sectorId: string | null) => {
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        supabaseUpdateUser(id, { sectorId })
      );
      await Promise.all(promises);
      clearSelection();
      setShowBulkSectorModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update sectors:', error);
      alert('Erro ao atualizar setores');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkChangeRole = async (role: string) => {
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        supabaseUpdateUser(id, { role })
      );
      await Promise.all(promises);
      clearSelection();
      setShowBulkRoleModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update roles:', error);
      alert('Erro ao atualizar cargos');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (!confirm(`Tem certeza que deseja desativar ${selectedIds.size} membro(s)?`)) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selectedIds).map(id => supabaseDeactivateUser(id));
      await Promise.all(promises);
      clearSelection();
      fetchData();
    } catch (error) {
      console.error('Failed to deactivate members:', error);
      alert('Erro ao desativar membros');
    } finally {
      setBulkLoading(false);
    }
  };

  const isAllSelected = filteredMembers.length > 0 && selectedIds.size === filteredMembers.length;
  const isSomeSelected = selectedIds.size > 0;

  return (
    <div className="h-dvh flex flex-col bg-[#f8fafc] animate-in fade-in duration-700">
      {/* Header */}
      <header className="px-10 pt-10 pb-8 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Equipe</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Gerenciamento de Membros</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSectorModal(true)}
              className="bg-violet-50 text-violet-600 px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-violet-100 transition-all border border-violet-200"
            >
              <Settings2 size={16} /> Setores
            </button>
            <button
              onClick={() => fetchData()}
              className="bg-slate-100 text-slate-600 p-4 rounded-2xl hover:bg-slate-200 transition-all"
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
          <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit max-w-[80vw]">
            {visibleTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === tab ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
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

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto p-10 no-scrollbar pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <RefreshCw size={48} className="mb-4 animate-spin opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Carregando equipe...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Users size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest mb-2">Nenhum membro encontrado</p>
            <p className="text-xs text-slate-300">Clique em "Adicionar Membro" para começar</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg">
            {/* Table Header */}
            <div className="grid grid-cols-[auto_auto_1fr_1fr_1fr_auto] gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 items-center">
              {/* Select All Checkbox */}
              <button
                onClick={toggleSelectAll}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isAllSelected ? 'bg-rose-600 border-rose-600 text-white' :
                    isSomeSelected ? 'bg-rose-100 border-rose-300' : 'border-slate-300 hover:border-slate-400'
                  }`}
              >
                {isAllSelected && <Check size={14} strokeWidth={3} />}
                {isSomeSelected && !isAllSelected && <div className="w-2 h-2 bg-rose-500 rounded-sm" />}
              </button>
              <div className="w-12"></div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">Ações</div>
            </div>

            {/* Table Body */}
            {filteredMembers.map((member, index) => {
              const isSelected = selectedIds.has(member.id);
              return (
                <div
                  key={member.id}
                  className={`grid grid-cols-[auto_auto_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center transition-colors ${isSelected ? 'bg-rose-50' : 'hover:bg-slate-50'
                    } ${index !== filteredMembers.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(member.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 hover:border-rose-400'
                      }`}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </button>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {member.name?.charAt(0).toUpperCase() || '?'}
                  </div>

                  {/* Name & Email */}
                  <div>
                    <p className="font-bold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.email}</p>
                  </div>

                  {/* Sector */}
                  <div>
                    {member.sector ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${member.sector.color}15`,
                          color: member.sector.color,
                          border: `1px solid ${member.sector.color}30`
                        }}
                      >
                        <Building2 size={12} />
                        {member.sector.name}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
                      {getRoleName(member.role)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="w-24 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(member)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleRemove(member)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {isSomeSelected && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300 z-50">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
            <span className="bg-rose-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
              {selectedIds.size}
            </span>
            <span className="text-sm font-medium">selecionado{selectedIds.size > 1 ? 's' : ''}</span>
          </div>

          <button
            onClick={() => setShowBulkSectorModal(true)}
            disabled={bulkLoading}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            <Building2 size={16} />
            Alterar Setor
          </button>

          <button
            onClick={() => setShowBulkRoleModal(true)}
            disabled={bulkLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            <Shield size={16} />
            Alterar Cargo
          </button>

          <button
            onClick={handleBulkDeactivate}
            disabled={bulkLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} />
            Desativar
          </button>

          <button
            onClick={clearSelection}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors ml-2"
            title="Limpar seleção"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Bulk Sector Modal */}
      {showBulkSectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBulkSectorModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-300">
            <h2 className="text-xl font-black text-slate-900 mb-2">Alterar Setor</h2>
            <p className="text-sm text-slate-500 mb-6">Selecione o novo setor para {selectedIds.size} membro(s)</p>
            <div className="space-y-2">
              <button
                onClick={() => handleBulkChangeSector(null)}
                disabled={bulkLoading}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all disabled:opacity-50"
              >
                <span className="text-slate-400">Sem Setor</span>
              </button>
              {sectors.map(sector => (
                <button
                  key={sector.id}
                  onClick={() => handleBulkChangeSector(sector.id)}
                  disabled={bulkLoading}
                  className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                  <span className="font-bold text-slate-900">{sector.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowBulkSectorModal(false)}
              className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Bulk Role Modal */}
      {showBulkRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBulkRoleModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-300 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-black text-slate-900 mb-2">Alterar Cargo</h2>
            <p className="text-sm text-slate-500 mb-6">Selecione o novo cargo para {selectedIds.size} membro(s)</p>
            <div className="space-y-2">
              {ROLES.map(role => (
                <button
                  key={role.value}
                  onClick={() => handleBulkChangeRole(role.value)}
                  disabled={bulkLoading}
                  className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all disabled:opacity-50"
                >
                  <span className="font-bold text-slate-900">{role.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowBulkRoleModal(false)}
              className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={handleModalClose}
        onSuccess={fetchData}
        sectors={sectors}
        editMember={editingMember}
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
