import React, { useState } from 'react';
import { RedistributionReport, ProcurementOrder } from '../types';
import {
  ShoppingBag,
  AlertTriangle,
  Flame,
  ArrowRight,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  DollarSign,
  Store,
  Filter,
  PackagePlus,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface RefillDemandReportProps {
  report: RedistributionReport;
  onSelectBranch?: (branch: string) => void;
  onSelectWeight?: (weight: string) => void;
}

export const RefillDemandReport: React.FC<RefillDemandReportProps> = ({
  report,
  onSelectBranch,
  onSelectWeight
}) => {
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  const itemLabel = report.categoryConfig?.itemLabel || 'Item / Particular';
  const itemUnit = report.categoryConfig?.itemUnit || 'units';
  const unitPrice = report.categoryConfig?.estimatedAvgUnitPrice || 250;
  const currency = report.categoryConfig?.currencySymbol || '$';

  // Extract all weights that have unmet demand or zero stock with active sales
  const refillItems = report.weightSummaries
    .filter(w => w.unmetShortage > 0 || (w.soldQty > 0 && w.currentStock === 0))
    .map(w => {
      // Find branches that sold this item
      const requestingBranches: { branch: string; sold: number; stock: number; shortage: number }[] = [];
      report.matrix.branches.forEach(b => {
        const cell = report.matrix.cells[b]?.[w.weight];
        if (cell && (cell.sold > 0 || cell.stock > 0)) {
          if (cell.sold > cell.stock) {
            requestingBranches.push({
              branch: b,
              sold: cell.sold,
              stock: cell.stock,
              shortage: cell.sold - cell.stock
            });
          }
        }
      });

      // Calculate why this refill is required (Replenishment Rationale)
      let rationale = '';
      let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'MEDIUM';

      if (w.currentStock === 0 && w.soldQty > 0) {
        urgency = 'CRITICAL';
        rationale = `100% Stockout: Customer demand was ${w.soldQty} ${itemUnit} across ${requestingBranches.length} branch(es) (${requestingBranches.map(b => b.branch).join(', ')}), but entire company stock is 0. Internal transfer cannot resolve this. Immediate supplier refill order needed to prevent lost sales.`;
      } else if (w.unmetShortage > 0) {
        urgency = 'HIGH';
        rationale = `Demand Exceeds Inventory: ${w.soldQty} ${itemUnit} sold vs ${w.currentStock} in company stock. Even after intra-branch transfers, net shortage is ${w.unmetShortage} ${itemUnit}. Refill required to maintain shelf presence.`;
      } else {
        rationale = `Buffer Replenishment: Steady sales velocity of ${w.soldQty} ${itemUnit}. Refill recommended for upcoming cycle.`;
      }

      const qtyToBuy = Math.max(w.unmetShortage, w.soldQty > w.currentStock ? w.soldQty - w.currentStock : 0);
      const estCost = qtyToBuy * unitPrice;

      return {
        weight: w.weight,
        weightNum: w.weightNum,
        soldQty: w.soldQty,
        currentStock: w.currentStock,
        qtyToBuy,
        estCost,
        urgency,
        rationale,
        requestingBranches,
        turnoverRatio: w.turnoverRatio
      };
    })
    .sort((a, b) => {
      if (a.urgency === 'CRITICAL' && b.urgency !== 'CRITICAL') return -1;
      if (b.urgency === 'CRITICAL' && a.urgency !== 'CRITICAL') return 1;
      return b.qtyToBuy - a.qtyToBuy;
    });

  const filteredRefills = refillItems.filter(item => {
    if (filterUrgency === 'CRITICAL' && item.urgency !== 'CRITICAL') return false;
    if (filterUrgency === 'HIGH' && item.urgency !== 'CRITICAL' && item.urgency !== 'HIGH') return false;
    if (searchKeyword) {
      const q = searchKeyword.toLowerCase();
      return (
        item.weight.toLowerCase().includes(q) ||
        item.requestingBranches.some(b => b.branch.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalUnitsToRefill = refillItems.reduce((sum, item) => sum + item.qtyToBuy, 0);
  const totalEstimatedBudget = totalUnitsToRefill * unitPrice;
  const criticalItemsCount = refillItems.filter(i => i.urgency === 'CRITICAL').length;

  const handleExportExcel = () => {
    const rows: any[] = [
      [
        `SL`,
        `${itemLabel}`,
        `Sold Demand`,
        `Current Company Stock`,
        `Required Refill Qty (${itemUnit})`,
        `Urgency Priority`,
        `Estimated Budget (${currency})`,
        `Target Branches Needed`,
        `Replenishment Rationale & Stockout Risk Analysis`
      ]
    ];

    filteredRefills.forEach((item, idx) => {
      const branchesStr = item.requestingBranches
        .map(b => `${b.branch} (+${b.shortage})`)
        .join(', ');
      rows.push([
        idx + 1,
        itemUnit === 'ct' ? `${item.weight} ct` : item.weight,
        item.soldQty,
        item.currentStock,
        item.qtyToBuy,
        item.urgency,
        Math.round(item.estCost),
        branchesStr || 'Central Stock Pool',
        item.rationale
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Refill_Demand_Requisition');
    XLSX.writeFile(wb, `Refill_Demand_Report_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card (Realistic Flux Style) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 p-6 shadow-xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <PackagePlus className="w-4 h-4" />
              <span>Smart Refill &amp; Procurement Intelligence</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Product Refill Demand Report
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Based on live sales demand vs. current company stock, this report identifies exactly which product lines require supplier procurement and provides operational business justifications based on stockout risk.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Requisition (.xlsx)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print PO Sheet</span>
            </button>
          </div>
        </div>

        {/* 3 Executive Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Refill Units Needed</p>
              <p className="text-2xl font-bold text-white mt-1">
                {totalUnitsToRefill} <span className="text-xs font-normal text-slate-400">{itemUnit}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Critical 0-Stock Items</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">
                {criticalItemsCount} <span className="text-xs font-normal text-slate-400">skus</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Est. Refill Budget Requirement</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {currency}{totalEstimatedBudget.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterUrgency('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterUrgency === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Refills ({refillItems.length})
          </button>
          <button
            onClick={() => setFilterUrgency('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterUrgency === 'CRITICAL'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>0-Stock Critical ({criticalItemsCount})</span>
          </button>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder={`Filter by ${itemLabel} or branch...`}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Refill Items Table (High-contrast, Realistic Flux Style) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{itemLabel}</th>
                <th className="py-3.5 px-3 text-center">Customer Sold</th>
                <th className="py-3.5 px-3 text-center">Company Stock</th>
                <th className="py-3.5 px-3 text-center">Qty to Refill</th>
                <th className="py-3.5 px-3 text-center">Priority</th>
                <th className="py-3.5 px-4 min-w-[280px]">Replenishment Justification &amp; Rationale</th>
                <th className="py-3.5 px-4 min-w-[200px]">Branch Allocation Needed</th>
                <th className="py-3.5 px-3 text-right">Est. Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredRefills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                    No items match the refill filter criteria. Company stock is balanced.
                  </td>
                </tr>
              ) : (
                filteredRefills.map(item => (
                  <tr
                    key={item.weight}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Item / Carat Weight */}
                    <td
                      onClick={() => onSelectWeight?.(item.weight)}
                      title={`Click to view enterprise store availability for ${item.weight} ct`}
                      className="py-3.5 px-4 cursor-pointer group-hover:text-cyan-400"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-cyan-300 text-sm font-mono hover:underline">
                          {itemUnit === 'ct' ? `${item.weight} ct` : item.weight}
                        </span>
                        {item.currentStock === 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/60">
                            ZERO STOCK
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer Sold */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-blue-950/60 text-blue-300 font-bold border border-blue-800/50">
                        {item.soldQty} {itemUnit}
                      </span>
                    </td>

                    {/* Company Stock */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md font-bold border ${
                          item.currentStock === 0
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.currentStock} {itemUnit}
                      </span>
                    </td>

                    {/* Qty to Refill */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block px-3 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold text-sm border border-amber-500/40">
                        +{item.qtyToBuy} {itemUnit}
                      </span>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3.5 px-3 text-center">
                      {item.urgency === 'CRITICAL' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          CRITICAL
                        </span>
                      ) : item.urgency === 'HIGH' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          HIGH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                          ROUTINE
                        </span>
                      )}
                    </td>

                    {/* Replenishment Business Rationale */}
                    <td className="py-3.5 px-4 text-xs text-slate-300 leading-relaxed">
                      {item.rationale}
                    </td>

                    {/* Branch Allocation Needed */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {item.requestingBranches.map(b => (
                          <button
                            key={b.branch}
                            onClick={() => onSelectBranch?.(b.branch)}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center gap-1"
                            title={`Sold ${b.sold}, Stock ${b.stock}`}
                          >
                            <Store className="w-3 h-3 text-cyan-400" />
                            <span>{b.branch}: <strong className="text-amber-400">+{b.shortage}</strong></span>
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Est. Budget */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {currency}{Math.round(item.estCost).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Procurement Strategic Guidance */}
      <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Refill Decision Logic (Sales vs. Stock Intelligence)</span>
        </div>
        <p className="leading-relaxed">
          1. <strong>Zero Stockouts (Critical Priority):</strong> Items with customer sales but 0 stock anywhere in the company represent immediate lost revenue. These should be ordered first.
        </p>
        <p className="leading-relaxed">
          2. <strong>Intra-Branch Transfers Prior to Purchase:</strong> If another store has surplus pieces, the system schedules an internal store-to-store transfer instead of ordering new stock, minimizing inventory holding costs.
        </p>
        <p className="leading-relaxed">
          3. <strong>Direct Store Routing:</strong> When supplier consignments arrive, follow the <em>Branch Allocation Needed</em> column above to dispatch new pieces directly to dry stores without warehouse delays.
        </p>
      </div>
    </div>
  );
};
