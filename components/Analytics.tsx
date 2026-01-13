
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, MessageSquare, DollarSign, Sparkles, Filter, Calendar } from 'lucide-react';
import { getAnalyticsSummary } from '../services/geminiService';

const DATA = [
  { name: 'Jan', leads: 400, deals: 24, revenue: 2400 },
  { name: 'Fev', leads: 300, deals: 13, revenue: 2210 },
  { name: 'Mar', leads: 200, deals: 98, revenue: 2290 },
  { name: 'Abr', leads: 278, deals: 39, revenue: 2000 },
  { name: 'Mai', leads: 189, deals: 48, revenue: 2181 },
  { name: 'Jun', leads: 239, deals: 38, revenue: 2500 },
];

const Analytics: React.FC = () => {
  const [summary, setSummary] = useState("Analisando tendências globais com Nobre IA...");

  useEffect(() => {
    getAnalyticsSummary(DATA).then(setSummary);
  }, []);

  const stats = [
    { label: 'Total Leads', value: '1,284', change: '+12.5%', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Mensagens', value: '45.2k', change: '+5.2%', icon: MessageSquare, color: 'text-rose-600', bgColor: 'bg-rose-50' },
    { label: 'Conversão', value: '18.4%', change: '+2.1%', icon: TrendingUp, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { label: 'Receita Est.', value: 'R$ 84k', change: '+14.8%', icon: DollarSign, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden animate-in fade-in duration-700">
      <header className="px-10 py-8 border-b border-slate-200 bg-white z-20 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Performance & Insights</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Inteligência analítica da sua operação</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl text-slate-500 hover:text-slate-900 transition-all">
            <Calendar size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Junho 2024</span>
          </button>
          <button className="p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-rose-600 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
        {/* AI Insight Bar */}
        <div className="bg-white border border-rose-100 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity text-rose-600">
              <Sparkles size={200} />
           </div>
           <div className="bg-rose-600 w-20 h-20 rounded-[30px] flex items-center justify-center text-white shadow-xl shadow-rose-600/30 shrink-0">
             <Sparkles size={40} />
           </div>
           <div className="flex-1">
             <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.4em] mb-3">Relatório Executivo da Nobre IA</h3>
             <p className="text-xl font-bold text-slate-900 leading-relaxed max-w-4xl italic">"{summary}"</p>
           </div>
           <button className="px-8 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all whitespace-nowrap shadow-xl shadow-rose-600/20">Exportar PDF</button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white border border-slate-100 p-10 rounded-[40px] relative overflow-hidden group hover:border-rose-600/20 shadow-lg shadow-slate-200/50 transition-all">
              <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-[24px] ${stat.bgColor} ${stat.color} shadow-inner`}>
                  <stat.icon size={28} />
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                     {stat.change}
                   </span>
                </div>
              </div>
              <div className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">{stat.value}</div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          <div className="bg-white border border-slate-100 p-12 rounded-[48px] h-[500px] flex flex-col shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-center mb-10">
               <div>
                 <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Fluxo de Aquisição</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Leads gerados por período</p>
               </div>
               <div className="flex gap-2 items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-600"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Geração Mensal</span>
               </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DATA}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)'}}
                    itemStyle={{color: '#0f172a', fontSize: '12px', fontWeight: 900}}
                    labelStyle={{color: '#94a3b8', marginBottom: '10px', fontSize: '10px', textTransform: 'uppercase'}}
                  />
                  <Area type="monotone" dataKey="leads" stroke="#e11d48" strokeWidth={4} fillOpacity={1} fill="url(#colorLeads)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-12 rounded-[48px] h-[500px] flex flex-col shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-center mb-10">
               <div>
                 <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Faturamento & Conversão</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Rentabilidade vs Volume de Negócios</p>
               </div>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '20px'}}
                  />
                  <Bar dataKey="deals" fill="#e2e8f0" radius={[10, 10, 0, 0]} barSize={30} />
                  <Bar dataKey="revenue" fill="#e11d48" radius={[10, 10, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
