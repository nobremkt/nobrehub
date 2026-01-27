import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, DollarSign, Target, Check, Mail, Phone, Globe } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import { Lead } from '../services/supabaseApi';
import ProductSelect from './ui/ProductSelect';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStage?: string;
  onSave: (lead: any) => void;
  leadToEdit?: Lead | null;
}

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, initialStage, onSave, leadToEdit }) => {
  const isEditMode = !!leadToEdit;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    value: '',
    status: initialStage || 'novo',
    pipeline: 'high_ticket' as 'high_ticket' | 'low_ticket' | 'production' | 'post_sales',
    source: '',
    productId: '' // New field
  });

  // Reset form when modal opens/closes or leadToEdit changes
  useEffect(() => {
    if (isOpen && leadToEdit) {
      setFormData({
        name: leadToEdit.name || '',
        email: leadToEdit.email || '',
        phone: leadToEdit.phone || '',
        company: leadToEdit.company || '',
        value: leadToEdit.estimatedValue?.toString() || '',
        status: leadToEdit.statusHT || leadToEdit.statusLT || leadToEdit.statusProduction || leadToEdit.statusPostSales || 'novo',
        pipeline: (leadToEdit.pipeline as any) || 'high_ticket',
        source: leadToEdit.source || '',
        productId: (leadToEdit as any).productId || ''
      });
    } else if (isOpen && !leadToEdit) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        value: '',
        status: initialStage || 'novo',
        pipeline: 'high_ticket',
        source: '',
        productId: ''
      });
    }
  }, [isOpen, leadToEdit, initialStage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: leadToEdit?.id // Include id for edit mode
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {isEditMode ? 'Editar Registro' : 'Novo Registro'}
            </h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
              {isEditMode ? 'Atualize as informações do lead' : 'Insira as informações do lead'}
            </p>
          </div>
          <button onClick={onClose} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-600 transition-all">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                autoFocus
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Ana Oliveira"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:outline-none focus:border-rose-600/50 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: email@exemplo.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:outline-none focus:border-rose-600/50 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:outline-none focus:border-rose-600/50 transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Empresa / Negócio</label>
            <div className="relative">
              <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Ex: Tech Solutions LTDA"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:outline-none focus:border-rose-600/50 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor Estimado</label>
              <div className="relative">
                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0,00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:outline-none focus:border-rose-600/50 transition-all shadow-inner font-bold"
                />
              </div>
            </div>

            <ProductSelect
              value={formData.productId}
              className="mt-0"
              onChange={(product, price) => {
                setFormData(prev => ({
                  ...prev,
                  productId: product,
                  value: price ? price.toString() : prev.value
                }));
              }}
            />
          </div>

          <div className="space-y-2">
            <CustomDropdown
              label="Pipeline"
              options={[
                { value: 'high_ticket', label: 'High Ticket' },
                { value: 'low_ticket', label: 'Low Ticket' },
                { value: 'production', label: 'Produção' },
                { value: 'post_sales', label: 'Pós-Venda' },
              ]}
              value={formData.pipeline}
              onChange={(val) => setFormData({ ...formData, pipeline: val as any })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Origem</label>
            <div className="relative">
              <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Ex: Instagram, WhatsApp, Indicação..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:outline-none focus:border-rose-600/50 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-2 px-10 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} strokeWidth={3} /> {isEditMode ? 'Atualizar' : 'Salvar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadModal;
