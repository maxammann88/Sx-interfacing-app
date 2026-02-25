import React, { useEffect, useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import api from '../../utils/api';
import { formatEur, generatePeriodOptions, getDefaultPeriod, formatPeriodLabel } from '../../utils/format';
import type { OverviewRow, OverviewSubBreakdown, StatementData, StatementLine, PaymentItem } from '@sixt/shared';
import {
  PageTitle, Card, Button, Select, Label, FormGroup, FormRow,
  Table, Spinner, Alert, AmountCell, SubtotalRow, Input, SectionTitle,
} from '../../components/ui';
import { theme } from '../../styles/theme';

const DARK_COL_BG = '#3a3a3a';
const DARK_COL_BG_ROW = '#e8e5de';
const DARK_COL_BG_TOTAL = '#dbd8d0';

const TableScroll = styled.div`
  max-height: 75vh;
  overflow-y: auto;
  overflow-x: auto;
`;

const CompactTable = styled(Table)`
  font-size: 11px;
  white-space: nowrap;
  th {
    padding: 5px 6px;
    font-size: 10px;
    position: sticky;
    top: 0;
    z-index: 3;
    background: #222 !important;
    color: #fff !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }
  td { padding: 3px 6px; font-size: 11px; }
`;

const StickyTotalRow = styled(SubtotalRow)`
  td {
    position: sticky;
    top: 28px;
    z-index: 2;
    background: #f0f0f0 !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
`;

const SearchInput = styled(Input)`
  width: 240px;
  padding: 5px 10px;
  font-size: 12px;
`;

const ThresholdRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
`;

const ThresholdItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: ${theme.colors.textSecondary};
`;

const ThresholdInput = styled(Input)`
  width: 60px;
  padding: 3px 6px;
  font-size: 11px;
  text-align: right;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBox = styled.div`
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  max-width: 680px;
  width: 95%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const ModalTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: ${theme.colors.textSecondary};
  padding: 0 4px;
  line-height: 1;
  &:hover { color: ${theme.colors.textPrimary}; }
`;

const ModalBody = styled.div`
  padding: 16px 20px 20px;
  overflow-y: auto;
`;

const BreakdownTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  th {
    text-align: left;
    padding: 6px 8px;
    background: ${theme.colors.secondary};
    color: white;
    font-size: 11px;
    font-weight: 600;
  }
  td {
    padding: 5px 8px;
    border-bottom: 1px solid ${theme.colors.border};
  }
  tr:hover td {
    background: #f9f9f9;
  }
`;

const BreakdownTotal = styled.tr`
  td {
    font-weight: 700;
    background: #f0f0f0 !important;
    border-top: 2px solid ${theme.colors.secondary};
  }
`;

const ClickableAmount = styled.span`
  cursor: pointer;
  border-bottom: 1px dashed ${theme.colors.textSecondary};
  transition: all 0.15s;
  &:hover {
    color: ${theme.colors.primary};
    border-color: ${theme.colors.primary};
  }
`;

const DeltaSpan = styled.span<{ $level: 'normal' | 'warning' | 'danger' }>`
  font-size: 9px;
  font-weight: 600;
  margin-left: 3px;
  color: ${p =>
    p.$level === 'danger' ? theme.colors.danger :
    p.$level === 'warning' ? '#e6a800' :
    theme.colors.textSecondary};
`;

const GroupToggle = styled.span`
  cursor: pointer;
  user-select: none;
  font-size: 9px;
  margin-right: 3px;
  opacity: 0.8;
`;

const SubColHeader = styled.th`
  font-size: 9px !important;
  font-weight: 500 !important;
  padding: 3px 5px !important;
  background: #444 !important;
  border-left: 1px solid #555 !important;
`;

type CategoryKey = 'clearing' | 'billing' | 'total' | 'prevBalance' | 'overdue' | 'due' | 'sixt' | 'partner' | 'interfacing' | 'balance';
type ExpandGroup = 'clearing' | 'operational' | 'contractual';

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'clearing', label: 'Clearing' },
  { key: 'billing', label: 'Billing' },
  { key: 'total', label: 'Total' },
  { key: 'prevBalance', label: 'Bal. prev.' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'due', label: 'Due' },
  { key: 'sixt', label: 'Pmt Sixt' },
  { key: 'partner', label: 'Pmt Partner' },
  { key: 'interfacing', label: 'Interfacing' },
  { key: 'balance', label: 'Balance' },
];

const DEFAULT_THRESHOLDS: Record<CategoryKey, { warn: number; danger: number }> = {
  clearing: { warn: 50, danger: 100 },
  billing: { warn: 50, danger: 100 },
  total: { warn: 50, danger: 100 },
  prevBalance: { warn: 50, danger: 100 },
  overdue: { warn: 50, danger: 100 },
  due: { warn: 50, danger: 100 },
  sixt: { warn: 50, danger: 100 },
  partner: { warn: 50, danger: 100 },
  interfacing: { warn: 50, danger: 100 },
  balance: { warn: 50, danger: 100 },
};

const CLEARING_SUB_LABELS = ['Prepaid', 'Corporate Cards', 'Voucher', 'Franchise Agent Commission', 'Rest'];

function getPreviousPeriod(period: string): string {
  const year = parseInt(period.substring(0, 4), 10);
  const month = parseInt(period.substring(4, 6), 10);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function rowValue(row: OverviewRow, key: CategoryKey): number {
  switch (key) {
    case 'clearing': return row.clearingSubtotal;
    case 'billing': return row.billingSubtotal;
    case 'total': return row.totalInterfacingDue;
    case 'prevBalance': return row.previousPeriodBalance;
    case 'overdue': return row.overdueBalance;
    case 'due': return row.dueBalance;
    case 'sixt': return row.paymentBySixt;
    case 'partner': return row.paymentByPartner;
    case 'interfacing': return row.totalInterfacingDue;
    case 'balance': return row.balanceOpenItems;
  }
}

const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function periodMonthName(p: string): string {
  return MONTH_NAMES_SHORT[parseInt(p.substring(4, 6), 10) - 1] || '';
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function getDeltaLevel(pct: number | null, warn: number, danger: number): 'normal' | 'warning' | 'danger' {
  if (pct === null) return 'danger';
  const abs = Math.abs(pct);
  if (abs >= danger) return 'danger';
  if (abs >= warn) return 'warning';
  return 'normal';
}

function formatPct(pct: number | null): string {
  if (pct === null) return 'new';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${Math.round(pct)}%`;
}

function getBreakdownAmount(breakdown: OverviewSubBreakdown[], label: string): number {
  const item = breakdown.find(b => b.label === label);
  return item ? item.amount : 0;
}

function collectUniqueLabels(rows: OverviewRow[], field: 'operationalBreakdown' | 'contractualBreakdown'): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    for (const b of r[field] || []) {
      set.add(b.label);
    }
  }
  return Array.from(set).sort();
}

export default function StatementOverviewPage() {
  const [rows, setRows] = useState<OverviewRow[]>([]);
  const [prevRows, setPrevRows] = useState<OverviewRow[]>([]);
  const [period, setPeriod] = useState(getDefaultPeriod());
  const [releaseDate, setReleaseDate] = useState('');
  const [prevReleaseDate, setPrevReleaseDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('aktiv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [showThresholds, setShowThresholds] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<CategoryKey | 'fir' | 'name' | 'iso' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [expandedGroups, setExpandedGroups] = useState<Set<ExpandGroup>>(new Set());

  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownData, setBreakdownData] = useState<{ lines: { desc: string; ref: string; amount: number; date?: string }[]; total: number } | null>(null);
  const [breakdownTitle, setBreakdownTitle] = useState('');

  const periods = generatePeriodOptions();
  const prevPeriod = getPreviousPeriod(period);

  const toggleGroup = useCallback((g: ExpandGroup) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }, []);

  const operationalLabels = useMemo(() => collectUniqueLabels(rows, 'operationalBreakdown'), [rows]);
  const contractualLabels = useMemo(() => collectUniqueLabels(rows, 'contractualBreakdown'), [rows]);

  const prevMap = useMemo(() => {
    const map: Record<number, OverviewRow> = {};
    prevRows.forEach(r => { map[r.countryId] = r; });
    return map;
  }, [prevRows]);

  useEffect(() => {
    if (!period) return;
    api.get(`/planning/${period}`)
      .then(res => {
        const plan = res.data.data;
        setReleaseDate(plan?.releaseDate || new Date().toISOString().split('T')[0]);
      })
      .catch(() => setReleaseDate(new Date().toISOString().split('T')[0]));

    api.get(`/planning/${prevPeriod}`)
      .then(res => {
        const plan = res.data.data;
        setPrevReleaseDate(plan?.releaseDate || new Date().toISOString().split('T')[0]);
      })
      .catch(() => setPrevReleaseDate(new Date().toISOString().split('T')[0]));
  }, [period, prevPeriod]);

  const loadOverview = async () => {
    if (!period) {
      setError('Please select an accounting period.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [currentRes, prevRes] = await Promise.all([
        api.get('/statement/overview', {
          params: { period, releaseDate, status: statusFilter !== 'alle' ? statusFilter : undefined },
        }),
        api.get('/statement/overview', {
          params: { period: prevPeriod, releaseDate: prevReleaseDate, status: statusFilter !== 'alle' ? statusFilter : undefined },
        }),
      ]);
      setRows(currentRes.data.data);
      setPrevRows(prevRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error loading overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period) loadOverview();
  }, [period, statusFilter]);

  const navigatePeriod = useCallback((direction: -1 | 1) => {
    const idx = periods.findIndex(p => p.value === period);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < periods.length) {
      setPeriod(periods[newIdx].value);
    }
  }, [period, periods]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigatePeriod(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePeriod(-1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigatePeriod]);

  const handleSort = useCallback((col: CategoryKey | 'fir' | 'name' | 'iso') => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }, [sortCol]);

  const filteredAndSortedRows = useMemo(() => {
    let result = rows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.iso.toLowerCase().includes(q) ||
        String(r.fir).includes(q)
      );
    }
    if (sortCol) {
      result = [...result].sort((a, b) => {
        let va: any, vb: any;
        if (sortCol === 'fir') { va = a.fir; vb = b.fir; }
        else if (sortCol === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
        else if (sortCol === 'iso') { va = a.iso; vb = b.iso; }
        else { va = rowValue(a, sortCol); vb = rowValue(b, sortCol); }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [rows, searchQuery, sortCol, sortDir]);

  const sortIndicator = (col: CategoryKey | 'fir' | 'name' | 'iso') => {
    if (sortCol !== col) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  const openBreakdown = useCallback(async (countryId: number, countryName: string, catKey: CategoryKey) => {
    setBreakdownLoading(true);
    setBreakdownOpen(true);
    setBreakdownData(null);

    const catLabels: Record<CategoryKey, string> = {
      clearing: 'Clearing Statement',
      billing: 'Billing Statement',
      total: 'Total Interfacing Due',
      prevBalance: 'Balance Previous Period',
      overdue: 'Overdue Balance',
      due: 'Due Balance',
      sixt: 'Payment by Sixt',
      partner: 'Payment by Partner',
      interfacing: 'Interfacing Amount',
      balance: 'Balance (Open Items)',
    };
    setBreakdownTitle(`${countryName} \u2013 ${catLabels[catKey]}`);

    try {
      const res = await api.get(`/statement/${countryId}`, {
        params: { period, releaseDate },
      });
      const st: StatementData = res.data.data;

      let lines: { desc: string; ref: string; amount: number; date?: string }[] = [];
      let total = 0;

      switch (catKey) {
        case 'clearing':
          lines = st.clearing.map((l: StatementLine) => ({ desc: l.description, ref: l.reference, amount: l.amount }));
          total = st.clearingSubtotal;
          break;
        case 'billing':
          lines = st.billing.map((l: StatementLine) => ({ desc: l.description, ref: l.reference, amount: l.amount, date: l.date }));
          total = st.billingSubtotal;
          break;
        case 'total':
        case 'interfacing':
          lines = [
            { desc: 'Clearing Subtotal', ref: '', amount: st.clearingSubtotal },
            { desc: 'Billing Subtotal', ref: '', amount: st.billingSubtotal },
          ];
          total = st.totalInterfacingDue;
          break;
        case 'prevBalance':
          lines = [
            { desc: 'Overdue Balance', ref: '', amount: st.accountStatement.overdueBalance },
            { desc: 'Due Balance', ref: '', amount: st.accountStatement.dueBalance },
          ];
          total = st.accountStatement.previousPeriodBalance;
          break;
        case 'overdue': {
          const overdueItems = (st.accountStatement.previousMonthItems || [])
            .filter((item: any) => item.nettofaelligkeit && item.nettofaelligkeit < st.releaseDate);
          lines = overdueItems.map((item: any) => ({
            desc: item.description || item.nettofaelligkeit || 'Overdue item',
            ref: item.nettofaelligkeit || '',
            amount: item.amount,
          }));
          total = st.accountStatement.overdueBalance;
          if (lines.length === 0) lines = [{ desc: 'Overdue balance', ref: '', amount: total }];
          break;
        }
        case 'due': {
          const dueItems = (st.accountStatement.previousMonthItems || [])
            .filter((item: any) => item.nettofaelligkeit && item.nettofaelligkeit >= st.releaseDate);
          lines = dueItems.map((item: any) => ({
            desc: item.description || item.nettofaelligkeit || 'Due item',
            ref: item.nettofaelligkeit || '',
            amount: item.amount,
          }));
          total = st.accountStatement.dueBalance;
          if (lines.length === 0) lines = [{ desc: `Due until ${st.accountStatement.dueUntilDate}`, ref: '', amount: total }];
          break;
        }
        case 'sixt':
          lines = (st.accountStatement.paymentBySixtItems || []).map((p: PaymentItem) => ({
            desc: p.description || 'Payment by Sixt',
            ref: '',
            amount: p.amount,
            date: p.date,
          }));
          total = st.accountStatement.paymentBySixt;
          if (lines.length === 0) lines = [{ desc: 'Payment by Sixt', ref: '', amount: total }];
          break;
        case 'partner':
          lines = (st.accountStatement.paymentByPartnerItems || []).map((p: PaymentItem) => ({
            desc: p.description || 'Payment by Partner',
            ref: '',
            amount: p.amount,
            date: p.date,
          }));
          total = st.accountStatement.paymentByPartner;
          if (lines.length === 0) lines = [{ desc: 'Payment by Partner', ref: '', amount: total }];
          break;
        case 'balance':
          lines = [
            { desc: 'Overdue Balance', ref: '', amount: st.accountStatement.overdueBalance },
            { desc: 'Due Balance', ref: '', amount: st.accountStatement.dueBalance },
            { desc: 'Payment by Sixt', ref: '', amount: st.accountStatement.paymentBySixt },
            { desc: 'Payment by Partner', ref: '', amount: st.accountStatement.paymentByPartner },
            { desc: 'Total Interfacing Due', ref: '', amount: st.totalInterfacingDue },
          ];
          total = st.accountStatement.balanceOpenItems;
          break;
      }

      setBreakdownData({ lines, total });
    } catch {
      setBreakdownData({ lines: [{ desc: 'Error loading breakdown', ref: '', amount: 0 }], total: 0 });
    } finally {
      setBreakdownLoading(false);
    }
  }, [period, releaseDate]);

  const updateThreshold = (key: CategoryKey, field: 'warn' | 'danger', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setThresholds(prev => ({ ...prev, [key]: { ...prev[key], [field]: num } }));
  };

  const totals = useMemo(() => {
    const base = filteredAndSortedRows.reduce(
      (acc, r) => ({
        clearing: acc.clearing + r.clearingSubtotal,
        billing: acc.billing + r.billingSubtotal,
        total: acc.total + r.totalInterfacingDue,
        prevBalance: acc.prevBalance + r.previousPeriodBalance,
        overdue: acc.overdue + r.overdueBalance,
        due: acc.due + r.dueBalance,
        sixt: acc.sixt + r.paymentBySixt,
        partner: acc.partner + r.paymentByPartner,
        interfacing: acc.interfacing + r.totalInterfacingDue,
        balance: acc.balance + r.balanceOpenItems,
      }),
      { clearing: 0, billing: 0, total: 0, prevBalance: 0, overdue: 0, due: 0, sixt: 0, partner: 0, interfacing: 0, balance: 0 },
    );
    return base;
  }, [filteredAndSortedRows]);

  const subTotals = useMemo(() => {
    const clrMap = new Map<string, number>();
    CLEARING_SUB_LABELS.forEach(l => clrMap.set(l, 0));
    const opMap = new Map<string, number>();
    operationalLabels.forEach(l => opMap.set(l, 0));
    const ctMap = new Map<string, number>();
    contractualLabels.forEach(l => ctMap.set(l, 0));

    for (const r of filteredAndSortedRows) {
      for (const b of r.clearingBreakdown || []) {
        clrMap.set(b.label, (clrMap.get(b.label) || 0) + b.amount);
      }
      for (const b of r.operationalBreakdown || []) {
        opMap.set(b.label, (opMap.get(b.label) || 0) + b.amount);
      }
      for (const b of r.contractualBreakdown || []) {
        ctMap.set(b.label, (ctMap.get(b.label) || 0) + b.amount);
      }
    }
    return { clearing: clrMap, operational: opMap, contractual: ctMap };
  }, [filteredAndSortedRows, operationalLabels, contractualLabels]);

  function renderAmountWithDelta(currentVal: number, countryId: number, catKey: CategoryKey, bold?: boolean, countryName?: string, extraStyle?: React.CSSProperties) {
    const prev = prevMap[countryId];
    const prevVal = prev ? rowValue(prev, catKey) : null;
    const pct = prevVal !== null ? pctChange(currentVal, prevVal) : null;
    const t = thresholds[catKey];
    const level = getDeltaLevel(pct, t.warn, t.danger);

    const cellStyle: React.CSSProperties = { ...(bold ? { fontWeight: 600 } : {}), ...extraStyle };

    return (
      <AmountCell style={Object.keys(cellStyle).length ? cellStyle : undefined}>
        <ClickableAmount onClick={() => openBreakdown(countryId, countryName || '', catKey)}>
          {formatEur(currentVal)}
        </ClickableAmount>
        {prevVal !== null && pct !== null && pct !== 0 && (
          <DeltaSpan $level={level}>{formatPct(pct)}</DeltaSpan>
        )}
        {prevVal === null && prevRows.length > 0 && currentVal !== 0 && (
          <DeltaSpan $level="danger">new</DeltaSpan>
        )}
      </AmountCell>
    );
  }

  const isClrExpanded = expandedGroups.has('clearing');
  const isOpExpanded = expandedGroups.has('operational');
  const isCtExpanded = expandedGroups.has('contractual');

  const clearingColCount = isClrExpanded ? CLEARING_SUB_LABELS.length : 0;
  const opColCount = isOpExpanded ? operationalLabels.length : 0;
  const ctColCount = isCtExpanded ? contractualLabels.length : 0;

  function renderGroupHeader(group: ExpandGroup, label: string, subLabels: string[], expanded: boolean) {
    const subCount = subLabels.length;
    if (expanded && subCount > 0) {
      return (
        <th
          colSpan={subCount + 1}
          style={{ textAlign: 'center', cursor: 'pointer', borderLeft: '2px solid #555' }}
          onClick={() => toggleGroup(group)}
        >
          <GroupToggle>{'\u25BC'}</GroupToggle>{label}
        </th>
      );
    }
    return (
      <th
        style={{ textAlign: 'right', cursor: 'pointer', borderLeft: '2px solid #555' }}
        onClick={() => toggleGroup(group)}
      >
        <GroupToggle>{subLabels.length > 0 ? '\u25B6' : ''}</GroupToggle>{label}
      </th>
    );
  }

  function renderSubHeaders(subLabels: string[], expanded: boolean) {
    if (!expanded || subLabels.length === 0) return null;
    return subLabels.map((label, i) => (
      <SubColHeader key={label} style={{ textAlign: 'right' }}>
        {label.length > 18 ? label.substring(0, 16) + '..' : label}
      </SubColHeader>
    ));
  }

  const needsSubRow = isClrExpanded || isOpExpanded || isCtExpanded;

  return (
    <div>
      <PageTitle>Statement Overview</PageTitle>

      {error && <Alert $type="error">{error}</Alert>}

      <Card>
        <FormRow>
          <FormGroup>
            <Label>Status Filter</Label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="alle">All</option>
              <option value="aktiv">Active</option>
              <option value="inaktiv">Inactive</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Accounting Period</Label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="">-- Select period --</option>
              {periods.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
            <Label>&nbsp;</Label>
            <Button onClick={() => navigatePeriod(-1)} disabled={loading} style={{ padding: '8px 12px', fontSize: 16 }} title="Previous period (Arrow Left)">&#8592;</Button>
            <Button onClick={() => navigatePeriod(1)} disabled={loading} style={{ padding: '8px 12px', fontSize: 16 }} title="Next period (Arrow Right)">&#8594;</Button>
          </FormGroup>
        </FormRow>
      </Card>

      {rows.length > 0 && (
        <Card style={{ marginBottom: 12, padding: '10px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showThresholds ? 10 : 0 }}>
            <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>
              % change vs. {formatPeriodLabel(prevPeriod)} &nbsp;
              <span style={{ color: '#e6a800', fontWeight: 600 }}>{'\u25A0'}</span> warning &nbsp;
              <span style={{ color: theme.colors.danger, fontWeight: 600 }}>{'\u25A0'}</span> critical
            </span>
            <Button
              onClick={() => setShowThresholds(!showThresholds)}
              style={{ padding: '4px 12px', fontSize: 11 }}
            >
              {showThresholds ? 'Hide thresholds' : 'Adjust thresholds'}
            </Button>
          </div>
          {showThresholds && (
            <ThresholdRow>
              {CATEGORIES.map(cat => (
                <ThresholdItem key={cat.key}>
                  <strong>{cat.label}:</strong>
                  <span style={{ color: '#e6a800' }}>{'\u26A0'}</span>
                  <ThresholdInput
                    type="number"
                    min="0"
                    value={thresholds[cat.key].warn}
                    onChange={e => updateThreshold(cat.key, 'warn', e.target.value)}
                  />%
                  <span style={{ color: theme.colors.danger }}>{'\u2B24'}</span>
                  <ThresholdInput
                    type="number"
                    min="0"
                    value={thresholds[cat.key].danger}
                    onChange={e => updateThreshold(cat.key, 'danger', e.target.value)}
                  />%
                </ThresholdItem>
              ))}
            </ThresholdRow>
          )}
        </Card>
      )}

      {loading && <Spinner />}

      {!loading && rows.length > 0 && (
        <Card style={{ padding: 8 }}>
          <div style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
            <SearchInput
              placeholder="Search country, ISO, FIR..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>
                {filteredAndSortedRows.length} of {rows.length} countries
              </span>
            )}
          </div>
          <TableScroll>
          <CompactTable>
            <thead>
              <tr>
                <th rowSpan={needsSubRow ? 2 : 1} style={{ cursor: 'pointer' }} onClick={() => handleSort('fir')}>FIR{sortIndicator('fir')}</th>
                <th rowSpan={needsSubRow ? 2 : 1} style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Country{sortIndicator('name')}</th>
                <th rowSpan={needsSubRow ? 2 : 1} style={{ textAlign: 'right', cursor: 'pointer', background: `${DARK_COL_BG} !important` }} onClick={() => handleSort('prevBalance')}>Bal. prev.{sortIndicator('prevBalance')}</th>
                <th rowSpan={needsSubRow ? 2 : 1} style={{ textAlign: 'right', cursor: 'pointer', paddingLeft: 14 }} onClick={() => handleSort('overdue')}>Overdue{sortIndicator('overdue')}</th>
                <th rowSpan={needsSubRow ? 2 : 1} style={{ textAlign: 'right', cursor: 'pointer', paddingLeft: 14 }} onClick={() => handleSort('due')}>Due{sortIndicator('due')}</th>
                <th rowSpan={needsSubRow ? 2 : 1} style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('sixt')}>Pmt Sixt{sortIndicator('sixt')}</th>
                <th rowSpan={needsSubRow ? 2 : 1} style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('partner')}>Pmt Partner{sortIndicator('partner')}</th>
                <th rowSpan={needsSubRow ? 2 : 1} style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('interfacing')}>Interfac. {periodMonthName(period)}{sortIndicator('interfacing')}</th>
                {renderGroupHeader('clearing', 'Clearing', CLEARING_SUB_LABELS, isClrExpanded)}
                {renderGroupHeader('operational', 'Oper. Costs', operationalLabels, isOpExpanded)}
                {renderGroupHeader('contractual', 'Contr. Costs', contractualLabels, isCtExpanded)}
                <th rowSpan={needsSubRow ? 2 : 1} style={{ textAlign: 'right', cursor: 'pointer', fontWeight: 700, background: `${DARK_COL_BG} !important` }} onClick={() => handleSort('balance')}>Balance{sortIndicator('balance')}</th>
              </tr>
              {needsSubRow && (
                <tr>
                  {isClrExpanded && <>
                    <SubColHeader style={{ textAlign: 'right', borderLeft: '2px solid #555' }}>{'\u03A3'}</SubColHeader>
                    {renderSubHeaders(CLEARING_SUB_LABELS, isClrExpanded)}
                  </>}
                  {isOpExpanded && <>
                    <SubColHeader style={{ textAlign: 'right', borderLeft: '2px solid #555' }}>{'\u03A3'}</SubColHeader>
                    {renderSubHeaders(operationalLabels, isOpExpanded)}
                  </>}
                  {isCtExpanded && <>
                    <SubColHeader style={{ textAlign: 'right', borderLeft: '2px solid #555' }}>{'\u03A3'}</SubColHeader>
                    {renderSubHeaders(contractualLabels, isCtExpanded)}
                  </>}
                </tr>
              )}
            </thead>
            <tbody>
              <StickyTotalRow>
                <td colSpan={2}><strong>TOTAL ({filteredAndSortedRows.length} countries)</strong></td>
                <AmountCell style={{ background: DARK_COL_BG_TOTAL }}><strong>{formatEur(totals.prevBalance)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.overdue)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.due)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.sixt)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.partner)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.interfacing)}</strong></AmountCell>
                <AmountCell style={{ borderLeft: '2px solid #ccc' }}><strong>{formatEur(totals.clearing)}</strong></AmountCell>
                {isClrExpanded && CLEARING_SUB_LABELS.map(label => (
                  <AmountCell key={label} style={{ fontSize: 10 }}><strong>{formatEur(subTotals.clearing.get(label) || 0)}</strong></AmountCell>
                ))}
                <AmountCell style={{ borderLeft: '2px solid #ccc' }}><strong>{formatEur(totals.billing - (totals.clearing || 0))}</strong></AmountCell>
                {isOpExpanded && operationalLabels.map(label => (
                  <AmountCell key={label} style={{ fontSize: 10 }}><strong>{formatEur(subTotals.operational.get(label) || 0)}</strong></AmountCell>
                ))}
                <AmountCell style={{ borderLeft: '2px solid #ccc' }}><strong>{formatEur(0)}</strong></AmountCell>
                {isCtExpanded && contractualLabels.map(label => (
                  <AmountCell key={label} style={{ fontSize: 10 }}><strong>{formatEur(subTotals.contractual.get(label) || 0)}</strong></AmountCell>
                ))}
                <AmountCell style={{ background: DARK_COL_BG_TOTAL }}><strong>{formatEur(totals.balance)}</strong></AmountCell>
              </StickyTotalRow>
              {filteredAndSortedRows.map((r) => {
                const opSum = (r.operationalBreakdown || []).reduce((s, b) => s + b.amount, 0);
                const ctSum = (r.contractualBreakdown || []).reduce((s, b) => s + b.amount, 0);
                return (
                  <tr key={r.countryId}>
                    <td>{r.fir}</td>
                    <td><strong>{r.name}</strong></td>
                    {renderAmountWithDelta(r.previousPeriodBalance, r.countryId, 'prevBalance', true, r.name, { background: DARK_COL_BG_ROW })}
                    {renderAmountWithDelta(r.overdueBalance, r.countryId, 'overdue', false, r.name, { paddingLeft: 14 })}
                    {renderAmountWithDelta(r.dueBalance, r.countryId, 'due', false, r.name, { paddingLeft: 14 })}
                    {renderAmountWithDelta(r.paymentBySixt, r.countryId, 'sixt', false, r.name)}
                    {renderAmountWithDelta(r.paymentByPartner, r.countryId, 'partner', false, r.name)}
                    {renderAmountWithDelta(r.totalInterfacingDue, r.countryId, 'interfacing', false, r.name)}
                    {renderAmountWithDelta(r.clearingSubtotal, r.countryId, 'clearing', false, r.name, { borderLeft: '2px solid #e0e0e0' })}
                    {isClrExpanded && CLEARING_SUB_LABELS.map(label => (
                      <AmountCell key={label} style={{ fontSize: 10, color: '#555' }}>
                        {formatEur(getBreakdownAmount(r.clearingBreakdown || [], label))}
                      </AmountCell>
                    ))}
                    {renderAmountWithDelta(opSum, r.countryId, 'billing', false, r.name, { borderLeft: '2px solid #e0e0e0' })}
                    {isOpExpanded && operationalLabels.map(label => (
                      <AmountCell key={label} style={{ fontSize: 10, color: '#555' }}>
                        {formatEur(getBreakdownAmount(r.operationalBreakdown || [], label))}
                      </AmountCell>
                    ))}
                    <AmountCell style={{ borderLeft: '2px solid #e0e0e0' }}>
                      {formatEur(ctSum)}
                    </AmountCell>
                    {isCtExpanded && contractualLabels.map(label => (
                      <AmountCell key={label} style={{ fontSize: 10, color: '#555' }}>
                        {formatEur(getBreakdownAmount(r.contractualBreakdown || [], label))}
                      </AmountCell>
                    ))}
                    {renderAmountWithDelta(r.balanceOpenItems, r.countryId, 'balance', true, r.name, { background: DARK_COL_BG_ROW })}
                  </tr>
                );
              })}
            </tbody>
          </CompactTable>
          </TableScroll>
        </Card>
      )}

      {!loading && rows.length === 0 && period && (
        <Card>
          <p style={{ textAlign: 'center', color: '#999' }}>
            No data found. Select a period to load data.
          </p>
        </Card>
      )}

      {breakdownOpen && (
        <ModalOverlay onClick={() => setBreakdownOpen(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{breakdownTitle}</ModalTitle>
              <ModalClose onClick={() => setBreakdownOpen(false)}>&times;</ModalClose>
            </ModalHeader>
            <ModalBody>
              {breakdownLoading && <Spinner />}
              {!breakdownLoading && breakdownData && (
                <BreakdownTable>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Reference</th>
                      {breakdownData.lines.some(l => l.date) && <th>Date</th>}
                      <th style={{ textAlign: 'right' }}>EUR Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownData.lines.map((line, i) => (
                      <tr key={i}>
                        <td>{line.desc}</td>
                        <td>{line.ref}</td>
                        {breakdownData.lines.some(l => l.date) && <td>{line.date || ''}</td>}
                        <td style={{ textAlign: 'right' }}>{formatEur(line.amount)}</td>
                      </tr>
                    ))}
                    <BreakdownTotal>
                      <td colSpan={breakdownData.lines.some(l => l.date) ? 3 : 2}><strong>TOTAL</strong></td>
                      <td style={{ textAlign: 'right' }}><strong>{formatEur(breakdownData.total)}</strong></td>
                    </BreakdownTotal>
                  </tbody>
                </BreakdownTable>
              )}
            </ModalBody>
          </ModalBox>
        </ModalOverlay>
      )}
    </div>
  );
}
