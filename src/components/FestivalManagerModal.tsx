import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CalendarHeart,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Store,
} from 'lucide-react';
import { FestivalEvent, FestivalEventType, FestivalSalesImpact } from '../types';
import { fetchFestivals, createFestival, deleteFestival } from '../utils/festivalEngine';

interface FestivalManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFestivalsUpdated?: () => void;
}

const EVENT_TYPES: { value: FestivalEventType; label: string; icon: string }[] = [
  { value: 'festival', label: 'Festival', icon: '🎉' },
  { value: 'exhibition', label: 'Exhibition', icon: '🏛' },
  { value: 'seasonal', label: 'Seasonal', icon: '🌤' },
  { value: 'promotion', label: 'Promotion', icon: '🏷' },
];

const IMPACT_LEVELS: { value: FestivalSalesImpact; label: string; color: string }[] = [
  { value: 'high', label: 'High Impact', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { value: 'medium', label: 'Medium Impact', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { value: 'low', label: 'Low Impact', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
];

export const FestivalManagerModal: React.FC<FestivalManagerModalProps> = ({
  isOpen,
  onClose,
  onFestivalsUpdated,
}) => {
  const [festivals, setFestivals] = useState<FestivalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    eventType: 'festival' as FestivalEventType,
    startDate: '',
    endDate: '',
    description: '',
    salesImpact: 'high' as FestivalSalesImpact,
    affectedBranches: '',
  });

  const loadFestivals = useCallback(async () => {
    setLoading(true);
    setError('');
    const data = await fetchFestivals();
    setFestivals(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) loadFestivals();
  }, [isOpen, loadFestivals]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      name: '',
      eventType: 'festival',
      startDate: '',
      endDate: '',
      description: '',
      salesImpact: 'high',
      affectedBranches: '',
    });
    setShowForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      setError('Festival name, start date, and end date are required.');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date cannot be before start date.');
      return;
    }

    const branches = formData.affectedBranches
      .split(',')
      .map((b) => b.trim().toUpperCase())
      .filter(Boolean);

    setLoading(true);
    const created = await createFestival({
      name: formData.name.trim(),
      eventType: formData.eventType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description.trim() || undefined,
      salesImpact: formData.salesImpact,
      affectedBranches: branches.length > 0 ? branches : null,
    });
    setLoading(false);

    if (created) {
      setSuccess(`"${created.name}" has been added to the festival calendar.`);
      resetForm();
      await loadFestivals();
      onFestivalsUpdated?.();
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError('Failed to save festival. Please check your connection and try again.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from the festival calendar?`)) return;
    const ok = await deleteFestival(id);
    if (ok) {
      await loadFestivals();
      onFestivalsUpdated?.();
    } else {
      setError('Failed to delete festival event.');
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return start === end ? fmt(start) : `${fmt(start)} - ${fmt(end)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <CalendarHeart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Festival &amp; Event Calendar</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-mono">
                  Sales Adjuster
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mark festival and exhibition periods so average sales exclude inflated months
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Explanation banner */}
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/80 leading-relaxed">
                When you mark a month as a festival period, the analysis engine separates
                the high sales of that month from your normal average. For example, if Eid
                caused March sales to spike, March is treated as <strong>festival sales</strong> and
                your <strong>normal monthly average</strong> is calculated from the remaining months only.
                This gives you a realistic baseline for stock redistribution.
              </div>
            </div>
          </div>

          {/* Add Festival Button / Form */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500/40 hover:bg-amber-500/5 text-slate-400 hover:text-amber-300 text-sm font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Festival or Exhibition Period</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="rounded-xl bg-slate-950/60 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">New Event Entry</h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Event Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Eid ul Fitr, Durga Puja, Winter Exhibition"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40"
                />
              </div>

              {/* Type + Impact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Event Type</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value as FestivalEventType })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Sales Impact</label>
                  <select
                    value={formData.salesImpact}
                    onChange={(e) => setFormData({ ...formData, salesImpact: e.target.value as FestivalSalesImpact })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    {IMPACT_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>

              {/* Affected Branches */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  Affected Branches <span className="text-slate-500 font-normal">(comma-separated codes, leave empty for all)</span>
                </label>
                <input
                  type="text"
                  value={formData.affectedBranches}
                  onChange={(e) => setFormData({ ...formData, affectedBranches: e.target.value })}
                  placeholder="e.g. BCT, GUL, CTG (or leave empty for all branches)"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Notes <span className="text-slate-500 font-normal">(optional)</span></label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Any details about this event..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Save Event</span>
              </button>
            </form>
          )}

          {/* Error / Success */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Festival List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Saved Events ({festivals.length})
            </h3>

            {loading && festivals.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
              </div>
            ) : festivals.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                <CalendarHeart className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>No festival events saved yet.</p>
                <p className="text-xs mt-1">Add one above to start tracking festival sales separately.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {festivals.map((f) => {
                  const typeMeta = EVENT_TYPES.find((t) => t.value === f.eventType);
                  const impactMeta = IMPACT_LEVELS.find((l) => l.value === f.salesImpact);
                  return (
                    <div
                      key={f.id}
                      className="rounded-xl bg-slate-950/40 border border-slate-800 p-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base">{typeMeta?.icon}</span>
                            <h4 className="text-sm font-bold text-white truncate">{f.name}</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${impactMeta?.color}`}>
                              {impactMeta?.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateRange(f.startDate, f.endDate)}
                            </span>
                            {f.affectedBranches && f.affectedBranches.length > 0 ? (
                              <span className="flex items-center gap-1">
                                <Store className="w-3 h-3" />
                                {f.affectedBranches.join(', ')}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                All branches
                              </span>
                            )}
                          </div>
                          {f.description && (
                            <p className="text-xs text-slate-500 mt-2">{f.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(f.id, f.name)}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                          title="Delete event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
