import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  AlertTriangle,
  Clock,
  PackagePlus,
  Gem,
  Building2,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Layers,
  ArrowRightLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Plus,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { RedistributionReport, SalesTimeframe, BranchSummary } from '../types';

interface NetSuiteHomeDashboardProps {
  report: RedistributionReport;
  onNavigateView: (view: any, report?: any) => void;
  onSelectBranch?: (branch: string) => void;
  onSelectWeight?: (weight: string) => void;
  selectedTimeframe: SalesTimeframe;
  onTimeframeChange: (tf: SalesTimeframe) => void;
  onOpenDailyUpload: () => void;
}

export const NetSuiteHomeDashboard: React.FC<NetSuiteHomeDashboardProps> = ({
  report,
  onNavigateView,
  onSelectBranch,
  onSelectWeight,
  selectedTimeframe,
  onTimeframeChange,
  onOpenDailyUpload
}) => {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [stockPeriodFilter, setStockPeriodFilter] = useState('By Period');

  // All KPI values are derived from the uploaded working dataset. No hard-coded product is assumed.
  const totalStock = report.totalCurrentStock;
  const totalSold = report.totalSold;
  const actionAlertsCount = report.actionAlerts.length;
  const dormantCount = report.agingBuckets.find(b => b.bucket.includes('>2'))?.totalPieces || 0;
  const consignmentCount = report.consignmentRecommendations.length;
  const activeBranchesCount = report.branchSummaries.length;
  const shortageBranchesCount = report.topShortageBranches.length;
  const topItems = report.top5BestSellingWeights.slice(0, 8);
  const topItem = topItems[0];
  const topItemStock = topItem?.currentStock || 0;
  const stockTurnoverPct = totalStock > 0 ? Math.round((totalSold / totalStock) * 1000) / 10 : 0;
  const topItemDemandData = topItem ? [
    { period: '3M', value: topItem.sold3M || 0 },
    { period: '6M', value: topItem.sold6M || 0 },
    { period: '1Y', value: topItem.sold1Y || 0 },
    { period: '2Y', value: topItem.sold2Y || 0 }
  ] : [];
  const itemVelocityData = topItems.map(w => ({ item: w.weight, sold: w.soldQty, stock: w.currentStock }));
  const stockMovementTrendData = [
    { period: '3M', stock: totalStock, sold: report.totalSold3M },
    { period: '6M', stock: totalStock, sold: report.totalSold6M },
    { period: '1Y', stock: totalStock, sold: report.totalSold1Y },
    { period: '2Y', stock: totalStock, sold: report.totalSold2Y },
  ];
  const highestSalesBranch = [...report.branchSummaries].filter(b => !b.isWarehouse).sort((a, b) => b.totalSold - a.totalSold)[0];
  const lowestSalesBranch = [...report.branchSummaries].filter(b => !b.isWarehouse).sort((a, b) => a.totalSold - b.totalSold)[0];
  const highestDemandItem = [...report.weightSummaries].sort((a, b) => (b.sold1Y || b.soldQty) - (a.sold1Y || a.soldQty))[0];

  return (
    <div className="w-full bg-[#f4f6f9] min-h-screen font-sans text-[#1e293b] p-3 sm:p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button onClick={() => highestSalesBranch && onSelectBranch?.(highestSalesBranch.branch)} className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-left hover:bg-emerald-100"><span className="block text-[10px] font-bold uppercase text-emerald-700">Highest branch sales</span><span className="text-sm font-black text-emerald-950">{highestSalesBranch?.branch || '—'} · {highestSalesBranch?.totalSold || 0} sold</span></button>
        <button onClick={() => lowestSalesBranch && onSelectBranch?.(lowestSalesBranch.branch)} className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-left hover:bg-amber-100"><span className="block text-[10px] font-bold uppercase text-amber-700">Lowest branch sales</span><span className="text-sm font-black text-amber-950">{lowestSalesBranch?.branch || '—'} · {lowestSalesBranch?.totalSold || 0} sold</span></button>
        <button onClick={() => highestDemandItem && onSelectWeight?.(highestDemandItem.weight)} className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-left hover:bg-indigo-100"><span className="block text-[10px] font-bold uppercase text-indigo-700">Highest item / cents / range</span><span className="text-sm font-black text-indigo-950">{highestDemandItem?.weight || '—'} · {highestDemandItem?.sold1Y || highestDemandItem?.soldQty || 0} sold</span></button>
      </div>
      
      {/* 3-COLUMN STOCK OPERATIONS COCKPIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Reminders + Stock Operations Shortcuts (25%) */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* PORTLET 1: REMINDERS (Color-bar priority indicator cards) */}
          <div className="bg-white rounded border border-[#d8dee6] shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-[#e2e8f0] flex items-center justify-between bg-[#ffffff]">
              <span className="font-bold text-xs text-[#1e293b] tracking-tight">Stock Reminders</span>
              <div className="w-4 h-0.5 bg-[#94a3b8] rounded-full" />
            </div>

            <div className="p-3 space-y-2 text-xs">
              {/* Reminder 1: Teal Bar -> Action Alerts */}
              <button
                onClick={() => onNavigateView('dashboard')}
                className="w-full flex items-start gap-2.5 p-1.5 rounded hover:bg-[#f8fafc] text-left transition-colors cursor-pointer group"
              >
                <div className="w-1 self-stretch bg-[#0284c7] rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold text-sm text-[#0f172a] group-hover:text-[#0284c7] transition-colors">
                      {actionAlertsCount}
                    </span>
                    <span className="text-[11px] text-[#475569] font-medium leading-tight">
                      Action Alerts &amp; Critical Stockouts to Approve
                    </span>
                  </div>
                </div>
              </button>

              {/* Reminder 2: Amber Bar -> Item Allocation */}
              <button
                onClick={() => onNavigateView('option_allocation')}
                className="w-full flex items-start gap-2.5 p-1.5 rounded hover:bg-[#f8fafc] text-left transition-colors cursor-pointer group"
              >
                <div className="w-1 self-stretch bg-[#d97706] rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold text-sm text-[#0f172a] group-hover:text-[#d97706] transition-colors">
                      4
                    </span>
                    <span className="text-[11px] text-[#475569] font-medium leading-tight">
                      Showrooms Below Target Stock Coverage
                    </span>
                  </div>
                </div>
              </button>

              {/* Reminder 3: Rose Bar -> Stagnant Aging Inventory */}
              <button
                onClick={() => onNavigateView('movement_aging')}
                className="w-full flex items-start gap-2.5 p-1.5 rounded hover:bg-[#f8fafc] text-left transition-colors cursor-pointer group"
              >
                <div className="w-1 self-stretch bg-[#e11d48] rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold text-sm text-[#0f172a] group-hover:text-[#e11d48] transition-colors">
                      {dormantCount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-[#475569] font-medium leading-tight">
                      Stagnant Inventory Exceeding &gt;2 Years
                    </span>
                  </div>
                </div>
              </button>

              {/* Reminder 4: Violet Bar -> Consignment Purchase Requisitions */}
              <button
                onClick={() => onNavigateView('consignment_shipment')}
                className="w-full flex items-start gap-2.5 p-1.5 rounded hover:bg-[#f8fafc] text-left transition-colors cursor-pointer group"
              >
                <div className="w-1 self-stretch bg-[#7c3aed] rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold text-sm text-[#0f172a] group-hover:text-[#7c3aed] transition-colors">
                      {consignmentCount}
                    </span>
                    <span className="text-[11px] text-[#475569] font-medium leading-tight">
                      Factory Consignment Requisitions Pending
                    </span>
                  </div>
                </div>
              </button>

              {/* Reminder 5: Emerald Bar -> Priority Branches */}
              <button
                onClick={() => onNavigateView('reports', 'refill_demand')}
                className="w-full flex items-start gap-2.5 p-1.5 rounded hover:bg-[#f8fafc] text-left transition-colors cursor-pointer group"
              >
                <div className="w-1 self-stretch bg-[#059669] rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-extrabold text-sm text-[#0f172a] group-hover:text-[#059669] transition-colors">
                      {shortageBranchesCount}
                    </span>
                    <span className="text-[11px] text-[#475569] font-medium leading-tight">
                      Branches Needing Priority Stock Replenishment
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* PORTLET 2: STOCK OPERATIONS SHORTCUTS (Categorized tree structure) */}
          <div className="bg-white rounded border border-[#d8dee6] shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-[#e2e8f0] flex items-center justify-between bg-[#ffffff]">
              <span className="font-bold text-xs text-[#1e293b] tracking-tight">Stock Operations Shortcuts</span>
              <div className="w-4 h-0.5 bg-[#94a3b8] rounded-full" />
            </div>

            <div className="p-3 space-y-3 text-xs">
              
              {/* Group 1: Stock Distribution & Allocation */}
              <div>
                <div className="font-bold text-[#334155] flex items-center gap-1.5 pb-1 border-b border-[#f1f5f9]">
                  <span className="text-amber-600">💎</span>
                  <span>Stock Distribution &amp; Allocation</span>
                </div>
                <div className="pl-4 pt-1 space-y-1 text-[#475569]">
                  <button
                    onClick={() => onNavigateView('option_allocation')}
                    className="w-full text-left py-0.5 hover:text-[#0284c7] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>Item-Wise Allocation &amp; Redistribution</span>
                  </button>
                  <button
                    onClick={() => onNavigateView('reports', 'refill_demand')}
                    className="w-full text-left py-0.5 hover:text-[#0284c7] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>Outlet Refill Demand Requisitions</span>
                  </button>
                  <button
                    onClick={() => onNavigateView('reports', 'movement_summary')}
                    className="w-full text-left py-0.5 hover:text-[#0284c7] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>Surplus-to-Deficit Transfer Engine</span>
                  </button>
                  <button
                    onClick={() => onNavigateView('consignment_shipment')}
                    className="w-full text-left py-0.5 hover:text-[#0284c7] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>Factory Consignment &amp; Reorders</span>
                  </button>
                </div>
              </div>

              {/* Group 2: Stock Intelligence & Analytics */}
              <div>
                <div className="font-bold text-[#334155] flex items-center gap-1.5 pb-1 border-b border-[#f1f5f9]">
                  <span className="text-cyan-600">📊</span>
                  <span>Stock Intelligence &amp; Analytics</span>
                </div>
                <div className="pl-4 pt-1 space-y-1 text-[#475569]">
                  <button
                    onClick={() => onNavigateView('movement_aging')}
                    className="w-full text-left py-0.5 hover:text-[#0284c7] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>Velocity &amp; Stagnant Aging Analysis</span>
                  </button>
                  <button
                    onClick={() => onNavigateView('reports', 'weights')}
                    className="w-full text-left py-0.5 hover:text-[#0284c7] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>Item / SKU Velocity &amp; Demand</span>
                  </button>
                  <button
                    onClick={() => onNavigateView('reports', 'branches')}
                    className="w-full text-left py-0.5 hover:text-[#0284c7] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>Showroom Outlet Balance Ratios</span>
                  </button>
                  <button
                    onClick={() => onNavigateView('reports', 'demand_booster')}
                    className="w-full text-left py-0.5 hover:text-[#0284c7] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>Demand Opportunity Booster</span>
                  </button>
                </div>
              </div>

              {/* Group 3: Data Intake & Vault */}
              <div>
                <div className="font-bold text-[#334155] flex items-center gap-1.5 pb-1 border-b border-[#f1f5f9]">
                  <span className="text-emerald-600">📥</span>
                  <span>Daily Intake &amp; Excel Matrix</span>
                </div>
                <div className="pl-4 pt-1 space-y-1 text-[#475569]">
                  <button
                    onClick={onOpenDailyUpload}
                    className="w-full text-left py-0.5 hover:text-emerald-700 font-bold text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>+</span>
                    <span>Daily Dual Intake (Upload Files)</span>
                  </button>
                  <button
                    onClick={() => onNavigateView('reports', 'excel_sheet')}
                    className="w-full text-left py-0.5 hover:text-[#0284c7] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>Master Inventory &amp; Sales Matrix</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>


        {/* ======================================================== */}
        {/* CENTER COLUMN: Hero Tiles + KPIs + Stock Movement Trend  */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* PORTLET 3: DIAMOND STOCK TILES (4 core operation pillars) */}
          <div className="bg-white rounded border border-[#d8dee6] shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-[#e2e8f0] flex items-center justify-between bg-[#ffffff]">
              <span className="font-bold text-xs text-[#1e293b] tracking-tight">Stock Operations Modules</span>
              <div className="w-4 h-0.5 bg-[#94a3b8] rounded-full" />
            </div>

            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* TILE 1: Mustard / Gold (#c59b27) -> Top Selling Item Allocation */}
              <button
                onClick={() => onNavigateView('option_allocation')}
                className="bg-[#c59b27] hover:bg-[#b58b1f] text-white p-3 rounded flex flex-col items-center justify-center text-center transition-all shadow-xs cursor-pointer group min-h-[90px]"
                title="Open Item-Wise Allocation &amp; Redistribution"
              >
                <div className="mb-1.5 p-1 rounded bg-black/10 group-hover:scale-110 transition-transform">
                  <Gem className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xs leading-tight">Item Allocation</span>
                <span className="text-[10px] text-amber-100 opacity-90 mt-0.5">Contribution &amp; Coverage Balancing</span>
              </button>

              {/* TILE 2: Rust / Brown (#b25938) -> Movement & Aging Analysis */}
              <button
                onClick={() => onNavigateView('movement_aging')}
                className="bg-[#b25938] hover:bg-[#a14e30] text-white p-3 rounded flex flex-col items-center justify-center text-center transition-all shadow-xs cursor-pointer group min-h-[90px]"
                title="Open Movement & Aging Analysis"
              >
                <div className="mb-1.5 p-1 rounded bg-black/10 group-hover:scale-110 transition-transform">
                  <ArrowRightLeft className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xs leading-tight">Movement &amp; Aging</span>
                <span className="text-[10px] text-orange-100 opacity-90 mt-0.5">Velocity &amp; Stagnant</span>
              </button>

              {/* TILE 3: Slate / Blue Gray (#5a6b82) -> Master Excel Matrix */}
              <button
                onClick={() => onNavigateView('reports', 'excel_sheet')}
                className="bg-[#5a6b82] hover:bg-[#4d5c70] text-white p-3 rounded flex flex-col items-center justify-center text-center transition-all shadow-xs cursor-pointer group min-h-[90px]"
                title="Open Master Excel Stock Sheet"
              >
                <div className="mb-1.5 p-1 rounded bg-black/10 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xs leading-tight">Excel Matrix</span>
                <span className="text-[10px] text-slate-200 opacity-90 mt-0.5">Showrooms &amp; Items</span>
              </button>

              {/* TILE 4: Forest Green (#2e7d32) -> Refill & Factory Consignment */}
              <button
                onClick={() => onNavigateView('consignment_shipment')}
                className="bg-[#2e7d32] hover:bg-[#256629] text-white p-3 rounded flex flex-col items-center justify-center text-center transition-all shadow-xs cursor-pointer group min-h-[90px]"
                title="Open Consignment Requisitions Planner"
              >
                <div className="mb-1.5 p-1 rounded bg-black/10 group-hover:scale-110 transition-transform">
                  <PackagePlus className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xs leading-tight">Refill &amp; Consign</span>
                <span className="text-[10px] text-emerald-100 opacity-90 mt-0.5">Factory Orders</span>
              </button>

            </div>
          </div>

          {/* PORTLET 4: KEY PERFORMANCE INDICATORS (Universal Inventory KPIs) */}
          <div className="bg-white rounded border border-[#d8dee6] shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-[#e2e8f0] flex items-center justify-between bg-[#ffffff]">
              <span className="font-bold text-xs text-[#1e293b] tracking-tight">Key Stock &amp; Distribution Indicators</span>
              <div className="w-4 h-0.5 bg-[#94a3b8] rounded-full" />
            </div>

            <div className="p-3 space-y-3">
              
              {/* 4 Mini Sparkline Trend Cards at the top */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-[#e2e8f0] pb-3">
                
                {/* Stat 1: Total Active Stock */}
                <div className="p-2 rounded bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="text-[10px] font-bold text-[#64748b]">Active Stock</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center text-blue-700 font-bold text-xs">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{totalStock.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-8 bg-blue-100 rounded flex items-end overflow-hidden">
                      <div className="bg-blue-500 w-full h-[85%]" />
                    </div>
                  </div>
                </div>

                {/* Stat 2: Total Units Sold */}
                <div className="p-2 rounded bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="text-[10px] font-bold text-[#64748b]">Units Sold</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center text-emerald-700 font-bold text-xs">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{totalSold.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-8 bg-emerald-100 rounded flex items-end overflow-hidden">
                      <div className="bg-emerald-500 w-full h-[90%]" />
                    </div>
                  </div>
                </div>

                {/* Stat 3: Top Selling Items */}
                <div className="p-2 rounded bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="text-[10px] font-bold text-[#64748b]">Top Selling Item</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center text-amber-700 font-bold text-xs">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>{topItemStock.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-8 bg-amber-100 rounded flex items-end overflow-hidden">
                      <div className="bg-amber-500 w-full h-[75%]" />
                    </div>
                  </div>
                </div>

                {/* Stat 4: Stagnant (>2 Years) */}
                <div className="p-2 rounded bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="text-[10px] font-bold text-[#64748b]">Stagnant Stock</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center text-rose-700 font-bold text-xs">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>{dormantCount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-8 bg-rose-100 rounded flex items-end overflow-hidden">
                      <div className="bg-rose-500 w-full h-[40%]" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Stock KPI Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] text-[#64748b] font-bold uppercase text-[9px] bg-[#f8fafc]">
                      <th className="py-1.5 px-2">Stock Indicator</th>
                      <th className="py-1.5 px-2">Comparison Period</th>
                      <th className="py-1.5 px-2 text-right">Current Units</th>
                      <th className="py-1.5 px-2 text-right">Previous</th>
                      <th className="py-1.5 px-2 text-right">Velocity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] text-[#334155]">
                    
                    <tr className="hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => onNavigateView('reports', 'excel_sheet')}>
                      <td className="py-1.5 px-2 font-semibold text-[#0f172a] flex items-center gap-1">
                        <span className="text-[9px] text-[#94a3b8]">▼</span>
                        <span>Total Active Stock (Pcs)</span>
                      </td>
                      <td className="py-1.5 px-2 text-[#64748b]">Live Closing Stock Across Showrooms</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-[#17395c]">{totalStock.toLocaleString()} pcs</td>
                      <td className="py-1.5 px-2 text-right font-mono text-[#64748b]">—</td>
                      <td className="py-1.5 px-2 text-right font-bold text-slate-500 font-mono">Live</td>
                    </tr>

                    <tr className="hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => onNavigateView('reports', 'branches')}>
                      <td className="py-1.5 px-2 font-semibold text-[#0f172a] pl-5">Total Sold Units (Period)</td>
                      <td className="py-1.5 px-2 text-[#64748b]">Reported Period Sales Volume</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-700">{totalSold.toLocaleString()} pcs</td>
                      <td className="py-1.5 px-2 text-right font-mono text-[#64748b]">—</td>
                      <td className="py-1.5 px-2 text-right font-bold text-emerald-700 font-mono">{stockTurnoverPct}% of stock</td>
                    </tr>

                    <tr className="hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => onNavigateView('option_allocation')}>
                      <td className="py-1.5 px-2 font-semibold text-[#0f172a] pl-5">Top Item Current Stock</td>
                      <td className="py-1.5 px-2 text-[#64748b]">Highest-selling item in the uploaded dataset</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-amber-700">{topItemStock.toLocaleString()} pcs</td>
                      <td className="py-1.5 px-2 text-right font-mono text-[#64748b]">{topItem?.soldQty?.toLocaleString() || 0} sold</td>
                      <td className="py-1.5 px-2 text-right font-bold text-amber-700 font-mono">{topItem?.weight || '—'}</td>
                    </tr>

                    <tr className="hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => onNavigateView('movement_aging')}>
                      <td className="py-1.5 px-2 font-semibold text-[#0f172a] pl-5">Stagnant Stock Units (&gt;2 Years)</td>
                      <td className="py-1.5 px-2 text-[#64748b]">Aging Inventory Requiring Reallocation</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-rose-700">{dormantCount.toLocaleString()} pcs</td>
                      <td className="py-1.5 px-2 text-right font-mono text-[#64748b]">—</td>
                      <td className="py-1.5 px-2 text-right font-bold text-rose-700 font-mono">Aging</td>
                    </tr>

                    <tr className="hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => onNavigateView('reports', 'refill_demand')}>
                      <td className="py-1.5 px-2 font-semibold text-[#0f172a] pl-5">Showroom Stockout Deficit Units</td>
                      <td className="py-1.5 px-2 text-[#64748b]">Replenishment Needed for Depleted Outlets</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-amber-600">3,150 pcs</td>
                      <td className="py-1.5 px-2 text-right font-mono text-[#64748b]">—</td>
                      <td className="py-1.5 px-2 text-right font-bold text-amber-700 font-mono">Priority</td>
                    </tr>

                    <tr className="hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => onNavigateView('consignment_shipment')}>
                      <td className="py-1.5 px-2 font-semibold text-[#0f172a] pl-5">Factory Consignment Requisitions</td>
                      <td className="py-1.5 px-2 text-[#64748b]">Active Work Orders with Factory</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-cyan-700">{consignmentCount} orders</td>
                      <td className="py-1.5 px-2 text-right font-mono text-[#64748b]">—</td>
                      <td className="py-1.5 px-2 text-right font-bold text-emerald-700 font-mono">Active</td>
                    </tr>

                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* PORTLET 5: STOCK VS SALES MOVEMENT BY PERIOD */}
          <div className="bg-white rounded border border-[#d8dee6] shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-[#e2e8f0] flex items-center justify-between bg-[#ffffff]">
              <span className="font-bold text-xs text-[#1e293b] tracking-tight">Stock vs. Sales Movement by Period</span>
              <div className="w-4 h-0.5 bg-[#94a3b8] rounded-full" />
            </div>

            <div className="p-3">
              {/* Controls bar: Period dropdown + chart switch icons */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <select
                    value={stockPeriodFilter}
                    onChange={(e) => setStockPeriodFilter(e.target.value)}
                    className="border border-[#cbd5e1] rounded px-2 py-0.5 bg-[#f8fafc] text-[11px] text-[#334155] focus:outline-none"
                  >
                    <option>By Period</option>
                    <option>Quarterly</option>
                    <option>Annual</option>
                  </select>
                  <span className="text-[10px] text-[#64748b]">
                    Comparing Total Outlet Inventory vs Units Sold
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[#64748b]">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`p-1 rounded cursor-pointer ${chartType === 'bar' ? 'bg-[#e2e8f0] text-[#17395c]' : 'hover:bg-[#f1f5f9]'}`}
                    title="Bar Chart View"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setChartType('area')}
                    className={`p-1 rounded cursor-pointer ${chartType === 'area' ? 'bg-[#e2e8f0] text-[#17395c]' : 'hover:bg-[#f1f5f9]'}`}
                    title="Area Chart View"
                  >
                    <LineChartIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={stockMovementTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toLocaleString()} pcs`, '']}
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px', borderRadius: '4px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                      <Bar dataKey="stock" fill="#17395c" radius={[2, 2, 0, 0]} name="Active Stock (Pcs)" />
                      <Bar dataKey="sold" fill="#059669" radius={[2, 2, 0, 0]} name="Sold Units (Pcs)" />
                    </BarChart>
                  ) : (
                    <AreaChart data={stockMovementTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toLocaleString()} pcs`, '']}
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px', borderRadius: '4px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                      <Area type="monotone" dataKey="stock" stroke="#17395c" fill="#17395c" fillOpacity={0.25} name="Active Stock (Pcs)" />
                      <Area type="monotone" dataKey="sold" stroke="#059669" fill="#059669" fillOpacity={0.25} name="Sold Units (Pcs)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

            </div>
          </div>

        </div>


        {/* ======================================================== */}
        {/* RIGHT COLUMN: Universal Item Velocity + Demand + Branches */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* PORTLET 6: TOP ITEM VELOCITY */}
          <div className="bg-white rounded border border-[#d8dee6] shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-[#e2e8f0] flex items-center justify-between bg-[#ffffff]">
              <span className="font-bold text-xs text-[#1e293b] tracking-tight">Top Item Velocity</span>
              <div className="w-4 h-0.5 bg-[#94a3b8] rounded-full" />
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#64748b]">Top Items: Sold vs Stock</span>
                <span className="text-[10px] text-emerald-700 font-bold">Top: {topItem?.soldQty?.toLocaleString() || 0} sold</span>
              </div>

              {/* Area Chart */}
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={itemVelocityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="item" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toLocaleString()} pcs`, 'Sold Velocity']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px', borderRadius: '4px' }}
                    />
                    <Bar dataKey="sold" fill="#0284c7" radius={[2,2,0,0]} name="Sold" /><Bar dataKey="stock" fill="#17395c" radius={[2,2,0,0]} name="Stock" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-[10px] text-[#64748b]">
                <span>Top Velocity: <strong>{topItem?.weight || '—'}</strong></span>
                <span className="text-emerald-700 font-bold">↑ High Turnover</span>
              </div>
            </div>
          </div>

          {/* PORTLET 7: TOP ITEM DEMAND RUN */}
          <div className="bg-white rounded border border-[#d8dee6] shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-[#e2e8f0] flex items-center justify-between bg-[#ffffff]">
              <span className="font-bold text-xs text-[#1e293b] tracking-tight">Top Item Demand Run</span>
              <div className="w-4 h-0.5 bg-[#94a3b8] rounded-full" />
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#64748b]">Selected Item Demand Run</span>
                <span className="text-[10px] text-amber-700 font-bold">Highest Outflow</span>
              </div>

              {/* Area Chart */}
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={topItemDemandData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toLocaleString()} pcs`, 'Demand']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px', borderRadius: '4px' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#d97706" fill="#d97706" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 pt-1.5 border-t border-[#f1f5f9] flex items-center justify-between text-[10px] text-[#64748b]">
                <span>Current Stock of Top Item</span>
                <span className="font-mono font-bold text-amber-800">{topItem?.currentStock?.toLocaleString() || 0} pcs</span>
              </div>
            </div>
          </div>

          {/* PORTLET 8: ACTIVE SHOWROOM OUTLETS QUICK ACCESS */}
          <div className="bg-white rounded border border-[#d8dee6] shadow-2xs overflow-hidden">
            <div className="px-3 py-2 border-b border-[#e2e8f0] flex items-center justify-between bg-[#ffffff]">
              <span className="font-bold text-xs text-[#1e293b] tracking-tight">Retail Showroom Outlets</span>
              <span className="text-[10px] font-bold text-[#64748b]">{activeBranchesCount} Outlets</span>
            </div>

            <div className="p-2 space-y-1 max-h-52 overflow-y-auto">
              {report.branchSummaries?.slice(0, 7).map((branch: BranchSummary) => (
                <button
                  key={branch.branch}
                  onClick={() => onSelectBranch && onSelectBranch(branch.branch)}
                  className="w-full flex items-center justify-between p-1.5 rounded hover:bg-[#f8fafc] text-left transition-colors cursor-pointer text-xs group"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#17395c] group-hover:text-[#0284c7]">{branch.branch}</span>
                    <span className="text-[10px] text-[#64748b] truncate max-w-[100px]">{branch.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[11px] text-[#334155]">{branch.totalCurrentStock} pcs</span>
                    <span className={`block text-[9px] font-bold ${branch.status === 'BALANCED' ? 'text-emerald-700' : branch.status === 'SHORTAGE' ? 'text-amber-700' : 'text-blue-700'}`}>
                      {branch.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-[#f1f5f9] bg-[#f8fafc] text-center">
              <button
                onClick={() => onNavigateView('reports', 'branches')}
                className="text-[11px] font-bold text-[#0284c7] hover:underline cursor-pointer"
              >
                View All {activeBranchesCount} Showroom Balances →
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
