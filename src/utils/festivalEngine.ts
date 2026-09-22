import { supabase } from './supabaseClient';
import {
  FestivalEvent,
  FestivalEventType,
  FestivalSalesImpact,
  FestivalAdjustedSales,
  SalesTimeframe,
} from '../types';

const TIMEFRAME_MONTHS: Record<SalesTimeframe, number> = {
  '1M': 1,
  '3M': 3,
  '6M': 6,
  '9M': 9,
  '1Y': 12,
  '2Y': 24,
};

const IMPACT_DEDUCTION_PCT: Record<FestivalSalesImpact, number> = {
  high: 0.40,
  medium: 0.25,
  low: 0.15,
};

export async function fetchFestivals(): Promise<FestivalEvent[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('festival_events')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) {
    console.error('Failed to fetch festivals:', error);
    return [];
  }
  return (data || []).map(rowToEvent);
}

export async function createFestival(
  event: Omit<FestivalEvent, 'id' | 'createdAt'>
): Promise<FestivalEvent | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('festival_events')
    .insert({
      name: event.name,
      event_type: event.eventType,
      start_date: event.startDate,
      end_date: event.endDate,
      description: event.description || null,
      sales_impact: event.salesImpact,
      affected_branches: event.affectedBranches || null,
    })
    .select()
    .single();
  if (error) {
    console.error('Failed to create festival:', error);
    return null;
  }
  return rowToEvent(data);
}

export async function deleteFestival(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('festival_events').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete festival:', error);
    return false;
  }
  return true;
}

function rowToEvent(row: any): FestivalEvent {
  return {
    id: row.id,
    name: row.name,
    eventType: row.event_type as FestivalEventType,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description || undefined,
    salesImpact: row.sales_impact as FestivalSalesImpact,
    affectedBranches: row.affected_branches || null,
    createdAt: row.created_at,
  };
}

function monthsOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return new Date(startA) <= new Date(endB) && new Date(endA) >= new Date(startB);
}

export function getFestivalsForTimeframe(
  festivals: FestivalEvent[],
  periodLabel: string,
  timeframe: SalesTimeframe
): FestivalEvent[] {
  const months = TIMEFRAME_MONTHS[timeframe];
  const now = new Date();
  const periodEnd = new Date(now);
  let periodStart = new Date(now);
  periodStart.setMonth(periodStart.getMonth() - months);

  const dateMatch = periodLabel.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/g);
  if (dateMatch && dateMatch.length >= 2) {
    const [d1, d2] = dateMatch;
    periodStart = new Date(d1);
    periodEnd = new Date(d2);
  }

  return festivals.filter((f) =>
    monthsOverlap(f.startDate, f.endDate, periodStart.toISOString().slice(0, 10), periodEnd.toISOString().slice(0, 10))
  );
}

export function calculateFestivalAdjustedSales(
  rawSoldQty: number,
  branch: string,
  timeframe: SalesTimeframe,
  festivals: FestivalEvent[],
  periodLabel: string
): FestivalAdjustedSales {
  const months = TIMEFRAME_MONTHS[timeframe];
  const rawMonthlyAverage = rawSoldQty / months;

  const applicableFestivals = getFestivalsForTimeframe(festivals, periodLabel, timeframe).filter(
    (f) => !f.affectedBranches || f.affectedBranches.length === 0 || f.affectedBranches.includes(branch)
  );

  if (applicableFestivals.length === 0 || rawSoldQty === 0) {
    return {
      rawSoldQty,
      festivalSoldQty: 0,
      normalSoldQty: rawSoldQty,
      adjustedMonthlyAverage: Math.round(rawMonthlyAverage * 100) / 100,
      rawMonthlyAverage: Math.round(rawMonthlyAverage * 100) / 100,
      isFestivalInflated: false,
      festivalsApplied: [],
    };
  }

  const totalDeductionPct = applicableFestivals.reduce(
    (sum, f) => sum + IMPACT_DEDUCTION_PCT[f.salesImpact],
    0
  );
  const cappedDeduction = Math.min(totalDeductionPct, 0.60);

  const festivalSoldQty = Math.round(rawSoldQty * cappedDeduction);
  const normalSoldQty = rawSoldQty - festivalSoldQty;
  const adjustedMonthlyAverage = normalSoldQty / months;

  return {
    rawSoldQty,
    festivalSoldQty,
    normalSoldQty,
    adjustedMonthlyAverage: Math.round(adjustedMonthlyAverage * 100) / 100,
    rawMonthlyAverage: Math.round(rawMonthlyAverage * 100) / 100,
    isFestivalInflated: festivalSoldQty > 0,
    festivalsApplied: applicableFestivals.map((f) => f.name),
  };
}
