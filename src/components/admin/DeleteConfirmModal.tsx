import React from 'react';
import { Trash2, X, AlertTriangle, AlertCircle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  description?: string;
  isBulk?: boolean;
  count?: number;
  isLoading?: boolean;
  confirmText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  description,
  isBulk = false,
  count,
  isLoading = false,
  confirmText,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 space-y-4 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isBulk ? 'bg-rose-100 text-rose-600' : 'bg-red-50 text-red-500'
            }`}>
              {isBulk ? <AlertTriangle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBulk ? 'Batch Deletion' : 'Permanent Deletion'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-950 text-xs space-y-2 leading-relaxed">
          {itemName && (
            <p className="font-semibold text-slate-800 break-words">
              Target: <span className="text-rose-700 font-bold">"{itemName}"</span>
            </p>
          )}

          {description ? (
            <p className="text-[11px] text-slate-600">{description}</p>
          ) : isBulk ? (
            <p className="text-[11px] text-slate-600">
              This will permanently delete all <strong>{count ?? ''}</strong> items from your database.
            </p>
          ) : (
            <p className="text-[11px] text-slate-600">
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
          )}

          <p className="text-[10px] text-rose-700 font-semibold flex items-center gap-1 pt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>This change takes effect immediately in Firestore.</span>
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-rose-200 disabled:opacity-50"
          >
            <Trash2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Deleting...' : (confirmText || (isBulk ? 'Yes, Delete All' : 'Yes, Delete'))}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
