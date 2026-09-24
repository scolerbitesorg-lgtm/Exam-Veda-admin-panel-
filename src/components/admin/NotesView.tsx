import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  X,
  FileDown,
  BookOpen,
  Sparkles,
  ExternalLink,
  Check,
  Search,
  AlertCircle,
  FolderPlus,
  BookMarked,
} from 'lucide-react';
import { addNote, updateNote, deleteNote, deleteAllNotes } from '../../services/dbService';
import type { Subject, Topic, Note } from '../../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface NotesViewProps {
  subjects: Subject[];
  topics: Topic[];
  notes: Note[];
  defaultSubjectId?: string;
  defaultTopicId?: string;
  openCreateModal?: boolean;
  onCloseCreateModal?: () => void;
}

const EMOJI_OPTIONS = ['📝', '📑', '📖', '📄', '📘', '💡', '📌', '📚', '📜', '🎯', '✨', '🔍', '🏛️', '📊', '⚖️', '🧠'];

export const NotesView: React.FC<NotesViewProps> = ({
  subjects,
  topics,
  notes,
  defaultSubjectId = '',
  defaultTopicId = '',
  openCreateModal = false,
  onCloseCreateModal,
}) => {
  const [filterSubjectId, setFilterSubjectId] = useState(defaultSubjectId);
  const [filterTopicId, setFilterTopicId] = useState(defaultTopicId);
  const [filterType, setFilterType] = useState<'all' | 'text' | 'pdf'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(openCreateModal);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Note Viewer Modal (Preview text/markdown or PDF)
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultSubjectId || subjects[0]?.id || '');
  const [selectedTopicId, setSelectedTopicId] = useState(defaultTopicId || '');
  const [title, setTitle] = useState('');
  const [hindiTitle, setHindiTitle] = useState('');
  const [icon, setIcon] = useState('📝');
  const [type, setType] = useState<'text' | 'pdf'>('text');
  const [content, setContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pageCount, setPageCount] = useState<number>(10);
  const [published, setPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available topics based on selected subject in modal
  const modalAvailableTopics = topics.filter((t) => !selectedSubjectId || t.subjectId === selectedSubjectId);

  // Available topics for filtering
  const filterAvailableTopics = topics.filter((t) => !filterSubjectId || t.subjectId === filterSubjectId);

  // Auto-sync selectedTopicId if it's invalid when subject changes in modal
  useEffect(() => {
    if (selectedSubjectId) {
      const valid = topics.filter((t) => t.subjectId === selectedSubjectId);
      if (valid.length > 0) {
        if (!valid.some((t) => t.id === selectedTopicId)) {
          setSelectedTopicId(valid[0].id);
        }
      } else {
        setSelectedTopicId('');
      }
    }
  }, [selectedSubjectId, topics, selectedTopicId]);

  // Open create modal trigger from parent props
  useEffect(() => {
    if (openCreateModal) {
      openAddModal();
    }
  }, [openCreateModal]);

  const filteredNotes = notes.filter((n) => {
    if (filterSubjectId && n.subjectId !== filterSubjectId) return false;
    if (filterTopicId && n.topicId !== filterTopicId) return false;
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchHindi = n.hindiTitle?.toLowerCase().includes(q);
      const matchContent = n.content?.toLowerCase().includes(q);
      if (!matchTitle && !matchHindi && !matchContent) return false;
    }
    return true;
  });

  const openAddModal = () => {
    setEditingNote(null);
    setErrorMessage(null);
    const subId = filterSubjectId || subjects[0]?.id || '';
    setSelectedSubjectId(subId);
    const avail = topics.filter((t) => t.subjectId === subId);
    setSelectedTopicId(filterTopicId || avail[0]?.id || (topics[0]?.id || ''));
    setTitle('');
    setHindiTitle('');
    setIcon('📝');
    setType('text');
    setContent(`# Chapter Overview & Revision Pointers (महत्वपूर्ण सारांश)\n\n## Important Concepts (मुख्य संकल्पनाएं)\n- मुख्य तथ्य और ऐतिहासिक पृष्ठभूमि\n- प्रमुख सिद्धांत एवं उनका अनुप्रयोग\n\n## Key Exam Pointers (परीक्षा दृष्टि)\n- महत्वपूर्ण तिथियां, समितियां व अनुच्छेद\n- संभावित मुख्य प्रश्न`);
    setPdfUrl('');
    setPageCount(10);
    setPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setErrorMessage(null);
    setSelectedSubjectId(note.subjectId);
    setSelectedTopicId(note.topicId);
    setTitle(note.title || '');
    setHindiTitle(note.hindiTitle || '');
    setIcon(note.icon || '📝');
    setType(note.type || 'text');
    setContent(note.content || '');
    setPdfUrl(note.pdfUrl || '');
    setPageCount(note.pageCount || 10);
    setPublished(note.published ?? true);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setErrorMessage(null);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const insertTemplate = (templateType: 'summary' | 'facts' | 'formulae') => {
    if (templateType === 'summary') {
      setContent((prev) =>
        prev +
        `\n\n## 📌 विस्तृत विश्लेषण (Comprehensive Analysis)\n- बिंदु 1: बुनियादी परिभाषा एवं पृष्ठभूमि\n- बिंदु 2: व्यावहारिक दृष्टिकोण एवं निष्कर्ष\n- बिंदु 3: विगत वर्षों के प्रश्नों का सारांश`
      );
    } else if (templateType === 'facts') {
      setContent((prev) =>
        prev +
        `\n\n## ⚡ Quick Fact Box (तुरंत याद रखने योग्य तथ्य)\n- तथ्य 1: प्रमुख वर्ष / अनुच्छेद / धारा\n- तथ्य 2: संबंधित प्रमुख व्यक्तित्व या समिति\n- तथ्य 3: संवैधानिक / कानूनी प्रावधान`
      );
    } else if (templateType === 'formulae') {
      setContent((prev) =>
        prev +
        `\n\n## 📐 मुख्य सूत्र व नियम (Key Rules & Formulae)\n- नियम 1: [विस्तार लिखें]\n- नियम 2: [विस्तार लिखें]\n- उदाहरण: [व्याख्या]`
      );
    }
  };

  const handleUseDemoPdf = () => {
    setPdfUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    setPageCount(12);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSubjectId) {
      setErrorMessage('कृपया पहले एक Subject (विषय) चुनें या बनाएं!');
      return;
    }

    if (!selectedTopicId) {
      setErrorMessage('कृपया एक Topic (अध्याय) चुनें! यदि कोई Topic नहीं है तो पहले Topics सेक्शन में जाकर Topic जोड़ें।');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('नोट का शीर्षक (Note Title) अनिवार्य है!');
      return;
    }

    if (type === 'pdf' && !pdfUrl.trim()) {
      setErrorMessage('PDF का लिंक (URL) अनिवार्य है! आप "Use Sample Demo PDF" पर क्लिक करके भी टेस्ट कर सकते हैं।');
      return;
    }

    if (type === 'text' && !content.trim()) {
      setErrorMessage('टेक्स्ट नोट का विवरण (Note Content) अनिवार्य है!');
      return;
    }

    setIsSubmitting(true);
    try {
      const parentSubject = subjects.find((s) => s.id === selectedSubjectId);
      const parentTopic = topics.find((t) => t.id === selectedTopicId);

      const notePayload = {
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        topicTitle: parentTopic?.title || '',
        title: title.trim(),
        hindiTitle: hindiTitle.trim(),
        icon: icon.trim() || '📝',
        type,
        content: type === 'text' ? content.trim() : '',
        pdfUrl: type === 'pdf' ? pdfUrl.trim() : '',
        pageCount: type === 'pdf' ? Number(pageCount) || 1 : 0,
        published,
      };

      if (editingNote) {
        await updateNote(editingNote.id, notePayload);
        setDeleteSuccess(`नोट "${title}" सफलतापूर्वक अपडेट हो गया!`);
      } else {
        await addNote({
          ...notePayload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setDeleteSuccess(`🎉 नया नोट "${title}" सफलतापूर्वक जुड़ गया!`);
      }

      setTimeout(() => setDeleteSuccess(null), 4000);
      handleClose();
    } catch (err: any) {
      console.error('Error saving note:', err);
      setErrorMessage('नोट सहेजने में त्रुटि: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingSingle(true);
    try {
      await deleteNote(deleteTarget.id);
      setDeleteSuccess(`Note "${deleteTarget.name}" deleted successfully.`);
      setTimeout(() => setDeleteSuccess(null), 4000);
      setDeleteTarget(null);
    } catch (err: any) {
      alert('Failed to delete note: ' + err.message);
    } finally {
      setIsDeletingSingle(false);
    }
  };

  const handleExecuteDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const res = await deleteAllNotes();
      setShowDeleteAllModal(false);
      setDeleteSuccess(`Successfully deleted all ${res.deletedCount} notes!`);
      setTimeout(() => setDeleteSuccess(null), 5000);
    } catch (err: any) {
      alert('Failed to delete notes: ' + err.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleTogglePublish = async (note: Note) => {
    try {
      const isCurrentlyLive = note.published !== false;
      await updateNote(note.id, { published: !isCurrentlyLive });
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Study Notes & PDF Material (अध्ययन सामग्री)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage comprehensive digital revision notes with Hindi/English formatting and PDF downloads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type Filter */}
          <div className="bg-white px-2 py-1 rounded-xl border border-slate-200 text-xs flex items-center gap-1 shadow-2xs">
            {(['all', 'text', 'pdf'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition cursor-pointer ${
                  filterType === t ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t === 'all' ? 'All Types' : t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
            <select
              value={filterSubjectId}
              onChange={(e) => {
                setFilterSubjectId(e.target.value);
                setFilterTopicId('');
              }}
              className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          {filterSubjectId && filterAvailableTopics.length > 0 && (
            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <select
                value={filterTopicId}
                onChange={(e) => setFilterTopicId(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
              >
                <option value="">All Topics</option>
                {filterAvailableTopics.map((top) => (
                  <option key={top.id} value={top.id}>
                    {top.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {notes.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              disabled={isDeletingAll}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Delete all notes and study materials"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{isDeletingAll ? 'Deleting...' : `Delete All (${notes.length})`}</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Note / PDF (+ नया नोट)</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes by English/Hindi title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl"
          >
            Clear
          </button>
        )}
      </div>

      {/* Delete notification toast */}
      {deleteSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 shadow-xs">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {/* Warning if no subjects or topics */}
      {subjects.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">⚠️ कोई Subject (विषय) नहीं मिला!</span>
            <p className="mt-0.5 text-amber-800">
              Note बनाने से पहले कम से कम एक <strong>Subject</strong> और <strong>Topic</strong> का होना आवश्यक है। कृपया पहले <strong>Subjects</strong> मेनू में जाकर विषय बनाएं।
            </p>
          </div>
        </div>
      )}

      {subjects.length > 0 && topics.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">⚠️ कोई Topic (अध्याय) नहीं मिला!</span>
            <p className="mt-0.5 text-amber-800">
              Note किसी Topic से जुड़ा होता है। कृपया पहले <strong>Topics</strong> टैब में जाकर अपने Subject के अंतर्गत कम से कम एक Topic बनाएं।
            </p>
          </div>
        </div>
      )}

      {/* Delete All Notes Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteAllModal}
        isBulk={true}
        title="Delete All Notes?"
        count={notes.length}
        description={`This will permanently delete all ${notes.length} notes and PDFs from your database.`}
        isLoading={isDeletingAll}
        onConfirm={handleExecuteDeleteAll}
        onClose={() => setShowDeleteAllModal(false)}
      />

      {/* Single Note Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Note?"
        itemName={deleteTarget?.name}
        description="Are you sure you want to delete this study note or PDF?"
        isLoading={isDeletingSingle}
        onConfirm={handleConfirmSingleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-300">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No notes found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Upload PDF materials or write bilingual text revision notes for students.
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-md shadow-indigo-100"
          >
            Add First Study Note (+ पहला नोट जोड़ें)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const parentSubject = subjects.find((s) => s.id === note.subjectId);
            const parentTopic = topics.find((t) => t.id === note.topicId);
            const isPdf = note.type === 'pdf';
            const themeColor = parentSubject?.color || '#6366f1';

            return (
              <div
                key={note.id}
                className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-lg border border-slate-100 shadow-2xs"
                        style={{ backgroundColor: `${themeColor}15` }}
                      >
                        <span>{note.icon || '📝'}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                          isPdf
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isPdf ? <FileDown className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {isPdf ? 'PDF Material' : 'Revision Note'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleTogglePublish(note)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1.5 transition cursor-pointer ${
                        note.published !== false
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                          : 'bg-rose-700 text-rose-100 hover:bg-rose-800'
                      }`}
                      title={note.published !== false ? 'Currently Live on User App. Click to make Unlive.' : 'Currently Unlive (hidden from User App). Click to make Live.'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${note.published !== false ? 'bg-white animate-pulse' : 'bg-rose-300'}`} />
                      {note.published !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{note.published !== false ? 'LIVE' : 'UNLIVE'}</span>
                    </button>
                  </div>

                  <div className="text-[10px] font-bold text-indigo-600 truncate mb-1">
                    {parentSubject?.name || 'Subject'} • {parentTopic?.title || 'Topic'}
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                    {note.title}
                  </h3>
                  {note.hindiTitle && (
                    <p className="text-xs text-indigo-700 font-semibold truncate mt-0.5">
                      {note.hindiTitle}
                    </p>
                  )}

                  {isPdf ? (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileDown className="w-4 h-4 text-rose-500" />
                        <span className="font-semibold">{note.pageCount || 10} Pages</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">PDF Storage</span>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-3 font-sans leading-relaxed">
                      {note.content?.slice(0, 160) || 'Comprehensive study note...'}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setViewingNote(note)}
                    className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Preview Note</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(note)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                      title="Edit Note"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: note.id, name: note.title })}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                      title="Delete Note"
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

      {/* Note Preview Viewer Modal */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{viewingNote.icon || '📝'}</span>
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {viewingNote.type.toUpperCase()} Viewer
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{viewingNote.title}</h3>
                  {viewingNote.hindiTitle && (
                    <p className="text-xs text-indigo-600 font-semibold">{viewingNote.hindiTitle}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingNote(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {viewingNote.type === 'pdf' ? (
                <div className="space-y-4 text-center py-8">
                  <FileDown className="w-16 h-16 text-rose-500 mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">PDF Document Link</h4>
                    <p className="text-xs text-slate-500 mt-1 font-mono break-all">{viewingNote.pdfUrl}</p>
                    <div className="mt-2 text-xs text-slate-600 font-semibold">Total Pages: {viewingNote.pageCount || 10}</div>
                  </div>
                  <a
                    href={viewingNote.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition cursor-pointer shadow-md shadow-rose-200"
                  >
                    <span>Open / Download PDF in New Tab</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="prose prose-indigo max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-sans text-sm">
                  {viewingNote.content}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {editingNote ? 'Edit Study Note (नोट संपादित करें)' : 'Create New Study Note (नया नोट जोड़ें)'}
              </h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Subject & Topic Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject (विषय) *</label>
                  {subjects.length === 0 ? (
                    <div className="text-xs text-rose-600 font-semibold p-2 rounded-lg bg-rose-50 border border-rose-200">
                      No subjects available.
                    </div>
                  ) : (
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => {
                        const newSubId = e.target.value;
                        setSelectedSubjectId(newSubId);
                        const avail = topics.filter((t) => t.subjectId === newSubId);
                        setSelectedTopicId(avail[0]?.id || '');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Topic (अध्याय) *</label>
                  {modalAvailableTopics.length === 0 ? (
                    <div className="text-xs text-amber-700 font-medium p-2 rounded-lg bg-amber-50 border border-amber-200">
                      इस Subject में Topic नहीं है!
                    </div>
                  ) : (
                    <select
                      value={selectedTopicId}
                      onChange={(e) => setSelectedTopicId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      {modalAvailableTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Emoji Logo Picker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Note Emoji Logo (प्रतीक चिंन्ह)</label>
                <div className="flex flex-wrap gap-1.5 items-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setIcon(em)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition cursor-pointer ${
                        icon === em ? 'bg-indigo-600 text-white scale-110 shadow-xs' : 'hover:bg-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                  <input
                    type="text"
                    maxLength={2}
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="Custom"
                    className="w-14 text-center px-1.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-xs"
                    title="Type custom emoji"
                  />
                </div>
              </div>

              {/* Note Format Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Note Format Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('text')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      type === 'text'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Formatted Text Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('pdf')}
                    className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      type === 'pdf'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileDown className="w-4 h-4" />
                    <span>PDF Document</span>
                  </button>
                </div>
              </div>

              {/* Title & Hindi Title */}
              <div className="space-y-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Note Title (English / Hinglish) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indus Valley Civilization - Core Summary & Sites"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hindi Title (हिंदी शीर्षक - वैकल्पिक)</label>
                  <input
                    type="text"
                    placeholder="उदा. सिंधु घाटी सभ्यता - संपूर्ण सार संग्रह एवं मुख्य स्थल"
                    value={hindiTitle}
                    onChange={(e) => setHindiTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs font-semibold text-indigo-700"
                  />
                </div>
              </div>

              {/* Dynamic Content based on Type */}
              {type === 'text' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-700">Note Content (Bilingual Hindi & English) *</label>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => insertTemplate('summary')}
                        className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold cursor-pointer"
                      >
                        + Analysis
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTemplate('facts')}
                        className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold cursor-pointer"
                      >
                        + Fact Box
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={8}
                    required
                    placeholder="Type or paste comprehensive revision notes with headings, points, and summaries in Hindi or English..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs font-sans leading-relaxed"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">
                        PDF Public Document URL *
                      </label>
                      <button
                        type="button"
                        onClick={handleUseDemoPdf}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                      >
                        Use Sample Demo PDF
                      </button>
                    </div>
                    <input
                      type="url"
                      required
                      placeholder="https://.../notes.pdf"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estimated Total Pages</label>
                    <input
                      type="number"
                      min="1"
                      value={pageCount}
                      onChange={(e) => setPageCount(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Publish Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Publish to Student App</span>
                  <p className="text-[11px] text-slate-500">Enable students to access this note in Notes section</p>
                </div>
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-200 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note (नोट सहेजें)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
