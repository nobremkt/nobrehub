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
    if (!role) return 'Outros';
    switch (role.toLowerCase()) {
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

  // ... (skipping lines)

  {/* Empty State */ }
  {
    members.filter(m => (m.isActive !== false) && m.name?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Users size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest mb-2">Nenhum membro encontrado</p>
        <p className="text-xs text-slate-300">Clique em "Adicionar Membro" para começar</p>
      </div>
    )
  }
          </>
        )}
      </div >

  {/* Add Member Modal */ }
  < AddMemberModal
isOpen = { showAddModal }
onClose = {() => setShowAddModal(false)}
onSuccess = { fetchData }
sectors = { sectors }
  />

  {/* Sector Management Modal */ }
  < SectorManagementModal
isOpen = { showSectorModal }
onClose = {() => setShowSectorModal(false)}
onUpdate = { fetchData }
  />
    </div >
  );
};

export default TeamManagement;
