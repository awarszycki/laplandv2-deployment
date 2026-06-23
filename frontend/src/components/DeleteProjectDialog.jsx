import React, { useState } from 'react';

export default function DeleteProjectDialog({ 
  isOpen, 
  projectName,
  onConfirm, 
  onCancel 
}) {
  const [input, setInput] = useState('');
  const isConfirmed = input.toLowerCase().trim() === 'delete';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4v2m0 0a9 9 0 11-9-9m0 0a9 9 0 019 9" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Usuń projekt</h2>
        </div>
        
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4">
          <p className="text-rose-900 text-sm font-medium">⚠️ Operacja jest nieodwracalna</p>
          <p className="text-rose-800 text-sm mt-1">
            Usunięcie projektu "<strong>{projectName}</strong>" spowoduje usunięcie:
          </p>
          <ul className="text-rose-800 text-sm mt-2 ml-4 space-y-1 list-disc">
            <li>Wszystkich członków zespołu</li>
            <li>Wszystkich wydatków</li>
            <li>Całego ekwipunku</li>
          </ul>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-semibold text-zinc-700 mb-2">
            Wpisz "<span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded">delete</span>" aby potwierdzić:
          </label>
          <input
            type="text"
            placeholder="Wpisz słowo 'delete'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-slate-50 text-sm focus:ring-2 focus:ring-rose-600 focus:bg-white focus:border-transparent"
            autoFocus
          />
          <p className="text-xs text-zinc-500 mt-2">
            {isConfirmed ? '✅ Możesz teraz usunąć projekt' : '⏳ Wpisz "delete" aby odblokować'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-colors ${
              isConfirmed
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 cursor-pointer'
                : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
            }`}
          >
            Usuń projekt na zawsze
          </button>
        </div>
      </div>
    </div>
  );
}
