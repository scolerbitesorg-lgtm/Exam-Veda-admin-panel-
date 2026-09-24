import React, { useState } from 'react';
import {
  Palette,
  X,
  Save,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Check,
  Eye,
  Sliders,
  HelpCircle,
  Clock,
  Award,
  Layers,
  Layout,
  RefreshCw,
} from 'lucide-react';
import type { AppSettings, MCQThemeConfig, MockTestThemeConfig } from '../../types';
import {
  DEFAULT_MCQ_THEME,
  MCQ_THEME_PRESETS,
  DEFAULT_MOCK_TEST_THEME,
  MOCK_TEST_THEME_PRESETS,
} from '../../config/quizThemes';
import { updateAppSettings } from '../../services/dbService';

interface QuizThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appSettings: AppSettings;
  initialTab?: 'mcq' | 'mocktest';
  onRefreshSettings?: () => void;
}

export const QuizThemeSettingsModal: React.FC<QuizThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  appSettings,
  initialTab = 'mcq',
  onRefreshSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'mcq' | 'mocktest'>(initialTab);

  // Local state for MCQ Theme
  const [mcqTheme, setMcqTheme] = useState<MCQThemeConfig>(
    appSettings.mcqTheme || DEFAULT_MCQ_THEME
  );

  // Local state for Mock Test Theme
  const [mockTheme, setMockTheme] = useState<MockTestThemeConfig>(
    appSettings.mockTestTheme || DEFAULT_MOCK_TEST_THEME
  );

  // Interactive Live Preview State
  const [previewSelectedOption, setPreviewSelectedOption] = useState<number | null>(1);
  const [previewShowAnswer, setPreviewShowAnswer] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleApplyMCQPreset = (preset: typeof MCQ_THEME_PRESETS[0]) => {
    setMcqTheme({ ...preset.theme });
  };

  const handleApplyMockPreset = (preset: typeof MOCK_TEST_THEME_PRESETS[0]) => {
    setMockTheme({ ...preset.theme });
  };

  const handleSaveTheme = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateAppSettings({
        mcqTheme,
        mockTestTheme: mockTheme,
      });
      setSaveSuccess(true);
      if (onRefreshSettings) onRefreshSettings();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert('Error saving theme: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-slate-950 shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base">
                  MCQ & Mock Test Visual Theme Control (A2Z)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Customize colors, borders, NTA palette styles, and live appearance for Student Web.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('mcq')}
            className={`px-5 py-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'mcq'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>1. MCQ Practice Quiz Theme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mocktest')}
            className={`px-5 py-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'mocktest'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>2. Mock Test & NTA Exam Portal Theme</span>
          </button>
        </div>

        {/* Modal Body with 2-Column Layout: Controls on Left, Live Preview on Right */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'mcq' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 Cols): Customization Controls */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1-Click Presets */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>1-Click Theme Presets</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MCQ_THEME_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleApplyMCQPreset(p)}
                        className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          mcqTheme.presetName === p.theme.presetName
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-xs ring-2 ring-indigo-600/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                          style={{ backgroundColor: p.badgeColor }}
                        />
                        <span className="truncate text-[11px]">{p.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Pickers Grid */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <span className="text-xs font-bold text-slate-900 block border-b border-slate-200 pb-2">
                    🎨 Color Palette & Option Styling
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Primary Color */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Primary Accent Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mcqTheme.primaryColor}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, primaryColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mcqTheme.primaryColor}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, primaryColor: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Question Badge Color */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Question Badge Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mcqTheme.questionBadgeColor}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, questionBadgeColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mcqTheme.questionBadgeColor}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, questionBadgeColor: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Selected Option Border */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Selected Option Border
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mcqTheme.selectedOptionBorder}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, selectedOptionBorder: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mcqTheme.selectedOptionBorder}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, selectedOptionBorder: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Correct Option Border */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Correct Answer Border (Green)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mcqTheme.correctOptionBorder}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, correctOptionBorder: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mcqTheme.correctOptionBorder}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, correctOptionBorder: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Wrong Option Border */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Wrong Answer Border (Red)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mcqTheme.wrongOptionBorder}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, wrongOptionBorder: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mcqTheme.wrongOptionBorder}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, wrongOptionBorder: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Action Button Bg */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Submit / Next Button Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mcqTheme.actionButtonBg}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, actionButtonBg: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mcqTheme.actionButtonBg}
                          onChange={(e) =>
                            setMcqTheme({ ...mcqTheme, actionButtonBg: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Typography & Border Radius */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Font Family
                      </label>
                      <select
                        value={mcqTheme.fontFamily}
                        onChange={(e) => setMcqTheme({ ...mcqTheme, fontFamily: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white cursor-pointer"
                      >
                        <option value="Inter, sans-serif">Modern Clean (Inter / Sans)</option>
                        <option value="serif">Academic Classic (Serif / Times)</option>
                        <option value="monospace">Tech Monospace</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Corner Rounding
                      </label>
                      <select
                        value={mcqTheme.borderRadius}
                        onChange={(e) => setMcqTheme({ ...mcqTheme, borderRadius: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white cursor-pointer"
                      >
                        <option value="12px">Subtle (12px)</option>
                        <option value="16px">Standard Rounded (16px)</option>
                        <option value="22px">Extra Soft (22px)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 Cols): Live Interactive Preview */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Live Interactive Student Preview</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewShowAnswer(!previewShowAnswer)}
                    className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    {previewShowAnswer ? 'Hide Solution' : 'Test Show Answer'}
                  </button>
                </div>

                {/* Simulated Student MCQ Card */}
                <div
                  className="p-5 rounded-3xl border shadow-sm space-y-4 transition-all"
                  style={{
                    backgroundColor: mcqTheme.cardBackgroundColor,
                    fontFamily: mcqTheme.fontFamily,
                    borderRadius: mcqTheme.borderRadius,
                    borderColor: '#e2e8f0',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-black text-white shadow-xs"
                      style={{ backgroundColor: mcqTheme.questionBadgeColor }}
                    >
                      Question 1 of 10
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      +2.0 Marks
                    </span>
                  </div>

                  <p
                    className="text-xs font-bold leading-relaxed"
                    style={{ color: mcqTheme.textColor }}
                  >
                    Which Article of the Indian Constitution provides for the Right to Constitutional Remedies?
                  </p>

                  {/* Simulated Options */}
                  <div className="space-y-2">
                    {[
                      { idx: 0, label: 'A', text: 'Article 19 (Freedom of Speech)' },
                      { idx: 1, label: 'B', text: 'Article 32 (Heart and Soul of Constitution)' },
                      { idx: 2, label: 'C', text: 'Article 21 (Right to Life)' },
                      { idx: 3, label: 'D', text: 'Article 44 (Uniform Civil Code)' },
                    ].map((opt) => {
                      const isSelected = previewSelectedOption === opt.idx;
                      const isCorrect = opt.idx === 1;

                      let optBg = '#ffffff';
                      let optBorder = '#e2e8f0';

                      if (previewShowAnswer) {
                        if (isCorrect) {
                          optBg = mcqTheme.correctOptionBg;
                          optBorder = mcqTheme.correctOptionBorder;
                        } else if (isSelected && !isCorrect) {
                          optBg = mcqTheme.wrongOptionBg;
                          optBorder = mcqTheme.wrongOptionBorder;
                        }
                      } else if (isSelected) {
                        optBg = mcqTheme.selectedOptionBg;
                        optBorder = mcqTheme.selectedOptionBorder;
                      }

                      return (
                        <button
                          key={opt.idx}
                          type="button"
                          onClick={() => setPreviewSelectedOption(opt.idx)}
                          className="w-full p-2.5 rounded-2xl border text-left text-xs transition flex items-center gap-2.5 cursor-pointer"
                          style={{
                            backgroundColor: optBg,
                            borderColor: optBorder,
                            borderRadius: mcqTheme.borderRadius,
                          }}
                        >
                          <span
                            className="w-6 h-6 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                            style={{
                              backgroundColor: isSelected ? mcqTheme.primaryColor : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#475569',
                            }}
                          >
                            {opt.label}
                          </span>
                          <span className="font-semibold text-slate-800 text-[11px] truncate">
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Simulated Action Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                      style={{
                        backgroundColor: mcqTheme.actionButtonBg,
                        color: mcqTheme.actionButtonText,
                        borderRadius: mcqTheme.borderRadius,
                      }}
                    >
                      <span>Submit & Next Question ➔</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mocktest' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 Cols): Mock Test Controls */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1-Click Mock Presets */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>1-Click Mock Exam Presets</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {MOCK_TEST_THEME_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleApplyMockPreset(p)}
                        className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          mockTheme.presetName === p.theme.presetName
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-xs ring-2 ring-indigo-600/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                          style={{ backgroundColor: p.badgeColor }}
                        />
                        <span className="truncate text-[11px]">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* NTA Question Status Legend Color Pickers */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <span className="text-xs font-bold text-slate-900 block border-b border-slate-200 pb-2">
                    ⏱️ NTA Exam Palette & Header Colors
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Header Bar Bg */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Header Bar Background
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mockTheme.headerBgColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, headerBgColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mockTheme.headerBgColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, headerBgColor: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Timer Color */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Timer Badge Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mockTheme.timerColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, timerColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mockTheme.timerColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, timerColor: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Answered Color (Green) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Answered Status (Green)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mockTheme.answeredColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, answeredColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mockTheme.answeredColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, answeredColor: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Unanswered Color (Red) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Unanswered Status (Red)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mockTheme.unansweredColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, unansweredColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mockTheme.unansweredColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, unansweredColor: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Marked for Review Color (Purple) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Marked for Review (Purple)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mockTheme.markedForReviewColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, markedForReviewColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mockTheme.markedForReviewColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, markedForReviewColor: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* Submit Test Button Color */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Submit Test Button Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={mockTheme.submitButtonColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, submitButtonColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={mockTheme.submitButtonColor}
                          onChange={(e) =>
                            setMockTheme({ ...mockTheme, submitButtonColor: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 Cols): Mock Test Live Preview */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mock Exam Live Layout Preview</span>
                </span>

                {/* Simulated Mock Test Portal UI */}
                <div className="rounded-3xl border border-slate-200 overflow-hidden shadow-sm bg-white text-xs">
                  {/* Exam Header */}
                  <div
                    className="p-3 text-white flex items-center justify-between"
                    style={{ backgroundColor: mockTheme.headerBgColor }}
                  >
                    <div>
                      <span className="font-extrabold text-[11px] block">
                        UPSC GS Paper-1 Mock
                      </span>
                      <span className="text-[9px] text-slate-300 font-mono">Total: 100 Qs</span>
                    </div>

                    <div
                      className="px-2.5 py-1 rounded-lg text-white font-mono font-black text-xs flex items-center gap-1"
                      style={{ backgroundColor: mockTheme.timerColor }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>29:45</span>
                    </div>
                  </div>

                  {/* NTA Question Palette Grid Simulator */}
                  <div className="p-4 space-y-3 bg-slate-50/50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      NTA Question Palette:
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { q: 1, color: mockTheme.answeredColor, label: 'Ans' },
                        { q: 2, color: mockTheme.answeredColor, label: 'Ans' },
                        { q: 3, color: mockTheme.unansweredColor, label: 'Unans' },
                        { q: 4, color: mockTheme.markedForReviewColor, label: 'Rev' },
                        { q: 5, color: mockTheme.notVisitedColor, label: 'NotVis' },
                      ].map((item) => (
                        <div
                          key={item.q}
                          className="h-8 rounded-lg text-white font-black text-[10px] flex items-center justify-center shadow-xs"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.q}
                        </div>
                      ))}
                    </div>

                    {/* Status Badges Legend */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-slate-200">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: mockTheme.answeredColor }}
                        />
                        Answered (2)
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: mockTheme.unansweredColor }}
                        />
                        Not Answered (1)
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: mockTheme.markedForReviewColor }}
                        />
                        Marked for Review (1)
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: mockTheme.notVisitedColor }}
                        />
                        Not Visited (1)
                      </span>
                    </div>

                    {/* Submit Button Preview */}
                    <button
                      type="button"
                      className="w-full py-2 rounded-xl text-white font-bold text-xs mt-2 shadow-xs"
                      style={{ backgroundColor: mockTheme.submitButtonColor }}
                    >
                      Submit Exam Paper
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setMcqTheme(DEFAULT_MCQ_THEME);
              setMockTheme(DEFAULT_MOCK_TEST_THEME);
            }}
            className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Factory Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTheme}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-indigo-200 transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving Theme...' : saveSuccess ? 'Theme Saved in Firestore!' : 'Apply & Save Theme'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
