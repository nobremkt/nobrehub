
import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Info, Paperclip, Smile, Sparkles, Bot, User, UserPlus, LogOut, CheckCircle, Clock, Search, X, ChevronRight, MessageSquare, Mic, Image, FileText, Camera, StopCircle, Play, Users } from 'lucide-react';
import { Message, Contact, Agent } from '../types';
import { generateAIReply } from '../services/geminiService';

const EMOJI_LIST = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🤲", "👐", "🙌", "👏", "🤝", "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐", "🖖", "👋", "🤙", "💪", "🦾", "🖕", "✍️", "🙏", "💍", "💄", "💋", "👄"];

const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Ana Oliveira', phone: '+55 11 99999-0001', language: 'pt', scoreAi: 85, status: 'lead', lastMessage: 'Precisamos automatizar...', assignedAgentId: '1', chatStatus: 'open', pipeline: 'high-ticket' },
  { id: '2', name: 'Carlos Santos', phone: '+55 21 98888-0002', language: 'pt', scoreAi: 42, status: 'lead', lastMessage: 'Obrigado!', chatStatus: 'pending', pipeline: 'low-ticket' },
];

const Chat: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    '1': [
      { id: 'm1', text: 'Olá! Tenho interesse no serviço.', direction: 'in', timestamp: '10:30', type: 'text' },
      { id: 'm2', text: 'Olá Ana! Com certeza, qual seria sua necessidade?', direction: 'out', timestamp: '10:32', type: 'text', agentName: 'Rodrigo' },
    ],
  });
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'mine' | 'pending' | 'all'>('mine');
  const [selectedContactId, setSelectedContactId] = useState<string>('1');
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedContact = contacts.find(c => c.id === selectedContactId) || contacts[0];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, selectedContactId]);

  const addMessage = (content: string, type: 'text' | 'image' | 'audio' = 'text') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: Message = { id: Date.now().toString(), text: content, direction: 'out', timestamp, type, agentName: 'Você' };
    setMessages(prev => ({ ...prev, [selectedContactId]: [...(prev[selectedContactId] || []), newMessage] }));
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    addMessage(inputText, 'text');
    setInputText('');
  };

  return (
    <div className="flex h-screen bg-white border-l border-slate-200 overflow-hidden shadow-2xl">
      {/* Lista Lateral */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl mb-4">
            <button onClick={() => setActiveTab('mine')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'mine' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Meus</button>
            <button onClick={() => setActiveTab('pending')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'pending' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Fila</button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input type="text" placeholder="Pesquisar..." className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-600/50" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {contacts.map((c) => (
            <button key={c.id} onClick={() => setSelectedContactId(c.id)} className={`w-full flex items-center gap-4 p-5 hover:bg-white transition-all border-b border-slate-100 relative ${selectedContactId === c.id ? 'bg-white shadow-sm z-10' : ''}`}>
              {selectedContactId === c.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-600"></div>}
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-rose-600 font-black border border-slate-200 shrink-0">{c.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-xs truncate text-slate-900">{c.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">10:35</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate leading-relaxed">{c.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        <header className="px-10 py-6 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 font-black border border-rose-100">{selectedContact.name.charAt(0)}</div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">{selectedContact.name}</h3>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">{selectedContact.phone}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-sm"><Phone size={18} /></button>
            <button className="p-2.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-xl shadow-sm"><CheckCircle size={18} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar" ref={scrollRef}>
          {(messages[selectedContactId] || []).map((m) => (
            <div key={m.id} className={`flex flex-col ${m.direction === 'out' ? 'items-end' : 'items-start'} animate-in fade-in duration-300`}>
              <div className={`max-w-[70%] px-6 py-4 rounded-[2rem] relative shadow-sm ${m.direction === 'out' ? 'bg-rose-600 text-white rounded-tr-none' : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'}`}>
                <p className="text-sm leading-relaxed font-medium">{m.text}</p>
                <div className={`text-[8px] mt-2 font-black uppercase tracking-widest ${m.direction === 'out' ? 'text-white/50' : 'text-slate-400'}`}>{m.timestamp}</div>
              </div>
            </div>
          ))}
        </div>

        <footer className="p-8 bg-white border-t border-slate-200 shadow-xl relative">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button className="p-4 text-slate-300 hover:text-slate-900 bg-slate-50 rounded-2xl border border-slate-200"><Paperclip size={20} /></button>
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Mensagem profissional..." className="flex-1 bg-slate-50 border border-slate-200 rounded-[1.5rem] px-6 py-4 text-sm focus:outline-none focus:border-rose-600/50 shadow-inner" />
            <button onClick={handleSendMessage} className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-lg shadow-rose-600/30 active:scale-95"><Send size={20} /></button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chat;
