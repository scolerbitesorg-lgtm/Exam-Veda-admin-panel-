import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  FolderTree,
  Check,
  X,
  Sparkles,
  FileSpreadsheet,
  Smile,
  RefreshCw,
} from 'lucide-react';
import {
  addSubject,
  updateSubject,
  deleteSubject,
  deleteAllSubjects,
} from '../../services/dbService';
import type { Subject, Topic } from '../../types';
import { BulkImportSubjectsModal } from './BulkImportSubjectsModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface SubjectsViewProps {
  subjects: Subject[];
  topics: Topic[];
  onSelectSubjectTopics: (subjectId: string) => void;
  openCreateModal?: boolean;
  onCloseCreateModal?: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'लोकप्रिय विषय (Academic)',
    emojis: ['📚', '📖', '🏛️', '⚖️', '🌍', '🔬', '🧪', '📐', '💻', '📜', '🗺️', '🧬', '🪐', '🔢'],
  },
  {
    name: 'प्रतियोगिता व कौशल (Exams & Skills)',
    emojis: ['🧠', '🎯', '🏆', '💡', '🚀', '⚡', '📊', '💼', '✍️', '🩺', '👮‍♂️', '🧑‍🏫', '🛡️', '🎨'],
  },
  {
    name: 'चिन्ह व प्रतीक (Symbols & Badges)',
    emojis: ['🇮🇳', '🌟', '🔥', '💎', '🔑', '🏷️', '🔖', '🏅', '🎖️', '📌', '📑', '🎯', '🥇', '🧩'],
  },
];

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  topics,
  onSelectSubjectTopics,
  openCreateModal = false,
  onCloseCreateModal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(openCreateModal);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [hindiName, setHindiName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [color, setColor] = useState('#6366f1');
  const [order, setOrder] = useState<number>(subjects.length + 1);
  const [published, setPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingSubject(null);
    setName('');
    setHindiName('');
    setDescription('');
    setIcon('📚');
    setColor('#6366f1');
    setOrder(subjects.length + 1);
    setPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setHindiName(sub.hindiName || '');
    setDescription(sub.description || '');
    setIcon(sub.icon || '📚');
    setColor(sub.color || '#6366f1');
    setOrder(sub.order || 1);
    setPublished(sub.published ?? true);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('कृपया विषय का नाम दर्ज करें (Subject name required)');
    setIsSubmitting(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          name,
          hindiName,
          description,
          icon: icon || '📚',
          image: '', // No thumbnail, pure emoji logo
          color,
          order: Number(order) || 1,
          published,
        });
      } else {
        await addSubject({
          name,
          hindiName,
          description,
          icon: icon || '📚',
          image: '',
          color,
          order: Number(order) || 1,
          published,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      handleClose();
    } catch (err: any) {
      alert('विषय सहेजने में त्रुटि: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingSingle(true);
    try {
      await deleteSubject(deleteTarget.id);
      setDeleteSuccess(`विषय "${deleteTarget.name}" सफलतापूर्वक हटा दिया गया।`);
      setTimeout(() => setDeleteSuccess(null), 4000);
      setDeleteTarget(null);
    } catch (err: any) {
      alert('हटाने में त्रुटि: ' + err.message);
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleExecuteDeleteAll = async () => {
    setIsDeletingAll(true);
    setShowDeleteAllModal(false);
    setDeleteSuccess(null);
    try {
      const res = await deleteAllSubjects();
      setDeleteSuccess(`सभी ${res.deletedCount} विषय सफलतापूर्वक हटा दिए गए!`);
      setTimeout(() => setDeleteSuccess(null), 5000);
    } catch (err: any) {
      alert('हटाने में त्रुटि: ' + err.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleTogglePublish = async (sub: Subject) => {
    try {
      const isCurrentlyLive = sub.published !== false;
      await updateSubject(sub.id, { published: !isCurrentlyLive });
    } catch (err: any) {
      alert('स्टेटस अपडेट करने में त्रुटि: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            विषय प्रबंधन (Subject Management)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            इमोजी लोगो और थीम रंग के साथ सभी विषय प्रबंधित करें।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {subjects.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              disabled={isDeletingAll}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-2 transition shadow-2xs active:scale-95 disabled:opacity-50"
              title="सभी विषय हटाएँ"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{isDeletingAll ? 'हटाया जा रहा है...' : `सभी विषय हटाएँ (${subjects.length})`}</span>
            </button>
          )}

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs flex items-center gap-2 transition shadow-2xs active:scale-95"
            title="CSV द्वारा विषय जोड़ें"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span>बल्क इम्पोर्ट (CSV)</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ नया विषय जोड़ें</span>
          </button>
        </div>
      </div>

      {/* Delete notification toast */}
      {deleteSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {/* Subject Cards Grid with Emoji Logo */}
      {subjects.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">अभी कोई विषय नहीं बनाया गया है</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            पहला विषय जोड़ने के लिए नया विषय बटन दबाएं और पसंदीदा इमोजी लोगो चुनें।
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200"
          >
            पहला विषय जोड़ें
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => {
            const topicCount = topics.filter((t) => t.subjectId === sub.id).length;
            const subjectEmoji = sub.icon || '📚';
            const themeColor = sub.color || '#6366f1';

            return (
              <div
                key={sub.id}
                className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                {/* Modern Gradient Header with Large Emoji Logo */}
                <div
                  className="p-5 pb-4 relative overflow-hidden flex items-start justify-between"
                  style={{
                    background: `linear-gradient(135deg, ${themeColor}15, ${themeColor}30)`,
                    borderBottom: `2px solid ${themeColor}30`,
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Emoji Logo Emblem */}
                    <div
                      className="w-14 h-14 rounded-2xl border-2 border-white shadow-md flex items-center justify-center text-3xl transform hover:scale-105 transition shrink-0"
                      style={{ backgroundColor: themeColor }}
                    >
                      <span>{subjectEmoji}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/10 text-slate-800 text-[10px] font-mono font-bold">
                          #{sub.order}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">विषय</span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug truncate mt-0.5">
                        {sub.name}
                      </h3>
                    </div>
                  </div>

                  {/* Status Toggle Button */}
                  <button
                    onClick={() => handleTogglePublish(sub)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-2xs transition shrink-0 ${
                      sub.published !== false
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-rose-700 text-rose-100 hover:bg-rose-800'
                    }`}
                    title={
                      sub.published !== false
                        ? 'वर्तमान में लाइव है (विद्यार्थी ऐप में दिख रहा है)'
                        : 'वर्तमान में अप्रकाशित है'
                    }
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        sub.published !== false ? 'bg-white animate-pulse' : 'bg-rose-300'
                      }`}
                    />
                    {sub.published !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{sub.published !== false ? 'लाइव' : 'ऑफ'}</span>
                  </button>
                </div>

                {/* Subject Details */}
                <div className="p-5 pt-3 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {sub.hindiName && (
                      <p className="text-xs text-indigo-700 font-bold mb-1">{sub.hindiName}</p>
                    )}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {sub.description || 'कोई विवरण उपलब्ध नहीं है।'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onSelectSubjectTopics(sub.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 transition"
                    >
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>{topicCount} अध्याय / टॉपिक</span>
                      <span className="text-[10px] text-slate-400">→</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(sub)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition"
                        title="संपादित करें"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: sub.id, name: sub.name })}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 transition"
                        title="हटाएँ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subject Modal with Emoji Logo Picker */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-20">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                {editingSubject ? 'विषय संपादित करें (Edit Subject)' : 'नया विषय जोड़ें (Create Subject)'}
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Title English & Hindi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    विषय का नाम (English Title) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. Indian Polity & Constitution"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    हिंदी शीर्षक (Hindi Title)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. भारतीय राजव्यवस्था एवं संविधान"
                    value={hindiName}
                    onChange={(e) => setHindiName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  विषय विवरण (Description)
                </label>
                <textarea
                  rows={2}
                  placeholder="इस विषय के अंतर्गत आने वाले मुख्य अध्यायों का संक्षिप्त विवरण..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs"
                />
              </div>

              {/* EMOJI LOGO PICKER (Clean, Intuitive & No Thumbnail Needed) */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
                    <Smile className="w-4 h-4 text-indigo-600" />
                    <span>विषय का इमोजी लोगो (Subject Emoji Logo) *</span>
                  </div>

                  {/* Live Selected Logo Emblem */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">चुना गया लोगो:</span>
                    <div
                      className="w-10 h-10 rounded-2xl border-2 border-white shadow-md flex items-center justify-center text-2xl transition hover:scale-110"
                      style={{ backgroundColor: color || '#6366f1' }}
                    >
                      <span>{icon || '📚'}</span>
                    </div>
                  </div>
                </div>

                {/* Categorized Emojis */}
                <div className="space-y-2">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-500">{cat.name}:</div>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
                        {cat.emojis.map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setIcon(em)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg transition ${
                              icon === em
                                ? 'bg-indigo-100 border-2 border-indigo-600 scale-110 shadow-xs'
                                : 'hover:bg-slate-100 hover:scale-105'
                            }`}
                            title={em}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Emoji Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="या कोई भी मनपसंद इमोजी यहाँ पेस्ट/टाइप करें (उदा. 🇮🇳, 📝, 🎯)"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:border-indigo-500 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setIcon('📚')}
                    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                  >
                    डिफ़ॉल्ट (📚)
                  </button>
                </div>
              </div>

              {/* Order & Theme Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    क्रम संख्या (Display Order)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    थीम रंग (Theme Color)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded-xl border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Live Publish Toggle */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-xs">विद्यार्थी ऐप में लाइव रखें (Publish)</span>
                  <p className="text-[11px] text-slate-500">विद्यार्थी इस विषय को तुरंत देख सकेंगे</p>
                </div>
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-50 transition active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>सहेजा जा रहा है...</span>
                    </>
                  ) : (
                    <span>{editingSubject ? 'विषय अपडेट करें' : 'विषय जोड़ें'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <BulkImportSubjectsModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          existingSubjectsCount={subjects.length}
        />
      )}

      {/* Delete Single Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          title="विषय हटाएँ"
          itemName={deleteTarget.name}
          description={`क्या आप वाकई विषय "${deleteTarget.name}" को हटाना चाहते हैं?`}
          isLoading={isDeletingSingle}
          onConfirm={handleConfirmSingleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <DeleteConfirmModal
          isOpen={showDeleteAllModal}
          title="सभी विषय हटाएँ"
          isBulk={true}
          count={subjects.length}
          description="सावधानी: इससे सभी विषय डेटाबेस से हटा दिए जाएंगे।"
          confirmText="हाँ, सभी विषय हटाएँ"
          isLoading={isDeletingAll}
          onConfirm={handleExecuteDeleteAll}
          onClose={() => setShowDeleteAllModal(false)}
        />
      )}
    </div>
  );
};
