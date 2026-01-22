import React, { useRef, useState } from 'react';
import { Paperclip, FileText, Tag, Clock, Mic, Send, X, StopCircle } from 'lucide-react';
import { TagsEditor } from '../TagsEditor';
import { toast } from 'sonner';

interface MessageToolbarProps {
    newMessage: string;
    setNewMessage: (text: string) => void;
    handleSend: () => void;
    isSending: boolean;
    isRecording: boolean;
    recordingDuration: number;
    startRecording: () => void;
    stopRecording: () => void;
    sendAudio: () => void;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    setShowTemplateSelector: (show: boolean) => void;
    setShowScheduleModal: (show: boolean) => void;
    showTagsPopover: boolean;
    setShowTagsPopover: (show: boolean) => void;
    availableTags: string[];
    handleUpdateTags: (tags: string[]) => void;
    currentTags: string[];
}

export const MessageToolbar: React.FC<MessageToolbarProps> = ({
    newMessage,
    setNewMessage,
    handleSend,
    isSending,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    sendAudio,
    handleFileUpload,
    setShowTemplateSelector,
    setShowScheduleModal,
    showTagsPopover,
    setShowTagsPopover,
    availableTags,
    handleUpdateTags,
    currentTags
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const tagsButtonRef = useRef<HTMLButtonElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    };

    return (
        <div className="bg-white border-t border-slate-100 p-4">
            <div className="flex items-end gap-3 max-w-5xl mx-auto">
                {/* Attachments & Quick Actions - Hidden when recording */}
                {!isRecording && (
                    <div className="flex items-center gap-1 pb-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*,audio/*,video/*,application/pdf"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            title="Anexar arquivo"
                            disabled={isSending}
                        >
                            <Paperclip size={20} />
                        </button>

                        <button
                            onClick={() => setShowTemplateSelector(true)}
                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="Templates"
                            disabled={isSending}
                        >
                            <FileText size={20} />
                        </button>

                        <div className="relative">
                            <button
                                ref={tagsButtonRef}
                                onClick={() => setShowTagsPopover(!showTagsPopover)}
                                className={`p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors ${showTagsPopover ? 'bg-indigo-50 text-indigo-600' : ''}`}
                                title="Tags"
                                disabled={isSending}
                            >
                                <Tag size={20} />
                            </button>
                            {showTagsPopover && (
                                <div
                                    id="tags-popover"
                                    className="absolute bottom-full left-0 mb-4 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 animate-in slide-in-from-bottom-2 duration-200"
                                >
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Tags do Lead</h4>
                                    <TagsEditor
                                        tags={currentTags}
                                        onChange={handleUpdateTags}
                                        availableTags={availableTags}
                                        size="sm"
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowScheduleModal(true)}
                            className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                            title="Agendar"
                            disabled={isSending}
                        >
                            <Clock size={20} />
                        </button>
                    </div>
                )}

                {/* Input Area or Recording State */}
                <div className="flex-1 bg-slate-100 rounded-2xl flex items-center transition-all duration-300 relative overflow-hidden min-h-[50px]">
                    {isRecording ? (
                        <div className="absolute inset-0 flex items-center justify-between px-4 bg-red-50 animate-in fade-in duration-200">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                <span className="font-mono text-red-600 font-medium">
                                    {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
                                    {(recordingDuration % 60).toString().padStart(2, '0')}
                                </span>
                                <span className="text-xs text-red-400 font-medium uppercase tracking-wide">Gravando áudio...</span>
                            </div>
                            <button
                                onClick={stopRecording}
                                className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider px-3 py-1 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite sua mensagem..."
                            rows={1}
                            className="w-full bg-transparent border-0 focus:ring-0 px-4 py-3 text-slate-900 placeholder:text-slate-400 resize-none max-h-32 text-sm leading-relaxed"
                            style={{ height: '50px' }} // Initial height
                        />
                    )}
                </div>

                {/* Send / Mic Actions */}
                <div className="pb-1">
                    {isRecording ? (
                        <button
                            onClick={sendAudio}
                            className="p-3.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center"
                        >
                            <Send size={20} className="ml-0.5" />
                        </button>
                    ) : newMessage.trim() ? (
                        <button
                            onClick={handleSend}
                            disabled={isSending}
                            className="p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={20} className="ml-0.5" />
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={startRecording}
                            className="p-3.5 text-slate-500 bg-slate-100 hover:bg-red-100 hover:text-red-500 rounded-xl transition-all active:scale-95"
                        >
                            <Mic size={22} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
