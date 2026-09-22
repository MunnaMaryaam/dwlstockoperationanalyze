import React, { useMemo, useState, useEffect } from 'react';
import { RedistributionReport, SalesTimeframe, AllocationMode } from '../types';
import { getOptionAllocationSummary } from '../utils/redistributionEngine';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Download,
  Filter,
  Home,
  Package,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Warehouse,
  XCircle,
} from 'lucide-react';

interface OptionWiseAllocationViewProps {
  report: RedistributionReport;
  selectedWeight?: string;
  selectedTimeframe?: SalesTimeframe;
  onTimeframeChange?: (tf: SalesTimeframe) => void;
  allocationMode?: AllocationMode;
  onAllocationModeChange?: (mode: AllocationMode) => void;
  onSelectBranch?: (branch: string) => void;
  onSelectWeight?: (weight: string) => void;
  onBackToHome?: () => void;
}

const fmt = (n: number, digits = 0) => Number(n || 0).toLocaleString(undefined, {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

/** Format Net_Move as "+9" / "-21" / "0" per Excel output rules */
const fmtNetMove = (netMove: number): string => {
  const n = Math.round(netMove);
  if (n > 0) return `+${n}`;
  if (n < 0) return `${n}`;
  return '0';
};

export const OptionWiseAllocationView: React.FC<OptionWiseAllocationViewProps> = ({
  report,
  selectedWeight: initialWeight = '',
  selectedTimeframe: globalTimeframe = '3M',
  onTimeframeChange,
  allocationMode: globalMode = 'contribution',
  onAllocationModeChange,
  onSelectBranch,
  onSelectWeight,
  onBackToHome,
}) => {
  const items = report.matrix.weights;
  const [activeItem, setActiveItem] = useState(initialWeight && items.includes(initialWeight) ? initialWeight : items[0] || '');
  // Use global Sales Period + Allocation Mode so header and this view stay in sync
  const timeframe = globalTimeframe;
  const setTimeframe = (tf: SalesTimeframe) => {
    onTimeframeChange?.(tf);
  };
  const allocationMode = globalMode;
  const setAllocationMode = (m: AllocationMode) => {
    onAllocationModeChange?.(m);
  };
  const [growthMultiplier, setGrowthMultiplier] = useState(1);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERSTOCK' | 'LESS_STOCK' | 'BALANCED' | 'WAREHOUSE'>('ALL');

  // When new data is imported, report.matrix.weights changes — keep activeItem in sync
  // so allocation analysis never shows empty / stale item results.
  useEffect(() => {
    if (items.length === 0) {
      setActiveItem('');
      return;
    }
    if (initialWeight && items.includes(initialWeight)) {
      setActiveItem(initialWeight);
    } else if (!items.includes(activeItem)) {
      setActiveItem(items[0]);
    }
  }, [items.join('|'), initialWeight, report.period]);

  const allocation = useMemo(() => {
    return getOptionAllocationSummary(report, activeItem, timeframe, growthMultiplier, allocationMode);
  }, [report, activeItem, timeframe, growthMultiplier, allocationMode]);

  const itemLabel = report.categoryConfig?.itemLabel || 'Item / SKU / Variant';
  const itemUnit = report.categoryConfig?.itemUnit || 'pcs';

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allocation.rows.filter(row => {
      const qMatch = !q || row.branch.toLowerCase().includes(q);
      const sMatch = statusFilter === 'ALL' || row.status === statusFilter;
      return qMatch && sMatch;
    });
  }, [allocation.rows, query, statusFilter]);

  const statusCounts = useMemo(() => allocation.rows.reduce((acc, row) => {
    acc[row.status] += 1;
    return acc;
  }, { OVERSTOCK: 0, LESS_STOCK: 0, BALANCED: 0, WAREHOUSE: 0 } as Record<'OVERSTOCK' | 'LESS_STOCK' | 'BALANCED' | 'WAREHOUSE', number>), [allocation.rows]);

  const changeItem = (value: string) => {
    setActiveItem(value);
    onSelectWeight?.(value);
  };

  const exportCsv = () => {
    const headers = [
      'Branch', 'Current Stock', 'Sold Qty (3M)', 'Sales Avg / Month', 'Sales Contribution %',
      'Contribution Deserve Qty', 'Safety Floor Qty', 'Cap Qty', 'Final Deserve Qty',
      'Variance', 'Status', 'Flag', 'Scaled Factor', 'Action', 'Action Qty', 'Rationale'
    ];
    const rows = allocation.rows.map(r => [
      r.branch, r.currentStock, r.sales3M, r.salesAvgMonthly, `${r.salesContributionPct}%`,
      r.contributionDeserveQty, r.safetyFloorQty, r.capQty ?? '', r.deservedStock,
      r.variance, r.status, r.statusFlag, r.scaledFactor, r.action, r.actionQty,
      `"${r.rationale.replaceAll('"', '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Universal_Allocation_${activeItem || 'item'}_${timeframe}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4" id="prd-allocation-workspace">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-[#17395c] text-white">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                PRD Allocation Engine
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Dynamic Inventory Redistribution</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-300">
                Universal item-level analysis using live enterprise stock, 3-month velocity, sales contribution, safety protection and fair low-velocity allocation.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {onBackToHome && (
                <button onClick={onBackToHome} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-slate-800">
                  <Home className="w-4 h-4" /> Home
                </button>
              )}
              <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100">
                <Download className="w-4 h-4" /> Export Allocation
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 space-y-3">
          {/* 3 Distribution Mode Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Distribution Mode:</span>
            {([
              { id: 'contribution' as AllocationMode, label: '① Sales Contribution', desc: 'Total stock (DWL+all) × sales %' },
              { id: 'baseline' as AllocationMode, label: '② 3M Baseline', desc: 'Avg×3 + scale + 20% bonus' },
              { id: 'hybrid' as AllocationMode, label: '③ Hybrid', desc: 'max(contribution, baseline)' }
            ]).map(m => (
              <button
                key={m.id}
                type="button"
                title={m.desc}
                onClick={() => setAllocationMode(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  allocationMode === m.id
                    ? 'bg-[#17395c] text-white border-[#17395c] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-[#17395c] hover:text-[#17395c]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr_auto] gap-3">
            <label className="relative block">
              <span className="sr-only">Select item</span>
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={activeItem} onChange={e => changeItem(e.target.value)} className="w-full appearance-none rounded-lg border border-slate-300 bg-white pl-9 pr-8 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#17395c]">
                {items.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            <div className="flex rounded-lg border border-slate-300 bg-white p-1">
              {(['1M', '3M', '6M', '9M', '1Y'] as SalesTimeframe[]).map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)} className={`flex-1 rounded-md px-3 py-2 text-xs font-bold ${timeframe === tf ? 'bg-[#17395c] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {tf}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-600">Growth</span>
              <select value={growthMultiplier} onChange={e => setGrowthMultiplier(Number(e.target.value))} className="bg-transparent text-sm font-bold text-slate-900 outline-none">
                <option value={1}>1.0× Base</option>
                <option value={1.25}>1.25× Growth</option>
                <option value={1.5}>1.5× Push</option>
                <option value={2}>2.0× Aggressive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-2 xl:grid-cols-5 gap-3">
          <Metric label="Total Item Stock (DWL+All)" value={`${fmt(allocation.totalCompanyStock)} ${itemUnit}`} icon={<Warehouse className="w-4 h-4" />} />
          <Metric label="DWL Warehouse Stock" value={`${fmt(allocation.warehouseStock || 0)} ${itemUnit}`} icon={<Building2 className="w-4 h-4" />} />
          <Metric label={`${timeframe} Sales (Retail)`} value={fmt(allocation.totalSoldPeriod)} icon={<TrendingUp className="w-4 h-4" />} />
          <Metric label="Compression Factor" value={`${allocation.scaledCompressionFactor.toFixed(3)}×`} icon={<Filter className="w-4 h-4" />} />
          <Metric label="Protected Reserve" value={`${fmt(allocation.protectedReserve)} ${itemUnit}`} icon={<ShieldCheck className="w-4 h-4" />} />        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusCard label="⚠️ Overstock" count={statusCounts.OVERSTOCK} active={statusFilter === 'OVERSTOCK'} onClick={() => setStatusFilter(statusFilter === 'OVERSTOCK' ? 'ALL' : 'OVERSTOCK')} />
        <StatusCard label="📉 Less Stock" count={statusCounts.LESS_STOCK} active={statusFilter === 'LESS_STOCK'} onClick={() => setStatusFilter(statusFilter === 'LESS_STOCK' ? 'ALL' : 'LESS_STOCK')} />
        <StatusCard label="✓ Balanced" count={statusCounts.BALANCED} active={statusFilter === 'BALANCED'} onClick={() => setStatusFilter(statusFilter === 'BALANCED' ? 'ALL' : 'BALANCED')} />
        <StatusCard label="🏢 Warehouse" count={statusCounts.WAREHOUSE} active={statusFilter === 'WAREHOUSE'} onClick={() => setStatusFilter(statusFilter === 'WAREHOUSE' ? 'ALL' : 'WAREHOUSE')} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Have vs Deserve Matrix</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live branch stock against the PRD-derived final deserve quantity.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search branch" className="w-56 rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#17395c]" />
            </div>
            {(query || statusFilter !== 'ALL') && (
              <button onClick={() => { setQuery(''); setStatusFilter('ALL'); }} className="p-2 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50" title="Clear filters">
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1220px] w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left sticky left-0 bg-slate-50">Branch</th>
                <th className="px-3 py-3 text-right">Sold (Period)</th>
                <th className="px-3 py-3 text-right">Avg / Mo</th>
                <th className="px-3 py-3 text-right">Baseline (3M)</th>
                <th className="px-3 py-3 text-right">Scale Factor</th>
                <th className="px-3 py-3 text-right">Current Stock</th>
                <th className="px-3 py-3 text-right">Final Demand</th>
                <th className="px-3 py-3 text-right">Net Move</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map(row => (
                <tr key={row.branch} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 sticky left-0 bg-white font-bold text-slate-900">
                    <button onClick={() => onSelectBranch?.(row.branch)} className="text-left hover:text-[#17395c]">{row.branch}</button>
                    <div className="text-[10px] font-normal text-slate-400 mt-0.5 max-w-[220px] truncate">{row.rationale}</div>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">{fmt(row.salesPeriod)}</td>
                  <td className="px-3 py-3 text-right text-slate-600">{fmt(row.salesAvgMonthly, 1)}</td>
                  <td className="px-3 py-3 text-right">{fmt(row.contributionDeserveQty)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-700">{row.scaledFactor.toFixed(3)}×</td>
                  <td className="px-3 py-3 text-right font-bold">{fmt(row.currentStock)}</td>
                  <td className="px-3 py-3 text-right font-bold text-[#17395c]">{fmt(row.deservedStock)}</td>
                  <td className={`px-3 py-3 text-right font-bold font-mono ${row.action === 'SEND' ? 'text-rose-700' : row.action === 'WITHDRAW' ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {fmtNetMove(row.deservedStock - row.currentStock)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${row.status === 'OVERSTOCK' ? 'bg-amber-50 text-amber-700' : row.status === 'LESS_STOCK' ? 'bg-rose-50 text-rose-700' : row.status === 'WAREHOUSE' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      <span>{row.statusFlag}</span>{row.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {row.action === 'WITHDRAW' && <span className="inline-flex items-center gap-1 text-amber-700 font-bold"><ArrowUpFromLine className="w-4 h-4" /> OUT {fmtNetMove(-(row.actionQty))}</span>}
                    {row.action === 'SEND' && <span className="inline-flex items-center gap-1 text-rose-700 font-bold"><ArrowDownToLine className="w-4 h-4" /> IN {fmtNetMove(row.actionQty)}</span>}
                    {row.action === 'BALANCED' && <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 className="w-4 h-4" /> 0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRows.length === 0 && (
          <div className="px-6 py-14 text-center text-sm text-slate-500">No branches match the current filter.</div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="w-5 h-5 text-[#17395c]" />
            <div>
              <h3 className="font-bold text-slate-900">Recommended Transfer Queue</h3>
              <p className="text-xs text-slate-500">Branch surplus is paired with branch deficit before new buying.</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {allocation.transferPairs.length === 0 && <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No transfer is required under the current item and stock scenario.</div>}
            {allocation.transferPairs.map((pair, idx) => (
              <div key={`${pair.fromBranch}-${pair.toBranch}-${idx}`} className="rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{pair.fromBranch} <span className="text-slate-400">→</span> {pair.toBranch}</div>
                  <div className="text-xs text-slate-500 mt-1">{pair.reason}</div>
                </div>
                <div className="shrink-0 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm font-bold">{fmt(pair.qty)} {itemUnit}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-slate-900">Engine Rules Applied</h3>
              <p className="text-xs text-slate-500">Transparent calculation summary for management review.</p>
            </div>
          </div>
          <div className="grid gap-2 text-xs text-slate-600">
            <Rule number="01" title="DWL = Warehouse" text={`DWL branch is central warehouse stock. Total item pool = all showrooms + DWL (${fmt(allocation.totalCompanyStock)} pcs).`} />
            <Rule number="02" title="① Sales Contribution" text={`Deserve = Total Company Stock × (Branch Sales ÷ Total Retail Sales). DWL stock is in the pool to distribute.`} />
            <Rule number="03" title="② 3M Baseline" text={`Baseline = Avg Monthly Sales × 3. Scale = Total Stock ÷ Σ Baseline. Surplus + already at baseline → +20% bonus.`} />
            <Rule number="04" title="③ Hybrid" text={`Final = max(Contribution Deserve, 3M Baseline), then fair-compress if sum exceeds live stock.`} />
            <Rule number="05" title="Net Move" text={`Net Move = Final Demand − Current Stock → +N Move IN, −N Move OUT, 0 Balanced. Active mode: ${allocationMode}.`} />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-950 text-slate-200 px-4 py-3 text-xs flex flex-wrap items-center gap-x-6 gap-y-2">
        <span><strong className="text-white">{itemLabel}:</strong> {activeItem || '—'}</span>
        <span><strong className="text-white">Analysis:</strong> {timeframe}</span>
        <span><strong className="text-white">Warehouse distributable:</strong> {fmt(allocation.distributableWarehouseStock)} {itemUnit}</span>
        <span><strong className="text-white">Reserve protected:</strong> {fmt(allocation.protectedReserve)} {itemUnit}</span>
      </div>
    </section>
  );
};

const Metric: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase tracking-wide">{icon}{label}</div>
    <div className="mt-2 text-lg font-bold text-slate-900">{value}</div>
  </div>
);

const StatusCard: React.FC<{ label: string; count: number; active: boolean; onClick: () => void }> = ({ label, count, active, onClick }) => (
  <button onClick={onClick} className={`rounded-xl border p-4 text-left transition-all ${active ? 'border-[#17395c] bg-[#eef4f9] shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
    <div className="text-xs font-bold text-slate-500">{label}</div>
    <div className="mt-1 text-2xl font-bold text-slate-900">{fmt(count)}</div>
  </button>
);

const Rule: React.FC<{ number: string; title: string; text: string }> = ({ number, title, text }) => (
  <div className="flex gap-3 rounded-lg border border-slate-200 p-3">
    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">{number}</div>
    <div><div className="font-bold text-slate-800">{title}</div><div className="mt-0.5">{text}</div></div>
  </div>
);
