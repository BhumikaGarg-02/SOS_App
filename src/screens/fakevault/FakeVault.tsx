import React, { useState, useEffect } from 'react';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/appStore';
import {
  getDecoyNotes,
  saveDecoyNote,
  deleteDecoyNote,
} from '../../lib/db';
import type { DecoyNote } from '../../data/fakeVaultSeed';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Folder,
  Calendar,
  Save,
} from 'lucide-react';

export const FakeVault: React.FC = () => {
  const { t } = useT();
  const setScreen = useAppStore((s) => s.setScreen);

  const [notes, setNotes] = useState<DecoyNote[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<
    'all' | 'shopping' | 'recipes' | 'study' | 'bills'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState<DecoyNote | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const list = await getDecoyNotes();
    setNotes(list);
  };

  const handleBackToCover = () => {
    if (activeNote) {
      setActiveNote(null);
    } else {
      setScreen('cover');
    }
  };

  const handleSaveNote = async () => {
    if (!activeNote) return;
    const updated: DecoyNote = {
      ...activeNote,
      updatedAt: new Date().toISOString(),
    };
    await saveDecoyNote(updated);
    await loadNotes();
    setActiveNote(updated);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteDecoyNote(id);
    await loadNotes();
    if (activeNote?.id === id) {
      setActiveNote(null);
    }
  };

  const handleCreateNew = () => {
    const folder = selectedFolder === 'all' ? 'shopping' : selectedFolder;
    const newNote: DecoyNote = {
      id: 'note-' + Date.now(),
      folder,
      title: '',
      body: '',
      updatedAt: new Date().toISOString(),
    };
    setActiveNote(newNote);
  };

  // Filter notes by folder and search query
  const filteredNotes = notes.filter((n) => {
    const matchesFolder = selectedFolder === 'all' || n.folder === selectedFolder;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const folders = [
    { id: 'all' as const, label: t('allNotes') },
    { id: 'shopping' as const, label: t('folderShopping') },
    { id: 'recipes' as const, label: t('folderRecipes') },
    { id: 'study' as const, label: t('folderStudy') },
    { id: 'bills' as const, label: t('folderBills') },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#FAFAF7] text-[#222222] select-none overflow-hidden relative">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <button
          type="button"
          onClick={handleBackToCover}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-xs font-semibold tap-target"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{activeNote ? t('back') : t('back')}</span>
        </button>

        <h1 className="font-heading font-semibold text-base text-gray-800">
          {t('fakeVaultTitle')}
        </h1>

        {!activeNote ? (
          <button
            type="button"
            onClick={handleCreateNew}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700"
            title={t('newNote')}
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeNote ? (
          <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchNotes')}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Folder Pills Bar */}
            <div className="flex gap-1.5 overflow-x-auto py-1 shrink-0 no-scrollbar">
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFolder(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                    selectedFolder === f.id
                      ? 'bg-gray-800 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Note Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  {t('noNotesFound')}
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => {
                      setActiveNote(note);
                    }}
                    className="p-3.5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 truncate flex-1 pr-2">
                        {note.title || 'Untitled Note'}
                      </h3>
                      <span className="text-[10px] text-gray-400 shrink-0 uppercase tracking-wider flex items-center gap-1 font-mono">
                        <Folder className="w-3 h-3 text-gray-300" />
                        {note.folder}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {note.body || 'No additional content'}
                    </p>

                    <div className="flex items-center gap-1 text-[10px] text-gray-400 pt-1">
                      <Calendar className="w-3 h-3 text-gray-300" />
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Single Note View / Editor */
          <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-white">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">
                {activeNote.folder}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title={t('delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t('save')}</span>
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder={t('noteTitlePlaceholder')}
              value={activeNote.title}
              onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
              className="text-lg font-bold text-gray-900 border-none outline-none mb-3 placeholder-gray-300"
            />

            <textarea
              placeholder={t('noteBodyPlaceholder')}
              value={activeNote.body}
              onChange={(e) => setActiveNote({ ...activeNote, body: e.target.value })}
              className="flex-1 w-full text-xs text-gray-700 leading-relaxed border-none outline-none resize-none placeholder-gray-300"
            />
          </div>
        )}
      </div>
    </div>
  );
};
