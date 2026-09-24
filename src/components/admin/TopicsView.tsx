import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  Eye,
  EyeOff,
  Filter,
  X,
  Check,
  Smile,
  RefreshCw,
} from 'lucide-react';
import { addTopic, updateTopic, deleteTopic, deleteAllTopics } from '../../services/dbService';
import type { Subject, Topic, Lecture, Note, MCQ } from '../../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface TopicsViewProps {
  subjects: Subject[];
  topics: Topic[];
  lectures: Lecture[];
  notes: Note[];
  mcqs: MCQ[];
  selectedSubjectFilter?: string;
  onSelectSubjectFilter?: (subId: string) => void;
  openCreateModal?: boolean;
  onCloseCreateModal?: () => void;
  onAddContentForTopic?: (type: 'lecture' | 'note' | 'mcq', topicId: string, subjectId: string) => void;
}

const TOPIC_POPULAR_EMOJIS = [
  '📁', '📂', '📑', '🔬', '🏛️', '⚖️', '📐', '🌍',
  '💻', '🧠', '💡', '📜', '🚀', '🎯', '📊', '⚡',
  '🧬', '🪐', '🔢', '🛡️', '✍️', '📖', '📌', '🏷️',
];

export const TopicsView: React.FC<TopicsViewProps> = ({
  subjects,
  topics,
  lectures,
  notes,
  mcqs,
  selectedSubjectFilter = '',
  onSelectSubjectFilter,
  openCreateModal = false,
  onCloseCreateModal,
  onAddContentForTopic,
}) => {
  const [activeSubjectFilter, setActiveSubjectFilter] = useState(selectedSubjectFilter);
  const [isModalOpen, setIsModalOpen] = useState(openCreateModal);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Form State
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [hindiTitle, setHindiTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📂');
  const [order, setOrder] = useState<number>(1);
  const [published, setPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTopics = activeSubjectFilter
    ? topics.filter((t) => t.subjectId === activeSubjectFilter)
    : topics;

  const openAddModal = () => {
    setEditingTopic(null);
    setSubjectId(activeSubjectFilter || subjects[0]?.id || '');
    setTitle('');
    setHindiTitle('');
    setDescription('');
    setIcon('📂');
    setOrder(filteredTopics.length + 1);
    setPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (top: Topic) => {
    setEditingTopic(top);
    setSubjectId(top.subjectId);
    setTitle(top.title);
    setHindiTitle(top.hindiTitle || '');
    setDescription(top.description || '');
    setIcon(top.icon || '📂');
    setOrder(top.order || 1);
    setPublished(top.published ?? true);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingTopic(null);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('कृपया टॉपिक का नाम दर्ज करें (Title required)');
    if (!subjectId) return alert('कृपया मूल विषय (Parent Subject) चुनें');

    setIsSubmitting(true);
    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, {
          subjectId,
          title,
          hindiTitle,
          description,
          icon: icon || '📂',
          order: Number(order) || 1,
          published,
        });
      } else {
        await addTopic({
          subjectId,
          title,
          hindiTitle,
          description,
          icon: icon || '📂',
          order: Number(order) || 1,
          published,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      handleClose();
    } catch (err: any) {
      alert('टॉपिक सहेजने में त्रुटि: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingSingle(true);
    try {
      await deleteTopic(deleteTarget.id);
      setDeleteSuccess(`टॉपिक "${deleteTarget.name}" सफलतापूर्वक हटाया गया।`);
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
    try {
      const res = await deleteAllTopics();
      setShowDeleteAllModal(false);
      setDeleteSuccess(`सभी ${res.deletedCount} टॉपिक सफलतापूर्वक हटा दिए गए!`);
      setTimeout(() => setDeleteSuccess(null), 5000);
    } catch (err: any) {
      alert('हटाने में त्रुटि: ' + err.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleTogglePublish = async (top: Topic) => {
    try {
      const isCurrentlyLive = top.published !== false;
      await updateTopic(top.id, { published: !isCurrentlyLive });
    } catch (err: any) {
      alert('स्टेटस अपडेट करने में त्रुटि: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            अध्याय एवं टॉपिक प्रबंधन (Topic Management)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            प्रत्येक अध्याय/टॉपिक के लिए इमोजी लोगो चुनें और वीडियो, नोट्स व MCQs जोड़ें।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter Dropdown */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeSubjectFilter}
              onChange={(e) => {
                setActiveSubjectFilter(e.target.value);
                if (onSelectSubjectFilter) onSelectSubjectFilter(e.target.value);
              }}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="">सभी विषय ({subjects.length})</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.icon || '📚'} {sub.name}
                </option>
              ))}
            </select>
          </div>

          {topics.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              disabled={isDeletingAll}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-2 transition shadow-2xs active:scale-95 disabled:opacity-50"
              title="सभी टॉपिक हटाएँ"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{isDeletingAll ? 'हटाया जा रहा है...' : `सभी टॉपिक हटाएँ (${topics.length})`}</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ नया टॉपिक जोड़ें</span>
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

      {/* Delete All Topics Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteAllModal}
        isBulk={true}
        title="सभी टॉपिक हटाएँ?"
        count={topics.length}
        description={`इससे सभी ${topics.length} टॉपिक हमेशा के लिए हटा दिए जाएंगे।`}
        isLoading={isDeletingAll}
        onConfirm={handleExecuteDeleteAll}
        onClose={() => setShowDeleteAllModal(false)}
      />

      {/* Single Topic Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="टॉपिक हटाएँ?"
        itemName={deleteTarget?.name}
        description={`क्या आप वाकई "${deleteTarget?.name}" को हटाना चाहते हैं?`}
        isLoading={isDeletingSingle}
        onConfirm={handleConfirmSingleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Topics List */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <FolderTree className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">कोई टॉपिक नहीं मिला</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {activeSubjectFilter
              ? 'इस विषय में अभी कोई टॉपिक नहीं है। पहला अध्याय जोड़ें!'
              : 'अध्याय जोड़ने के लिए नया टॉपिक बटन दबाएं।'}
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
          >
            पहला टॉपिक जोड़ें
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTopics.map((top) => {
            const parentSubject = subjects.find((s) => s.id === top.subjectId);
            const topicLectures = lectures.filter((l) => l.topicId === top.id).length;
            const topicNotes = notes.filter((n) => n.topicId === top.id).length;
            const topicMCQs = mcqs.filter((m) => m.topicId === top.id).length;
            const topicEmoji = top.icon || '📂';

            return (
              <div
                key={top.id}
                className="p-4 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-200 hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Topic Emoji Logo */}
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                    <span>{topicEmoji}</span>
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-100 flex items-center gap-1">
                        <span>{parentSubject?.icon || '📚'}</span>
                        <span>{parentSubject?.name || 'विषय'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">#{top.order}</span>
                      <button
                        onClick={() => handleTogglePublish(top)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1.5 transition ${
                          top.published !== false
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                            : 'bg-rose-700 text-rose-100 hover:bg-rose-800'
                        }`}
                        title={
                          top.published !== false
                            ? 'वर्तमान में लाइव है (विद्यार्थी ऐप में दिख रहा है)'
                            : 'वर्तमान में अप्रकाशित है'
                        }
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            top.published !== false ? 'bg-white animate-pulse' : 'bg-rose-300'
                          }`}
                        />
                        {top.published !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{top.published !== false ? 'लाइव' : 'ऑफ'}</span>
                      </button>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{top.title}</h3>
                    {top.hindiTitle && (
                      <p className="text-xs text-indigo-700 font-bold">{top.hindiTitle}</p>
                    )}
                    {top.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{top.description}</p>
                    )}
                  </div>
                </div>

                {/* Content Counters and Quick Adders */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-1 text-slate-700 font-bold" title="वीडियो लेक्चर्स">
                      <Video className="w-3.5 h-3.5 text-sky-500" />
                      <span>{topicLectures}</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1 text-slate-700 font-bold" title="रिवीजन नोट्स">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{topicNotes}</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1 text-slate-700 font-bold" title="प्रैक्टिस MCQs">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>{topicMCQs}</span>
                    </div>
                  </div>

                  {/* Actions for this topic */}
                  <div className="flex items-center gap-1">
                    {onAddContentForTopic && (
                      <>
                        <button
                          onClick={() => onAddContentForTopic('lecture', top.id, top.subjectId)}
                          className="px-2 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[11px] flex items-center gap-1 transition"
                          title="वीडियो जोड़ें"
                        >
                          <Video className="w-3 h-3" />
                          <span className="hidden sm:inline">+वीडियो</span>
                        </button>
                        <button
                          onClick={() => onAddContentForTopic('note', top.id, top.subjectId)}
                          className="px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center gap-1 transition"
                          title="नोट्स जोड़ें"
                        >
                          <FileText className="w-3 h-3" />
                          <span className="hidden sm:inline">+नोट्स</span>
                        </button>
                        <button
                          onClick={() => onAddContentForTopic('mcq', top.id, top.subjectId)}
                          className="px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[11px] flex items-center gap-1 transition"
                          title="MCQ जोड़ें"
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span className="hidden sm:inline">+MCQ</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => openEditModal(top)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition"
                      title="संपादित करें"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: top.id, name: top.title })}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 transition"
                      title="हटाएँ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Topic Modal with Emoji Selection */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-20">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-indigo-600" />
                {editingTopic ? 'अध्याय संपादित करें (Edit Topic)' : 'नया अध्याय जोड़ें (Create Topic)'}
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  संबंधित विषय (Parent Subject) *
                </label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs font-semibold"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.icon || '📚'} {sub.name} {sub.hindiName ? `(${sub.hindiName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* TOPIC EMOJI LOGO PICKER */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
                    <Smile className="w-4 h-4 text-indigo-600" />
                    <span>टॉपिक इमोजी लोगो (Topic Emoji Logo)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold">लोगो:</span>
                    <div className="w-8 h-8 rounded-xl bg-white border border-indigo-200 shadow-2xs flex items-center justify-center text-lg">
                      <span>{icon || '📂'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200 max-h-24 overflow-y-auto">
                  {TOPIC_POPULAR_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setIcon(em)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-base transition ${
                        icon === em
                          ? 'bg-indigo-100 border-2 border-indigo-600 scale-110 shadow-2xs'
                          : 'hover:bg-slate-100'
                      }`}
                      title={em}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="या कोई अन्य इमोजी टाइप करें (उदा. 🏛️, 🔬, 📐)"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIcon('📂')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-[11px] font-bold"
                  >
                    डिफ़ॉल्ट
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  टॉपिक का नाम (English Title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. Indus Valley Civilization: Town Planning & Economy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  हिंदी शीर्षक (Hindi Title)
                </label>
                <input
                  type="text"
                  placeholder="उदा. सिंधु घाटी सभ्यता: नगर नियोजन एवं अर्थव्यवस्था"
                  value={hindiTitle}
                  onChange={(e) => setHindiTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  अध्याय विवरण (Description)
                </label>
                <textarea
                  rows={2}
                  placeholder="इस अध्याय के मुख्य परीक्षा उपयोगी बिंदु..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs"
                />
              </div>

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

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-xs">विद्यार्थी ऐप में लाइव रखें (Publish)</span>
                  <p className="text-[11px] text-slate-500">विद्यार्थी इस टॉपिक को तुरंत देख सकेंगे</p>
                </div>
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-200 disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>सहेजा जा रहा है...</span>
                    </>
                  ) : editingTopic ? (
                    'टॉपिक अपडेट करें'
                  ) : (
                    'टॉपिक जोड़ें'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
