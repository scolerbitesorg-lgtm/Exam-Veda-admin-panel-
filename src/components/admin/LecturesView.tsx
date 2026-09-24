import React, { useState, useRef } from 'react';
import {
  Video,
  Plus,
  Play,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Clock,
  User,
  Smile,
  Check,
  RefreshCw,
} from 'lucide-react';
import { addLecture, updateLecture, deleteLecture, deleteAllLectures } from '../../services/dbService';
import type { Subject, Topic, Lecture } from '../../types';
import { EduVedaVideoPlayer } from '../common/EduVedaVideoPlayer';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface LecturesViewProps {
  subjects: Subject[];
  topics: Topic[];
  lectures: Lecture[];
  defaultSubjectId?: string;
  defaultTopicId?: string;
  openCreateModal?: boolean;
  onCloseCreateModal?: () => void;
}

const LECTURE_POPULAR_EMOJIS = [
  '🎬', '🎥', '📺', '▶️', '💡', '🧑‍🏫', '🔬', '📖',
  '⚡', '🌟', '🎯', '🚀', '🧠', '📝', '🏛️', '⚖️',
  '📐', '🌍', '💻', '📜', '🧬', '🪐', '🔢', '🛡️',
];

export const LecturesView: React.FC<LecturesViewProps> = ({
  subjects,
  topics,
  lectures,
  defaultSubjectId = '',
  defaultTopicId = '',
  openCreateModal = false,
  onCloseCreateModal,
}) => {
  const [filterSubjectId, setFilterSubjectId] = useState(defaultSubjectId);
  const [filterTopicId, setFilterTopicId] = useState(defaultTopicId);
  const [isModalOpen, setIsModalOpen] = useState(openCreateModal);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Video Preview Player Modal State
  const [previewingLecture, setPreviewingLecture] = useState<Lecture | null>(null);

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultSubjectId || subjects[0]?.id || '');
  const availableTopics = topics.filter((t) => !selectedSubjectId || t.subjectId === selectedSubjectId);
  const [selectedTopicId, setSelectedTopicId] = useState(defaultTopicId || availableTopics[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎬');
  const [videoUrl, setVideoUrl] = useState('');
  const [durationStr, setDurationStr] = useState('25:00');
  const [instructor, setInstructor] = useState('डॉ. राजेश शर्मा (वरिष्ठ प्राध्यापक)');
  const [order, setOrder] = useState<number>(1);
  const [published, setPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredLectures = lectures.filter((l) => {
    if (filterSubjectId && l.subjectId !== filterSubjectId) return false;
    if (filterTopicId && l.topicId !== filterTopicId) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingLecture(null);
    const subId = filterSubjectId || subjects[0]?.id || '';
    setSelectedSubjectId(subId);
    const avail = topics.filter((t) => t.subjectId === subId);
    setSelectedTopicId(filterTopicId || avail[0]?.id || '');
    setTitle('');
    setDescription('');
    setIcon('🎬');
    setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setDurationStr('25:00');
    setInstructor('डॉ. राजेश शर्मा');
    setOrder(filteredLectures.length + 1);
    setPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (lec: Lecture) => {
    setEditingLecture(lec);
    setSelectedSubjectId(lec.subjectId);
    setSelectedTopicId(lec.topicId);
    setTitle(lec.title);
    setDescription(lec.description || '');
    setIcon(lec.icon || '🎬');
    setVideoUrl(lec.videoUrl || '');
    setDurationStr(lec.duration || '20:00');
    setInstructor(lec.instructor || '');
    setOrder(lec.order || 1);
    setPublished(lec.published ?? true);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingLecture(null);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('कृपया व्याख्यान का शीर्षक दर्ज करें (Title required)');
    if (!selectedTopicId) return alert('कृपया संबंधित अध्याय (Topic) चुनें');
    if (!videoUrl.trim()) return alert('कृपया वीडियो लिंक (Video URL) दर्ज करें');

    setIsSubmitting(true);
    try {
      if (editingLecture) {
        await updateLecture(editingLecture.id, {
          subjectId: selectedSubjectId,
          topicId: selectedTopicId,
          title,
          description,
          icon: icon || '🎬',
          videoUrl,
          thumbnail: '', // Thumbnail removed - pure emoji
          duration: durationStr,
          instructor,
          order: Number(order) || 1,
          published,
        });
      } else {
        await addLecture({
          subjectId: selectedSubjectId,
          topicId: selectedTopicId,
          title,
          description,
          icon: icon || '🎬',
          videoUrl,
          thumbnail: '',
          duration: durationStr,
          instructor,
          order: Number(order) || 1,
          published,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      handleClose();
    } catch (err: any) {
      alert('व्याख्यान सहेजने में त्रुटि: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingSingle(true);
    try {
      await deleteLecture(deleteTarget.id);
      setDeleteSuccess(`व्याख्यान "${deleteTarget.name}" सफलतापूर्वक हटाया गया।`);
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
      const res = await deleteAllLectures();
      setShowDeleteAllModal(false);
      setDeleteSuccess(`सभी ${res.deletedCount} व्याख्यान सफलतापूर्वक हटा दिए गए!`);
      setTimeout(() => setDeleteSuccess(null), 5000);
    } catch (err: any) {
      alert('हटाने में त्रुटि: ' + err.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleTogglePublish = async (lec: Lecture) => {
    try {
      const isCurrentlyLive = lec.published !== false;
      await updateLecture(lec.id, { published: !isCurrentlyLive });
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
            <Video className="w-5 h-5 text-indigo-600" />
            वीडियो व्याख्यान प्रबंधन (Video Lectures)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            इमोजी लोगो के साथ वीडियो क्लासेज जोड़ें और स्मार्ट प्लेयर में चलाएं।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter */}
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <select
              value={filterSubjectId}
              onChange={(e) => {
                setFilterSubjectId(e.target.value);
                setFilterTopicId('');
              }}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="">सभी विषय</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.icon || '📚'} {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <select
              value={filterTopicId}
              onChange={(e) => setFilterTopicId(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="">सभी टॉपिक</option>
              {topics
                .filter((t) => !filterSubjectId || t.subjectId === filterSubjectId)
                .map((top) => (
                  <option key={top.id} value={top.id}>
                    {top.icon || '📂'} {top.title}
                  </option>
                ))}
            </select>
          </div>

          {lectures.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              disabled={isDeletingAll}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-2 transition shadow-2xs active:scale-95 disabled:opacity-50"
              title="सभी व्याख्यान हटाएँ"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{isDeletingAll ? 'हटाया जा रहा है...' : `सभी व्याख्यान हटाएँ (${lectures.length})`}</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>+ नया वीडियो व्याख्यान जोड़ें</span>
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

      {/* Delete All Lectures Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteAllModal}
        isBulk={true}
        title="सभी व्याख्यान हटाएँ?"
        count={lectures.length}
        description={`इससे सभी ${lectures.length} वीडियो व्याख्यान हमेशा के लिए हटा दिए जाएंगे।`}
        isLoading={isDeletingAll}
        onConfirm={handleExecuteDeleteAll}
        onClose={() => setShowDeleteAllModal(false)}
      />

      {/* Single Lecture Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="व्याख्यान हटाएँ?"
        itemName={deleteTarget?.name}
        description="क्या आप वाकई इस वीडियो व्याख्यान को हटाना चाहते हैं?"
        isLoading={isDeletingSingle}
        onConfirm={handleConfirmSingleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Lectures Grid */}
      {filteredLectures.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">कोई वीडियो व्याख्यान नहीं मिला</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            पहला वीडियो व्याख्यान जोड़ने के लिए ऊपर दिए गए बटन का उपयोग करें।
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
          >
            पहला व्याख्यान जोड़ें
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLectures.map((lec) => {
            const parentSubject = subjects.find((s) => s.id === lec.subjectId);
            const parentTopic = topics.find((t) => t.id === lec.topicId);
            const lectureEmoji = lec.icon || '🎬';

            return (
              <div
                key={lec.id}
                className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                {/* Modern Dark Header Card with Emoji Logo & Play Overlay */}
                <div
                  onClick={() => setPreviewingLecture(lec)}
                  className="h-36 relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 group cursor-pointer overflow-hidden flex flex-col justify-between p-4"
                >
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between z-10">
                    {/* Status Badge */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePublish(lec);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black shadow-xs flex items-center gap-1.5 transition ${
                        lec.published !== false
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-rose-700 text-rose-100 hover:bg-rose-800'
                      }`}
                      title={
                        lec.published !== false
                          ? 'वर्तमान में लाइव है'
                          : 'वर्तमान में अप्रकाशित है'
                      }
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          lec.published !== false ? 'bg-white animate-pulse' : 'bg-rose-300'
                        }`}
                      />
                      {lec.published !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{lec.published !== false ? 'लाइव' : 'ऑफ'}</span>
                    </button>

                    {/* Duration Badge */}
                    <div className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-300" />
                      <span>{lec.duration || '20:00'}</span>
                    </div>
                  </div>

                  {/* Center Large Emoji Logo with Play Button */}
                  <div className="flex items-center justify-center gap-3 my-auto z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-2xl shadow-inner">
                      <span>{lectureEmoji}</span>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-indigo-600 group-hover:bg-indigo-500 text-white shadow-lg flex items-center justify-center group-hover:scale-110 transition">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Subtle Background Glow */}
                  <div className="absolute inset-0 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 truncate mb-1">
                      <span>{parentSubject?.icon || '📚'} {parentSubject?.name}</span>
                      <span>•</span>
                      <span>{parentTopic?.icon || '📂'} {parentTopic?.title}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                      {lec.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {lec.description || 'कोई विवरण उपलब्ध नहीं है।'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{lec.instructor || 'प्राध्यापक'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(lec)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition"
                        title="संपादित करें"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: lec.id, name: lec.title })}
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

      {/* Custom Video Player Modal */}
      {previewingLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{previewingLecture.icon || '🎬'}</span>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                    Edu Veda Video Player
                  </span>
                  <h3 className="text-sm font-bold text-white truncate max-w-lg">
                    {previewingLecture.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewingLecture(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950">
              <EduVedaVideoPlayer
                videoUrl={previewingLecture.videoUrl}
                title={previewingLecture.title}
                autoPlay
              />
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Lecture Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-20">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" />
                {editingLecture ? 'व्याख्यान संपादित करें (Edit Lecture)' : 'नया वीडियो व्याख्यान जोड़ें (Add Lecture)'}
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">विषय (Subject) *</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      const avail = topics.filter((t) => t.subjectId === e.target.value);
                      setSelectedTopicId(avail[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon || '📚'} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">अध्याय (Topic) *</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    {availableTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon || '📂'} {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LECTURE EMOJI LOGO PICKER */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-xs">
                    <Smile className="w-4 h-4 text-indigo-600" />
                    <span>व्याख्यान का इमोजी लोगो (Lecture Emoji Logo)</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold">लोगो:</span>
                    <div className="w-8 h-8 rounded-xl bg-white border border-indigo-200 shadow-2xs flex items-center justify-center text-lg">
                      <span>{icon || '🎬'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200 max-h-24 overflow-y-auto">
                  {LECTURE_POPULAR_EMOJIS.map((em) => (
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
                    placeholder="या कोई अन्य इमोजी टाइप करें (उदा. 🎥, 🧑‍🏫, 💡)"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIcon('🎬')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-[11px] font-bold"
                  >
                    डिफ़ॉल्ट
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">व्याख्यान का शीर्षक (Title) *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. सिंधु घाटी सभ्यता: नगर नियोजन एवं अर्थव्यवस्था की विस्तृत समझ"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    वीडियो लिंक (YouTube, Vimeo, या MP4 URL) *
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono"
                    >
                      सैंपल MP4
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoUrl('https://www.youtube.com/watch?v=LXb3EKWsInQ')}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium"
                    >
                      YouTube
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/watch?v=... या https://...mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">अवधि (Duration MM:SS)</label>
                  <input
                    type="text"
                    placeholder="28:45"
                    value={durationStr}
                    onChange={(e) => setDurationStr(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">प्राध्यापक (Faculty / Instructor)</label>
                  <input
                    type="text"
                    placeholder="डॉ. राजेश शर्मा"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">व्याख्यान विवरण (Description)</label>
                <textarea
                  rows={2}
                  placeholder="इस व्याख्यान में कवर किए गए मुख्य बिंदु..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-xs">विद्यार्थी ऐप में लाइव रखें (Publish)</span>
                  <p className="text-[11px] text-slate-500">विद्यार्थी इस वीडियो को तुरंत देख सकेंगे</p>
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
                  ) : editingLecture ? (
                    'व्याख्यान अपडेट करें'
                  ) : (
                    'व्याख्यान जोड़ें'
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
