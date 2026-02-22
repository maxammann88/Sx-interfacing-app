import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { formatDate, formatEur, getDefaultPeriod } from '../utils/format';
import {
  PageTitle, Card, Table, Spinner, Alert, Select, FormRow, FormGroup, Label, Input, Badge,
} from '../components/ui';
import { theme } from '../styles/theme';
import styled from 'styled-components';

const ScrollWrapper = styled.div`
  overflow-x: auto;
  overflow-y: auto;
  max-width: 100%;
  max-height: 75vh;
`;

const HeaderRow1 = styled.tr`
  th {
    position: sticky !important;
    top: 0 !important;
    z-index: 5 !important;
    padding: 6px 8px !important;
    font-size: 11px !important;
  }
`;

const HeaderRow2 = styled.tr`
  th {
    position: sticky !important;
    top: 27px !important;
    z-index: 4 !important;
    padding: 6px 8px !important;
    font-size: 11px !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }
`;

const SmallTable = styled(Table)`
  font-size: 11px;
  white-space: nowrap;
  td { padding: 4px 8px; }
`;

const SectionHeader = styled.th`
  background: ${theme.colors.primary} !important;
  color: ${theme.colors.white} !important;
  text-align: center !important;
  font-size: 11px !important;
  letter-spacing: 0.5px;
`;

interface MasterDataEntry {
  uid: string | null;
  ktod: string;
  nam1: string | null;
  nam2: string | null;
  nam3: string | null;
  str: string | null;
  ort: string | null;
  plz: string | null;
  lanb: string | null;
  payt: number | null;
}

interface CountryWithMaster {
  id: number;
  fir: number;
  debitor1: string;
  iso: string;
  kst: number | null;
  name: string;
  comment: string | null;
  verrkto: string | null;
  kreditor: string | null;
  revc: string | null;
  debitor760: string | null;
  kreditor760: string | null;
  stSchlLstRe: string | null;
  stSchlLstGs: string | null;
  revc2: string | null;
  stSchlLiefRe: string | null;
  emails: string | null;
  partnerStatus: string | null;
  zusatz: string | null;
  finalInterfacing: string | null;
  vertragsende: string | null;
  debitor10: string | null;
  paymentBlock: boolean;
  masterData: MasterDataEntry | null;
}

const BalanceCell = styled.td`
  color: ${theme.colors.danger} !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  text-align: right !important;
  white-space: nowrap;
`;

interface PaymentStatus {
  dc: 'C' | 'D';
  amount: number;
  payoutBlocked: boolean;
}

const paymentStatusByFir: Record<number, PaymentStatus> = {
  307: { dc: 'C', amount: 1293793.69, payoutBlocked: false },
  440: { dc: 'C', amount: 830217.30, payoutBlocked: false },
  186: { dc: 'C', amount: 683434.50, payoutBlocked: false },
  437: { dc: 'C', amount: 620944.90, payoutBlocked: false },
  151: { dc: 'C', amount: 549583.55, payoutBlocked: false },
  447: { dc: 'C', amount: 482876.82, payoutBlocked: false },
  133: { dc: 'C', amount: 412241.18, payoutBlocked: false },
  315: { dc: 'C', amount: 393468.21, payoutBlocked: true },
  271: { dc: 'C', amount: 384763.56, payoutBlocked: false },
  235: { dc: 'C', amount: 333957.00, payoutBlocked: false },
  120: { dc: 'C', amount: 323497.33, payoutBlocked: false },
  262: { dc: 'C', amount: 226786.72, payoutBlocked: false },
  180: { dc: 'C', amount: 192675.51, payoutBlocked: false },
  172: { dc: 'C', amount: 168007.83, payoutBlocked: false },
  420: { dc: 'C', amount: 156200.13, payoutBlocked: false },
  293: { dc: 'C', amount: 148465.56, payoutBlocked: true },
  443: { dc: 'C', amount: 126407.60, payoutBlocked: false },
  163: { dc: 'C', amount: 120312.02, payoutBlocked: false },
  423: { dc: 'C', amount: 114527.56, payoutBlocked: true },
  287: { dc: 'C', amount: 97424.58, payoutBlocked: false },
  230: { dc: 'C', amount: 96413.45, payoutBlocked: false },
  237: { dc: 'C', amount: 95592.62, payoutBlocked: false },
  171: { dc: 'C', amount: 93911.57, payoutBlocked: false },
  417: { dc: 'C', amount: 85360.00, payoutBlocked: false },
  305: { dc: 'C', amount: 84019.81, payoutBlocked: false },
  115: { dc: 'C', amount: 60612.25, payoutBlocked: false },
  159: { dc: 'C', amount: 56054.14, payoutBlocked: false },
  126: { dc: 'C', amount: 53783.45, payoutBlocked: false },
  182: { dc: 'C', amount: 50529.48, payoutBlocked: true },
  406: { dc: 'C', amount: 47469.81, payoutBlocked: false },
  412: { dc: 'C', amount: 46992.96, payoutBlocked: false },
  238: { dc: 'C', amount: 45821.52, payoutBlocked: false },
  207: { dc: 'C', amount: 40412.38, payoutBlocked: true },
  299: { dc: 'C', amount: 39931.85, payoutBlocked: false },
  242: { dc: 'C', amount: 34446.58, payoutBlocked: false },
  98: { dc: 'C', amount: 33503.39, payoutBlocked: false },
  360: { dc: 'C', amount: 32484.34, payoutBlocked: false },
  179: { dc: 'C', amount: 30643.30, payoutBlocked: false },
  409: { dc: 'C', amount: 28036.94, payoutBlocked: true },
  103: { dc: 'C', amount: 25763.61, payoutBlocked: false },
  281: { dc: 'C', amount: 22067.62, payoutBlocked: false },
  408: { dc: 'C', amount: 21253.18, payoutBlocked: false },
  302: { dc: 'C', amount: 20522.84, payoutBlocked: false },
  294: { dc: 'C', amount: 19049.09, payoutBlocked: false },
  301: { dc: 'C', amount: 17024.47, payoutBlocked: true },
  421: { dc: 'C', amount: 14524.10, payoutBlocked: false },
  297: { dc: 'C', amount: 14074.87, payoutBlocked: false },
  167: { dc: 'C', amount: 12780.95, payoutBlocked: false },
  257: { dc: 'C', amount: 10758.30, payoutBlocked: false },
  247: { dc: 'C', amount: 10489.78, payoutBlocked: true },
  213: { dc: 'C', amount: 10470.19, payoutBlocked: false },
  306: { dc: 'C', amount: 9726.42, payoutBlocked: false },
  438: { dc: 'C', amount: 9670.16, payoutBlocked: false },
  292: { dc: 'C', amount: 9173.93, payoutBlocked: false },
  436: { dc: 'C', amount: 8051.86, payoutBlocked: false },
  433: { dc: 'C', amount: 7794.26, payoutBlocked: false },
  317: { dc: 'C', amount: 7325.36, payoutBlocked: false },
  446: { dc: 'C', amount: 6579.50, payoutBlocked: true },
  153: { dc: 'C', amount: 4982.26, payoutBlocked: false },
  286: { dc: 'C', amount: 4894.14, payoutBlocked: false },
  432: { dc: 'C', amount: 4848.33, payoutBlocked: false },
  225: { dc: 'C', amount: 4612.11, payoutBlocked: false },
  414: { dc: 'C', amount: 4599.15, payoutBlocked: false },
  415: { dc: 'C', amount: 4529.49, payoutBlocked: false },
  441: { dc: 'C', amount: 3844.57, payoutBlocked: false },
  188: { dc: 'C', amount: 2951.83, payoutBlocked: false },
  203: { dc: 'C', amount: 1603.79, payoutBlocked: true },
  169: { dc: 'C', amount: 1234.52, payoutBlocked: false },
  429: { dc: 'C', amount: 560.59, payoutBlocked: false },
  285: { dc: 'C', amount: 386.84, payoutBlocked: true },
  358: { dc: 'C', amount: 42.14, payoutBlocked: true },
  332: { dc: 'D', amount: 0, payoutBlocked: false },
  373: { dc: 'D', amount: 0, payoutBlocked: false },
  96: { dc: 'D', amount: 191314.82, payoutBlocked: false },
  181: { dc: 'D', amount: 63793.66, payoutBlocked: false },
  214: { dc: 'D', amount: 62611.52, payoutBlocked: false },
  309: { dc: 'D', amount: 57297.98, payoutBlocked: false },
  245: { dc: 'D', amount: 56559.08, payoutBlocked: false },
  101: { dc: 'D', amount: 47892.21, payoutBlocked: false },
  199: { dc: 'D', amount: 44403.87, payoutBlocked: false },
  178: { dc: 'D', amount: 41903.63, payoutBlocked: false },
  289: { dc: 'D', amount: 38676.58, payoutBlocked: false },
  340: { dc: 'D', amount: 30923.90, payoutBlocked: false },
  418: { dc: 'D', amount: 19714.41, payoutBlocked: false },
  329: { dc: 'D', amount: 16443.98, payoutBlocked: false },
  404: { dc: 'D', amount: 16205.83, payoutBlocked: false },
  236: { dc: 'D', amount: 15521.04, payoutBlocked: false },
  310: { dc: 'D', amount: 12495.94, payoutBlocked: false },
  425: { dc: 'D', amount: 11184.94, payoutBlocked: false },
  280: { dc: 'D', amount: 10973.01, payoutBlocked: false },
  430: { dc: 'D', amount: 7529.67, payoutBlocked: false },
  428: { dc: 'D', amount: 6150.53, payoutBlocked: false },
  201: { dc: 'D', amount: 5934.14, payoutBlocked: false },
  381: { dc: 'D', amount: 4667.33, payoutBlocked: false },
  219: { dc: 'D', amount: 4257.36, payoutBlocked: false },
  209: { dc: 'D', amount: 3763.64, payoutBlocked: false },
  164: { dc: 'D', amount: 3696.11, payoutBlocked: false },
  246: { dc: 'D', amount: 3442.73, payoutBlocked: false },
  426: { dc: 'D', amount: 2992.81, payoutBlocked: false },
  202: { dc: 'D', amount: 2953.30, payoutBlocked: false },
  448: { dc: 'D', amount: 2249.06, payoutBlocked: false },
  322: { dc: 'D', amount: 2229.35, payoutBlocked: false },
  318: { dc: 'D', amount: 2213.32, payoutBlocked: false },
  217: { dc: 'D', amount: 2050.40, payoutBlocked: false },
  442: { dc: 'D', amount: 979.85, payoutBlocked: false },
  419: { dc: 'D', amount: 611.72, payoutBlocked: false },
  427: { dc: 'D', amount: 290.00, payoutBlocked: false },
  444: { dc: 'D', amount: 157.86, payoutBlocked: false },
};

function kpiColor(value: number, low: number, high: number): string {
  if (value <= low) return theme.colors.success;
  if (value >= high) return theme.colors.danger;
  const ratio = (value - low) / (high - low);
  if (ratio < 0.5) return '#e6a700';
  return '#e05c00';
}

function seedRandom(id: number, offset: number): number {
  const x = Math.sin(id * 9301 + offset * 4973) * 10000;
  return x - Math.floor(x);
}

function getDummyKpis(countryId: number, overdueAmount: number) {
  const depositHeld = 10000;
  const opDepositIn = depositHeld > 0 ? Math.round((overdueAmount / depositHeld) * 100) : 0;
  const dsoDeviation = Math.round(seedRandom(countryId, 2) * 60 - 10);
  const overaged90d = overdueAmount > 0
    ? Math.min(100, Math.round(seedRandom(countryId, 3) * overdueAmount / 1000))
    : 0;
  return { opDepositIn, dsoDeviation, overaged90d, depositHeld };
}

export default function StammdatenViewPage() {
  const [data, setData] = useState<CountryWithMaster[]>([]);
  const [filtered, setFiltered] = useState<CountryWithMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [search, setSearch] = useState('');
  const [balanceMap, setBalanceMap] = useState<Record<number, number>>({});
  const [overdueMap, setOverdueMap] = useState<Record<number, number>>({});
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [cutoffDate, setCutoffDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payoutOverrides, setPayoutOverrides] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api.get('/master-data')
      .then((res) => {
        setData(res.data.data);
        setFiltered(res.data.data);
      })
      .catch((err) => setError(err.response?.data?.error || 'Error loading data'))
      .finally(() => setLoading(false));
  }, []);

  const loadOverview = useCallback((releaseDate: string) => {
    const period = getDefaultPeriod();
    setBalanceLoading(true);
    api.get('/statement/overview', { params: { period, releaseDate } })
      .then((res) => {
        const bMap: Record<number, number> = {};
        const oMap: Record<number, number> = {};
        (res.data.data || []).forEach((row: any) => {
          bMap[row.countryId] = row.balanceOpenItems ?? 0;
          oMap[row.countryId] = row.overdueBalance ?? 0;
        });
        setBalanceMap(bMap);
        setOverdueMap(oMap);
      })
      .catch(() => {})
      .finally(() => setBalanceLoading(false));
  }, []);

  useEffect(() => {
    loadOverview(cutoffDate);
  }, [cutoffDate, loadOverview]);

  useEffect(() => {
    let result = data;
    if (statusFilter !== 'alle') {
      result = result.filter((c) =>
        (c.partnerStatus || '').toLowerCase().includes(statusFilter)
      );
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.iso.toLowerCase().includes(s) ||
          String(c.fir).includes(s) ||
          c.debitor1.includes(s) ||
          (c.masterData?.nam1 || '').toLowerCase().includes(s) ||
          (c.masterData?.lanb || '').toLowerCase().includes(s) ||
          (c.masterData?.ort || '').toLowerCase().includes(s)
      );
    }
    setFiltered(result);
  }, [data, statusFilter, search]);

  if (loading) return <Spinner />;
  if (error) return <Alert $type="error">{error}</Alert>;

  return (
    <div>
      <PageTitle>Mandant Management ({filtered.length} entries)</PageTitle>

      <Card>
        <FormRow>
          <FormGroup>
            <Label>Status</Label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="alle">All</option>
              <option value="aktiv">Active</option>
              <option value="inaktiv">Inactive</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Search</Label>
            <Input
              placeholder="Country, ISO, FIR, Debitor, Company, City..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 300 }}
            />
          </FormGroup>
        </FormRow>
      </Card>

      <Card style={{ padding: 12 }}>
        <ScrollWrapper>
          <SmallTable>
            <thead>
              <HeaderRow1>
                <SectionHeader colSpan={23}>COUNTRY LIST</SectionHeader>
                <SectionHeader colSpan={9} style={{ background: theme.colors.secondary }}>MASTER DATA</SectionHeader>
              </HeaderRow1>
              <HeaderRow2>
                <th>FIR</th>
                <th>Debitor (1)</th>
                <th>ISO</th>
                <th>KST</th>
                <th>Country</th>
                <th style={{ color: theme.colors.danger }}>Open Balance</th>
                <th style={{ color: theme.colors.danger }}>
                  <div>Overdue Amounts</div>
                  <input
                    type="date"
                    value={cutoffDate}
                    onChange={(e) => setCutoffDate(e.target.value)}
                    style={{
                      marginTop: 3,
                      fontSize: 9,
                      padding: '1px 4px',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 4,
                      width: 110,
                      cursor: 'pointer',
                    }}
                  />
                </th>
                <th>Deposit Held</th>
                <th>O-OP% Deposit</th>
                <th>DSO Deviation</th>
                <th>Overaged 90d Ratio</th>
                <th>D/C</th>
                <th>Approval Amount</th>
                <th>Payout Blocked</th>
                <th>Comment</th>
                <th>VERRKTO</th>
                <th>Kreditor</th>
                <th>Debitor (760)</th>
                <th>Kreditor (760)</th>
                <th>Partner Status</th>
                <th>Final Interfacing</th>
                <th>Contract End</th>
                <th>Debitor (10)</th>
                <th style={{ background: '#444', color: 'white' }}>Konto (ktod)</th>
                <th style={{ background: '#444', color: 'white' }}>Name 1</th>
                <th style={{ background: '#444', color: 'white' }}>Name 2</th>
                <th style={{ background: '#444', color: 'white' }}>Name 3</th>
                <th style={{ background: '#444', color: 'white' }}>Street</th>
                <th style={{ background: '#444', color: 'white' }}>City</th>
                <th style={{ background: '#444', color: 'white' }}>PLZ</th>
                <th style={{ background: '#444', color: 'white' }}>Country</th>
                <th style={{ background: '#444', color: 'white' }}>Payment Term</th>
              </HeaderRow2>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={32} style={{ textAlign: 'center', color: '#999', padding: 20 }}>No data available</td></tr>
              )}
              {filtered.filter((c) => c.fir !== 0).map((c) => {
                const md = c.masterData;
                const overdueAmt = overdueMap[c.id] ?? Math.round(seedRandom(c.id, 5) * (balanceMap[c.id] || 10000));
                const kpi = getDummyKpis(c.id, overdueAmt);
                return (
                  <tr key={c.id}>
                    {/* Country List */}
                    <td><strong>{c.fir}</strong></td>
                    <td>{c.debitor1}</td>
                    <td>{c.iso}</td>
                    <td>{c.kst || '-'}</td>
                    <td><strong>{c.name}</strong></td>
                    <BalanceCell>
                      {balanceLoading ? '...' :
                        balanceMap[c.id] !== undefined ? formatEur(balanceMap[c.id]) : '-'}
                    </BalanceCell>
                    <BalanceCell>
                      {balanceLoading ? '...' : formatEur(overdueAmt)}
                    </BalanceCell>
                    <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {formatEur(kpi.depositHeld)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: kpiColor(kpi.opDepositIn, 30, 80) }}>
                      {kpi.opDepositIn}%
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: kpiColor(Math.abs(kpi.dsoDeviation), 5, 25) }}>
                      {kpi.dsoDeviation > 0 ? '+' : ''}{kpi.dsoDeviation} days
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: kpiColor(kpi.overaged90d, 10, 30) }}>
                      {kpi.overaged90d}%
                    </td>
                    {(() => {
                      const ps = paymentStatusByFir[c.fir];
                      if (!ps) return (<><td style={{ textAlign: 'center', color: '#ccc' }}>-</td><td style={{ textAlign: 'right', color: '#ccc' }}>-</td><td style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => setPayoutOverrides(prev => ({ ...prev, [c.fir]: !(prev[c.fir] ?? false) }))} title="Click to toggle Payout Block">{(payoutOverrides[c.fir] ?? false) ? <span style={{ color: theme.colors.danger, fontWeight: 700 }}>Y</span> : <span style={{ color: theme.colors.textLight }}>N</span>}</td></>);
                      return (
                        <>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: ps.dc === 'C' ? theme.colors.success : theme.colors.danger }}>
                            {ps.dc}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {formatEur(ps.amount)}
                          </td>
                          <td
                            style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => {
                              const current = payoutOverrides[c.fir] ?? ps.payoutBlocked;
                              setPayoutOverrides(prev => ({ ...prev, [c.fir]: !current }));
                            }}
                            title="Click to toggle Payout Block"
                          >
                            {(payoutOverrides[c.fir] ?? ps.payoutBlocked)
                              ? <span style={{ color: theme.colors.danger, fontWeight: 700 }}>Y</span>
                              : <span style={{ color: theme.colors.textLight }}>N</span>}
                          </td>
                        </>
                      );
                    })()}
                    <td>{c.comment || ''}</td>
                    <td>{c.verrkto || ''}</td>
                    <td>{c.kreditor || ''}</td>
                    <td>{c.debitor760 || ''}</td>
                    <td>{c.kreditor760 || ''}</td>
                    <td>
                      <Badge $color={
                        (c.partnerStatus || '').toLowerCase().includes('aktiv') &&
                        !(c.partnerStatus || '').toLowerCase().includes('inaktiv')
                          ? theme.colors.success
                          : theme.colors.danger
                      }>
                        {c.partnerStatus || '-'}
                      </Badge>
                    </td>
                    <td>{c.finalInterfacing || ''}</td>
                    <td>{formatDate(c.vertragsende)}</td>
                    <td>{c.debitor10 || ''}</td>
                    {/* Master Data */}
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.ktod || '-'}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}><strong>{md?.nam1 || ''}</strong></td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.nam2 || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.nam3 || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.str || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.ort || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.plz || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.lanb || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.payt != null ? `${md.payt} days` : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </SmallTable>
        </ScrollWrapper>
      </Card>
    </div>
  );
}
