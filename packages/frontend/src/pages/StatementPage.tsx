import React, { useEffect, useState, useMemo, useCallback } from 'react';
import ReactSelect from 'react-select';
import api from '../utils/api';
import { formatEur, formatDateDE, generatePeriodOptions, getDefaultPeriod } from '../utils/format';
import type { StatementData, StatementLine, Country, BillingBreakdown } from '@sixt/shared';
import styled from 'styled-components';
import {
  PageTitle, Card, Button, Select, Label, FormGroup, FormRow,
  Table, AmountCell, SubtotalRow, BalanceRow, TotalRow, SectionTitle,
  Spinner, Alert,
} from '../components/ui';
import { theme } from '../styles/theme';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const periodMonthName = (p: string) => MONTH_NAMES[parseInt(p.substring(4, 6), 10) - 1] || '';

const GraySectionTitle = styled(SectionTitle)<{ shade?: string }>`
  background: ${({ shade }) => shade || '#555'};
`;

const GrayTotalRow = styled(TotalRow)`
  background: #333 !important;
`;

const EditInput = styled.input`
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 12px;
  width: 100%;
  background: #fffde7;
  &:focus { border-color: ${theme.colors.primary}; outline: none; background: #fff; }
`;

const AmountInput = styled(EditInput)`
  text-align: right;
  width: 120px;
  margin-left: auto;
  display: block;
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: #c00;
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
  line-height: 1;
  opacity: 0.5;
  &:hover { opacity: 1; }
`;

const ExportBar = styled.div`
  display: flex;
  gap: 8px;
  margin: 16px 0;
`;

const BreakdownRow = styled.tr`
  background: #fafafa !important;
  td { font-size: 11px; color: #555; border-bottom: 1px solid #f0f0f0 !important; }
`;

const DeviationFlag = styled.span`
  color: #c00;
  font-weight: 700;
  margin-left: 4px;
`;

const DeviationBillingRow = styled.tr`
  background: #fff3e0 !important;
`;

export default function StatementPage() {
  const DEFAULT_COUNTRY_ID = '335';
  const DEFAULT_PERIOD = getDefaultPeriod();

  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState(DEFAULT_COUNTRY_ID);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [releaseDate, setReleaseDate] = useState('');
  const [paymentTermDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState('aktiv');
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dueUntilLabel, setDueUntilLabel] = useState('');
  const [balanceLabel, setBalanceLabel] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);

  const clearingSubtotal = useMemo(() =>
    statement?.clearing.reduce((s, l) => s + l.amount, 0) ?? 0,
  [statement?.clearing]);

  const billingSubtotal = useMemo(() =>
    statement?.billing.reduce((s, l) => s + l.amount, 0) ?? 0,
  [statement?.billing]);

  const totalInterfacingDue = useMemo(() =>
    clearingSubtotal + billingSubtotal,
  [clearingSubtotal, billingSubtotal]);

  const computedAccount = useMemo(() => {
    if (!statement || !dueUntilLabel) return null;
    const items = statement.accountStatement.previousMonthItems || [];
    const cutoff = dueUntilLabel;
    const overdueBalance = items
      .filter(i => i.nettofaelligkeit && i.nettofaelligkeit < cutoff)
      .reduce((s, i) => s + i.amount, 0);
    const dueBalance = items
      .filter(i => i.nettofaelligkeit && i.nettofaelligkeit >= cutoff)
      .reduce((s, i) => s + i.amount, 0);
    const balanceOpenItems =
      overdueBalance + dueBalance +
      statement.accountStatement.paymentBySixt +
      statement.accountStatement.paymentByPartner +
      totalInterfacingDue;
    return { overdueBalance, dueBalance, balanceOpenItems };
  }, [statement, dueUntilLabel, totalInterfacingDue]);

  const periods = generatePeriodOptions();

  const countryOptions = useMemo(() =>
    countries.map(c => ({ value: String(c.id), label: `${c.fir} - ${c.name} (${c.iso})` })),
  [countries]);

  const selectedCountryOption = useMemo(() =>
    countryOptions.find(o => o.value === countryId) || null,
  [countryOptions, countryId]);

  useEffect(() => {
    if (!period) return;
    api.get(`/planning/${period}`)
      .then(res => {
        const plan = res.data.data;
        if (plan?.releaseDate) {
          setReleaseDate(plan.releaseDate);
        } else {
          setReleaseDate(new Date().toISOString().split('T')[0]);
        }
      })
      .catch(() => setReleaseDate(new Date().toISOString().split('T')[0]));
  }, [period]);

  useEffect(() => {
    api.get('/countries', { params: { status: statusFilter !== 'alle' ? statusFilter : undefined } })
      .then((res) => {
        setCountries(res.data.data);
      })
      .catch(() => {});
  }, [statusFilter]);

  useEffect(() => {
    if (!countryId || !period || !releaseDate) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setStatement(null);

    api.get(`/statement/${countryId}`, {
      params: { period, releaseDate, paymentTermDays },
    })
      .then(res => {
        if (cancelled) return;
        setStatement(res.data.data);
        setDueUntilLabel(res.data.data.accountStatement.dueUntilDate);
        const bal = res.data.data.accountStatement.balanceOpenItems;
        setBalanceLabel(bal < 0 ? 'Payment is kindly requested' : 'Payment will be initiated by Sixt');
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err.response?.data?.error || 'Error loading statement.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [countryId, period, releaseDate]);

  const updateClearingLine = useCallback((index: number, field: keyof StatementLine, value: string) => {
    setStatement(prev => {
      if (!prev) return prev;
      const clearing = [...prev.clearing];
      if (field === 'amount') {
        clearing[index] = { ...clearing[index], amount: parseFloat(value) || 0 };
      } else {
        clearing[index] = { ...clearing[index], [field]: value };
      }
      return { ...prev, clearing };
    });
  }, []);

  const deleteClearingLine = useCallback((index: number) => {
    setStatement(prev => {
      if (!prev) return prev;
      const clearing = prev.clearing.filter((_, i) => i !== index);
      return { ...prev, clearing };
    });
  }, []);

  const addClearingLine = useCallback(() => {
    setStatement(prev => {
      if (!prev) return prev;
      const newLine: StatementLine = { type: 'Clearing', description: '', reference: '', amount: 0 };
      return { ...prev, clearing: [...prev.clearing, newLine] };
    });
  }, []);

  const updateBillingLine = useCallback((index: number, field: keyof StatementLine, value: string) => {
    setStatement(prev => {
      if (!prev) return prev;
      const billing = [...prev.billing];
      if (field === 'amount') {
        billing[index] = { ...billing[index], amount: parseFloat(value) || 0 };
      } else {
        billing[index] = { ...billing[index], [field]: value };
      }
      return { ...prev, billing };
    });
  }, []);

  const deleteBillingLine = useCallback((index: number) => {
    setStatement(prev => {
      if (!prev) return prev;
      const billing = prev.billing.filter((_, i) => i !== index);
      return { ...prev, billing };
    });
  }, []);

  const addBillingLine = useCallback(() => {
    setStatement(prev => {
      if (!prev) return prev;
      const newLine: StatementLine = { type: 'Invoice', description: '', reference: '', date: '', amount: 0 };
      return { ...prev, billing: [...prev.billing, newLine] };
    });
  }, []);

  const breakdownMap = useMemo(() => {
    const map = new Map<string, BillingBreakdown>();
    if (statement?.billingBreakdowns) {
      for (const bd of statement.billingBreakdowns) {
        map.set(bd.sapDescription.toLowerCase(), bd);
      }
    }
    return map;
  }, [statement?.billingBreakdowns]);

  const getExportData = useCallback((): any | null => {
    if (!statement) return null;
    return {
      ...statement,
      clearingSubtotal,
      billingSubtotal,
      totalInterfacingDue,
      balanceLabel,
      accountStatement: {
        ...statement.accountStatement,
        overdueBalance: computedAccount?.overdueBalance ?? 0,
        dueBalance: computedAccount?.dueBalance ?? 0,
        totalInterfacingAmount: totalInterfacingDue,
        balanceOpenItems: computedAccount?.balanceOpenItems ?? 0,
      },
    };
  }, [statement, clearingSubtotal, billingSubtotal, totalInterfacingDue, computedAccount, balanceLabel]);

  const saveCorrection = useCallback(async (data: any) => {
    try {
      const cid = data?.country?.id ?? Number(countryId);
      await api.post('/export/corrections', {
        countryId: cid,
        period,
        data,
      });
    } catch {
      // non-blocking – correction save failure should not prevent export
    }
  }, [countryId, period]);

  const handleExportPdf = async () => {
    const data = getExportData();
    if (!data) return;
    setExportingPdf(true);
    try {
      const res = await api.post('/export/render/pdf', data, { responseType: 'blob' });
      const disposition = res.headers['content-disposition'];
      const filename = disposition
        ? decodeURIComponent(disposition.split('filename=')[1]?.replace(/"/g, ''))
        : `Statement_${period}.pdf`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      await saveCorrection(data);
    } catch {
      setError('Error exporting PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportXlsx = async () => {
    const data = getExportData();
    if (!data) return;
    setExportingXlsx(true);
    try {
      const res = await api.post('/export/render/xlsx', data, { responseType: 'blob' });
      const disposition = res.headers['content-disposition'];
      const filename = disposition
        ? decodeURIComponent(disposition.split('filename=')[1]?.replace(/"/g, ''))
        : `Statement_${period}.xlsx`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      await saveCorrection(data);
    } catch {
      setError('Error exporting XLSX.');
    } finally {
      setExportingXlsx(false);
    }
  };

  return (
    <div>
      <PageTitle>Monthly Interfacing Statement</PageTitle>

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
          <FormGroup style={{ minWidth: 300 }}>
            <Label>Country</Label>
            <ReactSelect
              options={countryOptions}
              value={selectedCountryOption}
              onChange={(opt) => setCountryId(opt?.value || '')}
              placeholder="Search country..."
              isClearable
              styles={{
                control: (base) => ({ ...base, minHeight: 38, borderColor: '#ddd', '&:hover': { borderColor: theme.colors.primary } }),
                option: (base, state) => ({ ...base, fontSize: 13, background: state.isSelected ? theme.colors.primary : state.isFocused ? '#fff3e0' : 'white', color: state.isSelected ? 'white' : '#333' }),
                singleValue: (base) => ({ ...base, fontSize: 13 }),
                input: (base) => ({ ...base, fontSize: 13 }),
              }}
            />
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
        </FormRow>
      </Card>

      {loading && <Spinner />}

      {statement && (
        <>
          <ExportBar>
            <Button onClick={handleExportPdf} disabled={exportingPdf} style={{ padding: '8px 20px' }}>
              {exportingPdf ? 'Exporting...' : 'Export PDF'}
            </Button>
            <Button onClick={handleExportXlsx} disabled={exportingXlsx} style={{ padding: '8px 20px', background: '#217346' }}>
              {exportingXlsx ? 'Exporting...' : 'Export XLSX'}
            </Button>
          </ExportBar>

          <GraySectionTitle shade="#4a4a4a">CLEARING STATEMENT</GraySectionTitle>
          <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
            <Table>
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th style={{ textAlign: 'right' }}>EUR Amount</th>
                </tr>
              </thead>
              <tbody>
                {statement.clearing.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>No clearing items</td></tr>
                )}
                {statement.clearing.map((line, i) => (
                  <tr key={i}>
                    <td><DeleteBtn onClick={() => deleteClearingLine(i)} title="Delete line">×</DeleteBtn></td>
                    <td>
                      <EditInput value={line.type} onChange={e => updateClearingLine(i, 'type', e.target.value)} />
                    </td>
                    <td>
                      <EditInput value={line.description} onChange={e => updateClearingLine(i, 'description', e.target.value)} />
                    </td>
                    <td>
                      <EditInput value={line.reference} onChange={e => updateClearingLine(i, 'reference', e.target.value)} />
                    </td>
                    <td>
                      <AmountInput
                        type="number"
                        step="0.01"
                        value={line.amount}
                        onChange={e => updateClearingLine(i, 'amount', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} style={{ padding: '4px 6px' }}>
                    <Button onClick={addClearingLine} style={{ padding: '3px 12px', fontSize: 11, background: '#888' }}>
                      + Add row
                    </Button>
                  </td>
                </tr>
                <SubtotalRow>
                  <td></td>
                  <td colSpan={3}><strong>SUBTOTAL</strong></td>
                  <AmountCell><strong>{formatEur(clearingSubtotal)}</strong></AmountCell>
                </SubtotalRow>
              </tbody>
            </Table>
          </Card>

          <GraySectionTitle shade="#5a5a5a">BILLING STATEMENT</GraySectionTitle>
          <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
            <Table>
              <thead>
                <tr>
                  <th style={{ width: 30 }}></th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>EUR Amount</th>
                </tr>
              </thead>
              <tbody>
                {statement.billing.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999' }}>No billing items</td></tr>
                )}
                {statement.billing.map((line, i) => {
                  const bd = breakdownMap.get(line.description.toLowerCase());
                  const BillingTr = bd?.hasDeviation ? DeviationBillingRow : 'tr' as any;
                  return (
                    <React.Fragment key={i}>
                      <BillingTr>
                        <td><DeleteBtn onClick={() => deleteBillingLine(i)} title="Delete line">×</DeleteBtn></td>
                        <td>
                          <EditInput value={line.type} onChange={e => updateBillingLine(i, 'type', e.target.value)} />
                        </td>
                        <td>
                          <EditInput value={line.description} onChange={e => updateBillingLine(i, 'description', e.target.value)} />
                        </td>
                        <td>
                          <EditInput value={line.reference} onChange={e => updateBillingLine(i, 'reference', e.target.value)} />
                        </td>
                        <td>
                          <EditInput value={line.date || ''} onChange={e => updateBillingLine(i, 'date', e.target.value)} />
                        </td>
                        <td>
                          <AmountInput
                            type="number"
                            step="0.01"
                            value={line.amount}
                            onChange={e => updateBillingLine(i, 'amount', e.target.value)}
                          />
                          {bd?.hasDeviation && <DeviationFlag>⚠</DeviationFlag>}
                        </td>
                      </BillingTr>
                      {bd && bd.lines.length > 0 && bd.lines.map((sub, j) => (
                        <BreakdownRow key={`bd-${i}-${j}`}>
                          <td></td>
                          <td colSpan={4} style={{ paddingLeft: 24 }}>{sub.description}</td>
                          <AmountCell style={{ fontSize: 11, color: '#555' }}>{formatEur(sub.amount)}</AmountCell>
                        </BreakdownRow>
                      ))}
                    </React.Fragment>
                  );
                })}
                <tr>
                  <td colSpan={6} style={{ padding: '4px 6px' }}>
                    <Button onClick={addBillingLine} style={{ padding: '3px 12px', fontSize: 11, background: '#888' }}>
                      + Add row
                    </Button>
                  </td>
                </tr>
                <SubtotalRow>
                  <td></td>
                  <td colSpan={4}><strong>SUBTOTAL</strong></td>
                  <AmountCell><strong>{formatEur(billingSubtotal)}</strong></AmountCell>
                </SubtotalRow>
              </tbody>
            </Table>
          </Card>

          <Card>
            <Table>
              <tbody>
                <GrayTotalRow>
                  <td colSpan={4}><strong>TOTAL INTERFACING DUE AMOUNT</strong></td>
                  <AmountCell as="td" style={{ textAlign: 'right', color: 'white' }}>
                    <strong>{formatEur(totalInterfacingDue)}</strong>
                  </AmountCell>
                </GrayTotalRow>
              </tbody>
            </Table>
          </Card>

          <SectionTitle>ACCOUNT STATEMENT</SectionTitle>
          <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
            <Table>
              <tbody>
                <BalanceRow>
                  <td style={{ borderBottom: '2px solid #333' }}><strong>Balance as of {formatDateDE(statement.accountStatement.lastSubmissionDate)}</strong></td>
                  <AmountCell style={{ borderBottom: '2px solid #333' }}><strong>{formatEur(statement.accountStatement.previousPeriodBalance)}</strong></AmountCell>
                </BalanceRow>
                <tr>
                  <td style={{ paddingLeft: 48 }}>Overdue</td>
                  <AmountCell>{formatEur(computedAccount?.overdueBalance ?? 0)}</AmountCell>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 48 }}>Due until {formatDateDE(dueUntilLabel)}</td>
                  <AmountCell>{formatEur(computedAccount?.dueBalance ?? 0)}</AmountCell>
                </tr>
                {(statement.accountStatement.paymentBySixtItems || []).length > 0 &&
                  statement.accountStatement.paymentBySixtItems.map((item, i) => (
                    <tr key={`sixt-${i}`}>
                      <td>Payment by Sixt – {formatDateDE(item.date)}</td>
                      <AmountCell>{formatEur(item.amount)}</AmountCell>
                    </tr>
                  ))
                }
                {(statement.accountStatement.paymentByPartnerItems || []).length > 0 &&
                  statement.accountStatement.paymentByPartnerItems.map((item, i) => (
                    <tr key={`partner-${i}`}>
                      <td>Payment by you – {formatDateDE(item.date)}</td>
                      <AmountCell>{formatEur(item.amount)}</AmountCell>
                    </tr>
                  ))
                }
                <tr>
                  <td>Interfacing {periodMonthName(period)} due until {formatDateDE(statement.accountStatement.totalInterfacingDueDate)}</td>
                  <AmountCell>{formatEur(totalInterfacingDue)}</AmountCell>
                </tr>
                <BalanceRow>
                  <td style={{ borderTop: '2px solid #333' }}>
                    <strong>Balance as of {formatDateDE(statement.accountStatement.periodEndDate)} – </strong>
                    <EditInput
                      value={balanceLabel}
                      onChange={e => setBalanceLabel(e.target.value)}
                      style={{ display: 'inline-block', width: 280, fontWeight: 600 }}
                    />
                  </td>
                  <AmountCell style={{ borderTop: '2px solid #333' }}><strong>{formatEur(computedAccount?.balanceOpenItems ?? 0)}</strong></AmountCell>
                </BalanceRow>
                <tr>
                  <td colSpan={2} style={{ fontSize: 11, color: '#777', fontStyle: 'italic', paddingTop: 6, borderBottom: 'none' }}>
                    Payments that are received while processing the Interfacing (usually between 1st–15th per month) will be credited and listed in the following Interfacing.
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card>

          <GraySectionTitle shade="#7a7a7a">DEPOSIT</GraySectionTitle>
          <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
            <Table>
              <tbody>
                <tr>
                  <td>Deposit held</td>
                  <AmountCell>XXX EUR</AmountCell>
                </tr>
                <tr>
                  <td>Deposit due</td>
                  <AmountCell>XXX EUR</AmountCell>
                </tr>
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
