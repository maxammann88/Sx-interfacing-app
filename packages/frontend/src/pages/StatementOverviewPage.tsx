import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { formatEur, generatePeriodOptions, getDefaultPeriod, formatPeriodLabel } from '../utils/format';
import type { OverviewRow } from '@sixt/shared';
import {
  PageTitle, Card, Button, Select, Input, Label, FormGroup, FormRow,
  Table, Spinner, Alert, AmountCell, SubtotalRow,
} from '../components/ui';
import { theme } from '../styles/theme';

const SmallButton = styled(Button)`
  padding: 4px 10px;
  font-size: 11px;
  margin: 0 2px;
`;

const DownloadGroup = styled.div`
  display: flex;
  gap: 2px;
`;

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

export default function StatementOverviewPage() {
  const [rows, setRows] = useState<OverviewRow[]>([]);
  const [period, setPeriod] = useState(getDefaultPeriod());
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('aktiv');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const periods = generatePeriodOptions();
  const last3 = getPreviousPeriods(period, 3);

  const loadOverview = async () => {
    if (!period) {
      setError('Bitte Accounting Period wählen.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/statement/overview', {
        params: {
          period,
          releaseDate,
          status: statusFilter !== 'alle' ? statusFilter : undefined,
        },
      });
      setRows(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden der Übersicht.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period) loadOverview();
  }, []);

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
      setError(`Fehler beim Download für ${iso} ${dlPeriod}`);
    } finally {
      setDownloading(null);
    }
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

  return (
    <div>
      <PageTitle>Statement Overview</PageTitle>

      {error && <Alert $type="error">{error}</Alert>}

      <Card>
        <FormRow>
          <FormGroup>
            <Label>Status-Filter</Label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="alle">Alle</option>
              <option value="aktiv">Aktiv</option>
              <option value="inaktiv">Inaktiv</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Accounting Period</Label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="">-- Monat wählen --</option>
              {periods.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Release Date</Label>
            <Input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
          </FormGroup>
          <FormGroup>
            <Label>&nbsp;</Label>
            <Button onClick={loadOverview} disabled={loading}>
              {loading ? 'Lade...' : 'Übersicht laden'}
            </Button>
          </FormGroup>
        </FormRow>
      </Card>

      {loading && <Spinner />}

      {!loading && rows.length > 0 && (
        <Card style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <th>FIR</th>
                <th>Land</th>
                <th>ISO</th>
                <th style={{ textAlign: 'right' }}>Clearing</th>
                <th style={{ textAlign: 'right' }}>Billing</th>
                <th style={{ textAlign: 'right' }}>Total Interfacing</th>
                <th style={{ textAlign: 'right' }}>Overdue</th>
                <th style={{ textAlign: 'right' }}>Due</th>
                <th style={{ textAlign: 'right' }}>Pmt Sixt</th>
                <th style={{ textAlign: 'right' }}>Pmt Partner</th>
                <th style={{ textAlign: 'right' }}>Balance</th>
                <th>PDF Download</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.countryId}>
                  <td>{r.fir}</td>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.iso}</td>
                  <AmountCell>{formatEur(r.clearingSubtotal)}</AmountCell>
                  <AmountCell>{formatEur(r.billingSubtotal)}</AmountCell>
                  <AmountCell style={{ fontWeight: 600 }}>{formatEur(r.totalInterfacingDue)}</AmountCell>
                  <AmountCell>{formatEur(r.overdueBalance)}</AmountCell>
                  <AmountCell>{formatEur(r.dueBalance)}</AmountCell>
                  <AmountCell>{formatEur(r.paymentBySixt)}</AmountCell>
                  <AmountCell>{formatEur(r.paymentByPartner)}</AmountCell>
                  <AmountCell style={{ fontWeight: 600 }}>{formatEur(r.balanceOpenItems)}</AmountCell>
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
                </tr>
              ))}
              <SubtotalRow>
                <td colSpan={3}><strong>TOTAL ({rows.length} Länder)</strong></td>
                <AmountCell><strong>{formatEur(totals.clearing)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.billing)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.total)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.overdue)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.due)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.sixt)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.partner)}</strong></AmountCell>
                <AmountCell><strong>{formatEur(totals.balance)}</strong></AmountCell>
                <td></td>
              </SubtotalRow>
            </tbody>
          </Table>
        </Card>
      )}

      {!loading && rows.length === 0 && period && (
        <Card>
          <p style={{ textAlign: 'center', color: '#999' }}>
            Keine Daten gefunden. Bitte "Übersicht laden" klicken.
          </p>
        </Card>
      )}
    </div>
  );
}
