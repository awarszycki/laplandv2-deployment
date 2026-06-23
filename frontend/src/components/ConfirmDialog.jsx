import React from 'react';

/**
 * Uniwersalny dialog potwierdzenia - używaj do potwierdzenia akcji
 * 
 * Przykład:
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   title="Usunąć wydatek?"
 *   message="Czy na pewno chcesz usunąć ten wydatek? Operacja jest nieodwracalna."
 *   confirmText="Usuń"
 *   cancelText="Anuluj"
 *   isDangerous={true}
 *   onConfirm={() => {
 *     deleteExpense(expenseId);
 *     setShowConfirm(false);
 *   }}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */
export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Potwierdź", 
  cancelText = "Anuluj",
  isDangerous = false,  // Red button jeśli true
  onConfirm, 
  onCancel 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 animate-fade-in">
        {/* Header */}
        <h2 className="text-xl font-bold text-zinc-900 mb-2">{title}</h2>
        
        {/* Message */}
        <p className="text-zinc-600 mb-6 leading-relaxed">{message}</p>
        
        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-colors ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                : 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
