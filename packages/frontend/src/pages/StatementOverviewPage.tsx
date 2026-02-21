import React, { useEffect, useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { formatEur, generatePeriodOptions, getDefaultPeriod, formatPeriodLabel } from '../utils/format';
import type { OverviewRow } from '@sixt/shared';
import {
  PageTitle, Card, Button, Select, Label, FormGroup, FormRow,
  Table, Spinner, Alert, AmountCell, SubtotalRow, Input, SectionTitle,
} from '../components/ui';
import { theme } from '../styles/theme';

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

const SmallButton = styled(Button)`
  padding: 3px 7px;
  font-size: 10px;
  margin: 0 1px;
`;

const DownloadGroup = styled.div`
  display: flex;
  gap: 1px;
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

const DeltaSpan = styled.span<{ $level: 'normal' | 'warning' | 'danger' }>`
  font-size: 9px;
  font-weight: 600;
  margin-left: 3px;
  color: ${p =>
    p.$level === 'danger' ? theme.colors.danger :
    p.$level === 'warning' ? '#e6a800' :
    theme.colors.textSecondary};
`;

type CategoryKey = 'clearing' | 'billing' | 'total' | 'overdue' | 'due' | 'sixt' | 'partner' | 'balance';

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'clearing', label: 'Clearing' },
  { key: 'billing', label: 'Billing' },
  { key: 'total', label: 'Total' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'due', label: 'Due' },
  { key: 'sixt', label: 'Pmt Sixt' },
  { key: 'partner', label: 'Pmt Partner' },
  { key: 'balance', label: 'Balance' },
];

const DEFAULT_THRESHOLDS: Record<CategoryKey, { warn: number; danger: number }> = {
  clearing: { warn: 50, danger: 100 },
  billing: { warn: 50, danger: 100 },
  total: { warn: 50, danger: 100 },
  overdue: { warn: 50, danger: 100 },
  due: { warn: 50, danger: 100 },
  sixt: { warn: 50, danger: 100 },
  partner: { warn: 50, danger: 100 },
  balance: { warn: 50, danger: 100 },
};

function getPreviousPeriod(period: string): string {
  const year = parseInt(period.substring(0, 4), 10);
  const month = parseInt(period.substring(4, 6), 10);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getPreviousPeriods(period: string, count: number): string[] {
  const year = parseInt(period.substring(0, 4), 10);
  const month = parseInt(period.substring(4, 6), 10);
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(year, month - 1 - i, 1);
    result.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

function shortPeriod(p: string): string {
  const m = parseInt(p.substring(4, 6), 10);
  const y = p.substring(2, 4);
  const abbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${abbr[m - 1]} ${y}`;
}

function rowValue(row: OverviewRow, key: CategoryKey): number {
  switch (key) {
    case 'clearing': return row.clearingSubtotal;
    case 'billing': return row.billingSubtotal;
    case 'total': return row.totalInterfacingDue;
    case 'overdue': return row.overdueBalance;
    case 'due': return row.dueBalance;
    case 'sixt': return row.paymentBySixt;
    case 'partner': return row.paymentByPartner;
    case 'balance': return row.balanceOpenItems;
  }
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

export default function StatementOverviewPage() {
  const [rows, setRows] = useState<OverviewRow[]>([]);
  const [prevRows, setPrevRows] = useState<OverviewRow[]>([]);
  const [period, setPeriod] = useState(getDefaultPeriod());
  const [releaseDate, setReleaseDate] = useState('');
  const [prevReleaseDate, setPrevReleaseDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('aktiv');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [showThresholds, setShowThresholds] = useState(false);

  const periods = generatePeriodOptions();
  const last3 = getPreviousPeriods(period, 3);
  const prevPeriod = getPreviousPeriod(period);

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

  const handleDownloadPdf = async (countryId: number, fir: number, iso: string, dlPeriod: string) => {
    const key = `${countryId}-${dlPeriod}`;
    setDownloading(key);
    try {
      const res = await api.get(`/export/${countryId}/pdf`, {
        params: { period: dlPeriod, releaseDate },
        responseType: 'blob',
      });
      const disposition = res.headers['content-disposition'];
      const filename = disposition
        ? decodeURIComponent(disposition.split('filename=')[1]?.replace(/"/g, ''))
        : `Interfacing_${fir}_${iso}_${dlPeriod}.pdf`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError(`Error downloading PDF for ${iso} ${dlPeriod}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadXlsx = async (countryId: number, fir: number, iso: string, dlPeriod: string) => {
    const key = `xlsx-${countryId}-${dlPeriod}`;
    setDownloading(key);
    try {
      const res = await api.get(`/export/${countryId}/xlsx`, {
        params: { period: dlPeriod, releaseDate },
        responseType: 'blob',
      });
      const disposition = res.headers['content-disposition'];
      const filename = disposition
        ? decodeURIComponent(disposition.split('filename=')[1]?.replace(/"/g, ''))
        : `Interfacing_${fir}_${iso}_${dlPeriod}.xlsx`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError(`Error downloading XLSX for ${iso} ${dlPeriod}`);
    } finally {
      setDownloading(null);
    }
  };

  const updateThreshold = (key: CategoryKey, field: 'warn' | 'danger', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setThresholds(prev => ({ ...prev, [key]: { ...prev[key], [field]: num } }));
  };

  const totals = rows.reduce(
    (acc, r) => ({
      clearing: acc.clearing + r.clearingSubtotal,
      billing: acc.billing + r.billingSubtotal,
      total: acc.total + r.totalInterfacingDue,
      overdue: acc.overdue + r.overdueBalance,
      due: acc.due + r.dueBalance,
      sixt: acc.sixt + r.paymentBySixt,
      partner: acc.partner + r.paymentByPartner,
      balance: acc.balance + r.balanceOpenItems,
    }),
    { clearing: 0, billing: 0, total: 0, overdue: 0, due: 0, sixt: 0, partner: 0, balance: 0 },
  );

  function renderAmountWithDelta(currentVal: number, countryId: number, catKey: CategoryKey, bold?: boolean) {
    const prev = prevMap[countryId];
    const prevVal = prev ? rowValue(prev, catKey) : null;
    const pct = prevVal !== null ? pctChange(currentVal, prevVal) : null;
    const t = thresholds[catKey];
    const level = getDeltaLevel(pct, t.warn, t.danger);

    return (
      <AmountCell style={bold ? { fontWeight: 600 } : undefined}>
        {formatEur(currentVal)}
        {prevVal !== null && pct !== null && pct !== 0 && (
          <DeltaSpan $level={level}>{formatPct(pct)}</DeltaSpan>
        )}
        {prevVal === null && prevRows.length > 0 && currentVal !== 0 && (
          <DeltaSpan $level="danger">new</DeltaSpan>
        )}
      </AmountCell>
    );
  }

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
              <span style={{ color: '#e6a800', fontWeight: 600 }}>■</span> warning &nbsp;
              <span style={{ color: theme.colors.danger, fontWeight: 600 }}>■</span> critical
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
                  <span style={{ color: '#e6a800' }}>⚠</span>
                  <ThresholdInput
                    type="number"
                    min="0"
                    value={thresholds[cat.key].warn}
                    onChange={e => updateThreshold(cat.key, 'warn', e.target.value)}
                  />%
                  <span style={{ color: theme.colors.danger }}>⬤</span>
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
          <TableScroll>
          <CompactTable>
            <thead>
              <tr>
                <th>FIR</th>
                <th>Country</th>
                <th>ISO</th>
                <th style={{ textAlign: 'right' }}>Clearing</th>
                <th style={{ textAlign: 'right' }}>Billing</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Overdue</th>
                <th style={{ textAlign: 'right' }}>Due</th>
                <th style={{ textAlign: 'right' }}>Pmt Sixt</th>
                <th style={{ textAlign: 'right' }}>Pmt Partner</th>
                <th style={{ textAlign: 'right' }}>Balance</th>
                <th>PDF</th>
                <th>XLSX</th>
              </tr>
            </thead>
            <tbody>
              <StickyTotalRow>
                <td colSpan={3}><strong>TOTAL ({rows.length} countries)</strong></td>
                <AmountCell><strong>{formatEur(totals.clearing)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.billing)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.total)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.overdue)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.due)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.sixt)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.partner)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.balance)}</strong></AmountCell>
                <td></td>
                <td></td>
              </StickyTotalRow>
              {rows.map((r) => (
                <tr key={r.countryId}>
                  <td>{r.fir}</td>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.iso}</td>
                  {renderAmountWithDelta(r.clearingSubtotal, r.countryId, 'clearing')}
                  {renderAmountWithDelta(r.billingSubtotal, r.countryId, 'billing')}
                  {renderAmountWithDelta(r.totalInterfacingDue, r.countryId, 'total', true)}
                  {renderAmountWithDelta(r.overdueBalance, r.countryId, 'overdue')}
                  {renderAmountWithDelta(r.dueBalance, r.countryId, 'due')}
                  {renderAmountWithDelta(r.paymentBySixt, r.countryId, 'sixt')}
                  {renderAmountWithDelta(r.paymentByPartner, r.countryId, 'partner')}
                  {renderAmountWithDelta(r.balanceOpenItems, r.countryId, 'balance', true)}
                  <td>
                    <DownloadGroup>
                      {last3.map((p) => (
                        <SmallButton
                          key={p}
                          onClick={() => handleDownloadPdf(r.countryId, r.fir, r.iso, p)}
                          disabled={downloading === `${r.countryId}-${p}`}
                          title={formatPeriodLabel(p)}
                        >
                          {downloading === `${r.countryId}-${p}` ? '...' : shortPeriod(p)}
                        </SmallButton>
                      ))}
                    </DownloadGroup>
                  </td>
                  <td>
                    <DownloadGroup>
                      {last3.map((p) => (
                        <SmallButton
                          key={p}
                          onClick={() => handleDownloadXlsx(r.countryId, r.fir, r.iso, p)}
                          disabled={downloading === `xlsx-${r.countryId}-${p}`}
                          title={`XLSX ${formatPeriodLabel(p)}`}
                          style={{ background: '#217346' }}
                        >
                          {downloading === `xlsx-${r.countryId}-${p}` ? '...' : shortPeriod(p)}
                        </SmallButton>
                      ))}
                    </DownloadGroup>
                  </td>
                </tr>
              ))}
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
    </div>
  );
}
