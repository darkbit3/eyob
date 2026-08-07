import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import AuctionCard from '../../components/AuctionCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const STATUS_OPTS = ['all', 'active', 'upcoming', 'closed'] as const;
type StatusOpt = typeof STATUS_OPTS[number];

export default function AuctionList() {
  const { auctions } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOpt>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(auctions.map(a => a.category)))];

  const filtered = auctions.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch = a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCat;
  });

  return (
    <div className="space-y-5 font-sans">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Explore Auctions</h1>
        <p className="text-slate-500 text-xs font-medium mt-1">
          {filtered.length} auction{filtered.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* ── FILTER BAR ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search auctions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 pr-10 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status pills — scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {STATUS_OPTS.map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? st === 'active' ? 'bg-emerald-500 text-white shadow-sm'
                  : st === 'upcoming' ? 'bg-blue-500 text-white shadow-sm'
                  : st === 'closed' ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'active' && '🔴 '}
              {st === 'upcoming' && '🔵 '}
              {st === 'closed' && '✓ '}
              {st === 'all' && '◈ '}
              {st}
            </button>
          ))}
        </div>

        {/* Categories — scrollable chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 pt-1 border-t border-slate-100" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESULTS ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3 shadow-sm">
          <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No auctions matched</h3>
          <p className="text-sm text-slate-500">Try clearing your filters or search term.</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setSelectedCategory('all'); }}
            className="btn-primary text-xs py-2 px-4 mt-2"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
