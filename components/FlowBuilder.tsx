
import React from 'react';
import { Plus, Play, MousePointer2, ArrowRight, Save, Zap, MessageSquare, Bot, Phone } from 'lucide-react';

const FlowBuilder: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden">
      <header className="px-10 py-8 border-b border-slate-200 bg-white z-20 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Automações Inteligentes</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Canvas visual de fluxos automáticos</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-6 py-3.5 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
            <Save size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Salvar Rascunho</span>
          </button>
          <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3.5 rounded-2xl transition-all shadow-xl shadow-rose-600/30 active:scale-95 whitespace-nowrap">
            <Play size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Publicar Fluxo</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Paleta de Nós */}
        <div className="w-80 border-r border-slate-200 bg-white p-10 overflow-y-auto no-scrollbar">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 px-2">Componentes</h3>
          <div className="space-y-4">
            {[
              { icon: Zap, label: 'Gatilho (Trigger)', color: 'bg-amber-50 text-amber-600 border-amber-100', desc: 'Início da automação' },
              { icon: MessageSquare, label: 'Enviar WhatsApp', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', desc: 'Mensagem direta' },
              { icon: Bot, label: 'Resposta da IA', color: 'bg-rose-50 text-rose-600 border-rose-100', desc: 'Processamento Gemini' },
              { icon: Phone, label: 'Notificar CRM', color: 'bg-blue-50 text-blue-600 border-blue-100', desc: 'Alerta para a equipe' },
            ].map((node, i) => (
              <div key={i} className={`flex flex-col gap-1 p-5 rounded-[24px] border ${node.color} cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all group shadow-sm`}>
                <div className="flex items-center gap-3">
                  <node.icon size={20} />
                  <span className="text-sm font-black uppercase tracking-widest">{node.label}</span>
                </div>
                <span className="text-[10px] opacity-60 ml-8 font-medium italic leading-none">{node.desc}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
             <div className="flex items-center gap-2 text-rose-600 mb-2">
                <Bot size={14} />
                <span className="text-[10px] font-black uppercase">Dica Nobre</span>
             </div>
             <p className="text-[10px] text-slate-400 leading-relaxed italic">Arraste a "Resposta da IA" para qualificar leads automaticamente em qualquer etapa do fluxo.</p>
          </div>
        </div>

        {/* Área do Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_2px_2px,rgba(0,0,0,0.03)_1px,transparent_0)] bg-[length:40px_40px]">
          {/* Exemplo de Nós no Canvas */}
          <div className="absolute top-32 left-32 animate-in zoom-in duration-500">
            <div className="w-64 bg-white border-2 border-amber-400 rounded-3xl p-6 shadow-2xl shadow-slate-200 relative">
              <div className="flex items-center gap-3 mb-4 text-amber-600">
                <Zap size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Gatilho Ativo</span>
              </div>
              <p className="text-sm text-slate-900 font-bold mb-3">Mensagem Recebida</p>
              <div className="text-[10px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">Filtro: Interesse em Automação</div>
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-900/40">
                <ArrowRight size={14} className="text-white" />
              </div>
            </div>
          </div>

          <div className="absolute top-32 left-[500px] animate-in zoom-in [animation-delay:0.2s] duration-500">
            <div className="w-64 bg-white border-2 border-rose-500 rounded-3xl p-6 shadow-2xl shadow-slate-200 relative">
              <div className="flex items-center gap-3 mb-4 text-rose-600">
                <Bot size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">IA Analisando</span>
              </div>
              <p className="text-sm text-slate-900 font-bold mb-3">Qualificação Inteligente</p>
              <div className="text-[10px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">Prompt: "Identificar orçamento e urgência..."</div>
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-500 border-4 border-white"></div>
            </div>
          </div>

          {/* Mouse simulation / empty state */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-200 flex flex-col items-center select-none opacity-20">
            <MousePointer2 size={80} className="mb-4" />
            <p className="text-xl font-black uppercase tracking-[0.4em]">Designer de Fluxos</p>
          </div>

          {/* Controles de Zoom/Ação */}
          <div className="absolute bottom-10 right-10 flex gap-4">
            <button className="p-5 bg-white border border-slate-200 rounded-[24px] text-slate-400 hover:text-slate-900 transition-all shadow-xl shadow-slate-200"><Plus size={24} /></button>
            <button className="p-5 bg-rose-600 text-white rounded-[24px] shadow-2xl shadow-rose-600/30 hover:bg-rose-700 transition-all active:scale-95"><Play size={24} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowBuilder;
