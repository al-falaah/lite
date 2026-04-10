import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, Plus, Trash2, Save, Eye, EyeOff, ChevronLeft,
  GripVertical, Highlighter, X, Pencil, RefreshCw
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';
import { segmentHighlights, DECK_EMOJIS } from '../../utils/drillHelpers';
import { PROGRAM_IDS } from '../../config/programs';

const PROGRAMS_LIST = [
  { id: 'qari', label: 'QARI' },
  { id: 'tajweed', label: 'TMP – Tajweed' },
  { id: 'essentials', label: 'EASI – Essentials' },
];

// ─── Main Manager ────────────────────────────────────────
export default function DrillManager() {
  const navigate = useNavigate();
  const [view, setView] = useState('list');      // list | deck | card
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDeck, setActiveDeck] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [cards, setCards] = useState([]);
  const [filterProgram, setFilterProgram] = useState('all');

  useEffect(() => { fetchDecks(); }, []);

  const fetchDecks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('drill_decks')
      .select('*, drill_cards(count)')
      .order('updated_at', { ascending: false });
    if (error) toast.error('Failed to load decks');
    else setDecks(data || []);
    setLoading(false);
  };

  const openDeck = async (deck) => {
    setActiveDeck(deck);
    setView('deck');
    const { data } = await supabase
      .from('drill_cards')
      .select('*')
      .eq('deck_id', deck.id)
      .order('sort_order');
    setCards(data || []);
  };

  const createDeck = async () => {
    const { data, error } = await supabase
      .from('drill_decks')
      .insert({ title: 'Untitled Deck', program: 'tajweed', topic: 'General', cover_emoji: '📖' })
      .select()
      .single();
    if (error) { toast.error('Failed to create deck'); return; }
    toast.success('Deck created');
    await fetchDecks();
    openDeck(data);
  };

  const togglePublish = async (deck) => {
    const { error } = await supabase
      .from('drill_decks')
      .update({ is_published: !deck.is_published, updated_at: new Date().toISOString() })
      .eq('id', deck.id);
    if (error) toast.error('Failed to update');
    else {
      toast.success(deck.is_published ? 'Unpublished' : 'Published!');
      fetchDecks();
      if (activeDeck?.id === deck.id) setActiveDeck({ ...deck, is_published: !deck.is_published });
    }
  };

  const deleteDeck = async (deckId) => {
    if (!confirm('Delete this deck and all its cards?')) return;
    const { error } = await supabase.from('drill_decks').delete().eq('id', deckId);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); setView('list'); fetchDecks(); }
  };

  const filteredDecks = filterProgram === 'all'
    ? decks
    : decks.filter(d => d.program === filterProgram);

  // ─── LIST VIEW ─────────────────────────────────────────
  if (view === 'list') return (
    <>
      <Helmet><title>Drill Manager | The FastTrack Madrasah</title></Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="text-base font-semibold text-gray-900">Drill Manager</h1>
            </div>
            <button
              onClick={createDeck}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
            >
              <Plus className="h-3.5 w-3.5" /> New Deck
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {/* Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[{ id: 'all', label: 'All' }, ...PROGRAMS_LIST].map(p => (
              <button
                key={p.id}
                onClick={() => setFilterProgram(p.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  filterProgram === p.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><RefreshCw className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : filteredDecks.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">🎯</p>
              <p className="text-sm">No decks yet. Create your first drill deck!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredDecks.map(deck => (
                <div
                  key={deck.id}
                  onClick={() => openDeck(deck)}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors group"
                >
                  <span className="text-2xl">{deck.cover_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{deck.title}</p>
                      {deck.is_published ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full">LIVE</span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded-full">DRAFT</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {PROGRAMS_LIST.find(p => p.id === deck.program)?.label || deck.program} · {deck.topic} · {deck.drill_cards?.[0]?.count || 0} cards
                    </p>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-gray-300 rotate-180 group-hover:text-gray-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  // ─── DECK DETAIL VIEW ─────────────────────────────────
  if (view === 'deck') return (
    <DeckDetail
      deck={activeDeck}
      cards={cards}
      setCards={setCards}
      onBack={() => { setView('list'); fetchDecks(); }}
      onEditCard={(card) => { setActiveCard(card); setView('card'); }}
      onNewCard={() => { setActiveCard(null); setView('card'); }}
      onTogglePublish={() => togglePublish(activeDeck)}
      onDeleteDeck={() => deleteDeck(activeDeck.id)}
      onUpdateDeck={(updated) => setActiveDeck(updated)}
    />
  );

  // ─── CARD EDITOR VIEW ─────────────────────────────────
  if (view === 'card') return (
    <CardEditor
      deckId={activeDeck.id}
      card={activeCard}
      onSaved={() => { setView('deck'); openDeck(activeDeck); }}
      onCancel={() => setView('deck')}
    />
  );
}

// ─── Deck Detail ────────────────────────────────────────
function DeckDetail({ deck, cards, setCards, onBack, onEditCard, onNewCard, onTogglePublish, onDeleteDeck, onUpdateDeck }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: deck.title,
    description: deck.description || '',
    program: deck.program,
    topic: deck.topic,
    cover_emoji: deck.cover_emoji || '📖',
  });

  const saveMeta = async () => {
    const { data, error } = await supabase
      .from('drill_decks')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', deck.id)
      .select()
      .single();
    if (error) toast.error('Failed to save');
    else { toast.success('Saved'); onUpdateDeck(data); setEditing(false); }
  };

  const deleteCard = async (cardId) => {
    if (!confirm('Delete this card?')) return;
    const { error } = await supabase.from('drill_cards').delete().eq('id', cardId);
    if (error) toast.error('Failed to delete');
    else { toast.success('Card deleted'); setCards(cards.filter(c => c.id !== cardId)); }
  };

  return (
    <>
      <Helmet><title>{deck.title} | Drill Manager</title></Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="text-xl">{deck.cover_emoji}</span>
              <h1 className="text-base font-semibold text-gray-900">{deck.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePublish}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  deck.is_published ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {deck.is_published ? <><EyeOff className="h-3 w-3" /> Unpublish</> : <><Eye className="h-3 w-3" /> Publish</>}
              </button>
              <button onClick={onDeleteDeck} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Deck Metadata */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Deck Details</h3>
              {!editing && (
                <button onClick={() => setEditing(true)} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Topic</label>
                    <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="e.g. Noon Sakinah, Arabic Grammar" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
                    <select value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                      {PROGRAMS_LIST.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cover Emoji</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DECK_EMOJIS.map(e => (
                        <button key={e} onClick={() => setForm({ ...form, cover_emoji: e })}
                          className={`w-8 h-8 rounded text-lg flex items-center justify-center ${form.cover_emoji === e ? 'bg-gray-900 ring-2 ring-gray-900 ring-offset-1' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveMeta} className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800">
                    <Save className="h-3 w-3 inline mr-1" /> Save
                  </button>
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 space-y-1">
                <p><span className="font-medium text-gray-700">Program:</span> {PROGRAMS_LIST.find(p => p.id === deck.program)?.label}</p>
                <p><span className="font-medium text-gray-700">Topic:</span> {deck.topic}</p>
                {deck.description && <p><span className="font-medium text-gray-700">Description:</span> {deck.description}</p>}
              </div>
            )}
          </div>

          {/* Cards List */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Cards ({cards.length})</h3>
              <button onClick={onNewCard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800">
                <Plus className="h-3 w-3" /> Add Card
              </button>
            </div>

            {cards.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No cards yet. Add your first question!</p>
            ) : (
              <div className="space-y-2">
                {cards.map((card, i) => (
                  <div key={card.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 group">
                    <span className="text-xs text-gray-400 mt-1 font-mono w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      {card.arabic_text && (
                        <p className="text-base font-arabic text-gray-800 mb-1" dir="rtl">
                          {segmentHighlights(card.arabic_text, card.highlight_ranges).map((seg, j) =>
                            seg.highlighted
                              ? <span key={j} className="bg-amber-200 text-amber-900 px-0.5 rounded">{seg.text}</span>
                              : <span key={j}>{seg.text}</span>
                          )}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 truncate">{card.question}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {card.question_type === 'true_false' ? 'True/False' : `${card.options?.length || 0} options`} · {card.points} pts
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEditCard(card)} className="p-1.5 hover:bg-gray-100 rounded">
                        <Pencil className="h-3 w-3 text-gray-500" />
                      </button>
                      <button onClick={() => deleteCard(card.id)} className="p-1.5 hover:bg-red-50 rounded">
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Card Editor (with Arabic Highlight Tool) ────────────
function CardEditor({ deckId, card, onSaved, onCancel }) {
  const isEdit = !!card;
  const textRef = useRef(null);

  const [form, setForm] = useState({
    question_type: card?.question_type || 'multiple_choice',
    arabic_text: card?.arabic_text || '',
    highlight_ranges: card?.highlight_ranges || [],
    question: card?.question || '',
    options: card?.options || ['', '', '', ''],
    correct_index: card?.correct_index ?? 0,
    explanation: card?.explanation || '',
    hint: card?.hint || '',
    points: card?.points ?? 10,
    sort_order: card?.sort_order ?? 0,
  });

  const [saving, setSaving] = useState(false);

  const handleTypeChange = (type) => {
    if (type === 'true_false') {
      setForm({ ...form, question_type: type, options: ['True', 'False'], correct_index: 0 });
    } else {
      setForm({ ...form, question_type: type, options: ['', '', '', ''], correct_index: 0 });
    }
  };

  // ── Highlight tool ───────────────────────────────────
  const handleHighlight = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
      toast.error('Select some Arabic text first');
      return;
    }
    const container = textRef.current;
    if (!container || !container.contains(selection.anchorNode)) {
      toast.error('Select text from the preview area');
      return;
    }
    const range = selection.getRangeAt(0);
    // Calculate offset relative to the container's text content
    const preRange = document.createRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const end = start + range.toString().length;

    if (end <= start) return;
    setForm(prev => ({ ...prev, highlight_ranges: [...prev.highlight_ranges, { start, end }] }));
    selection.removeAllRanges();
  };

  const clearHighlights = () => setForm(prev => ({ ...prev, highlight_ranges: [] }));

  // ── Save ─────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.question.trim()) { toast.error('Question is required'); return; }
    if (form.question_type === 'multiple_choice' && form.options.some(o => !o.trim())) {
      toast.error('All options must be filled'); return;
    }
    setSaving(true);
    const payload = {
      deck_id: deckId,
      question_type: form.question_type,
      arabic_text: form.arabic_text || null,
      highlight_ranges: form.highlight_ranges,
      question: form.question,
      options: form.options,
      correct_index: form.correct_index,
      explanation: form.explanation || null,
      hint: form.hint || null,
      points: parseInt(form.points, 10) || 10,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };
    let error;
    if (isEdit) {
      ({ error } = await supabase.from('drill_cards').update(payload).eq('id', card.id));
    } else {
      ({ error } = await supabase.from('drill_cards').insert(payload));
    }
    setSaving(false);
    if (error) { toast.error('Failed to save'); console.error(error); }
    else { toast.success(isEdit ? 'Card updated' : 'Card added'); onSaved(); }
  };

  return (
    <>
      <Helmet><title>{isEdit ? 'Edit Card' : 'New Card'} | Drill Manager</title></Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Card' : 'New Card'}</h1>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-400">
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Question Type */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-600 mb-2">Question Type</label>
            <div className="flex gap-2">
              {[{ v: 'multiple_choice', l: 'Multiple Choice' }, { v: 'true_false', l: 'True / False' }].map(t => (
                <button key={t.v} onClick={() => handleTypeChange(t.v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    form.question_type === t.v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          {/* Arabic Text + Highlight */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-600 mb-1">Arabic Text (optional)</label>
            <p className="text-xs text-gray-400 mb-2">Paste a verse or phrase, then select text in the preview to highlight it.</p>
            <textarea
              value={form.arabic_text}
              onChange={e => setForm({ ...form, arabic_text: e.target.value, highlight_ranges: [] })}
              rows={2}
              dir="rtl"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg font-arabic focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ"
            />

            {form.arabic_text && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Preview — select text below, then click Highlight</span>
                  <div className="flex gap-1.5">
                    <button onClick={handleHighlight}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded hover:bg-amber-200">
                      <Highlighter className="h-3 w-3" /> Highlight
                    </button>
                    {form.highlight_ranges.length > 0 && (
                      <button onClick={clearHighlights}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded hover:bg-gray-200">
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>
                <p ref={textRef} dir="rtl" className="text-2xl leading-loose font-arabic text-gray-800 select-text cursor-text">
                  {segmentHighlights(form.arabic_text, form.highlight_ranges).map((seg, j) =>
                    seg.highlighted
                      ? <span key={j} className="bg-amber-200 text-amber-900 px-0.5 rounded">{seg.text}</span>
                      : <span key={j}>{seg.text}</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Question */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
            <textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="What Tajweed rule applies to the highlighted letters?" />
          </div>

          {/* Options */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              {form.question_type === 'true_false' ? 'Correct Answer' : 'Options'} — tap the correct one
            </label>

            {form.question_type === 'true_false' ? (
              <div className="flex gap-3">
                {['True', 'False'].map((opt, i) => (
                  <button key={i} onClick={() => setForm({ ...form, correct_index: i })}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium border-2 transition-all ${
                      form.correct_index === i ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {form.correct_index === i && '✓ '}{opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <button onClick={() => setForm({ ...form, correct_index: i })}
                      className={`w-7 h-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                        form.correct_index === i ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 text-gray-400 hover:border-gray-400'
                      }`}>
                      {form.correct_index === i ? '✓' : String.fromCharCode(65 + i)}
                    </button>
                    <input
                      value={opt}
                      onChange={e => {
                        const newOpts = [...form.options];
                        newOpts[i] = e.target.value;
                        setForm({ ...form, options: newOpts });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    />
                    {form.options.length > 2 && (
                      <button onClick={() => {
                        const newOpts = form.options.filter((_, j) => j !== i);
                        const newCorrect = form.correct_index >= newOpts.length ? 0 : form.correct_index > i ? form.correct_index - 1 : form.correct_index;
                        setForm({ ...form, options: newOpts, correct_index: newCorrect });
                      }} className="p-1 text-gray-400 hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {form.options.length < 6 && (
                  <button onClick={() => setForm({ ...form, options: [...form.options, ''] })}
                    className="text-xs text-gray-500 hover:text-gray-700 mt-1">
                    + Add option
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Explanation + Hint + Points */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Explanation (shown after answering)</label>
              <textarea value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })}
                rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="When Noon Sakinah is followed by Ba, the rule of Iqlaab applies…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hint (costs half XP)</label>
                <input value={form.hint} onChange={e => setForm({ ...form, hint: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Look at the letter after the Noon" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Points</label>
                <input type="number" min="1" max="50" value={form.points}
                  onChange={e => setForm({ ...form, points: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
