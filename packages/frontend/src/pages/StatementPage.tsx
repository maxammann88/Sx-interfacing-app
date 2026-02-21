import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../utils/api';
import { formatEur, formatDateDE, generatePeriodOptions, getDefaultPeriod } from '../utils/format';
import type { StatementData, StatementLine, Country } from '@sixt/shared';
import styled from 'styled-components';
import {
  PageTitle, Card, Button, Select, Label, FormGroup, FormRow,
  Table, AmountCell, SubtotalRow, TotalRow, SectionTitle,
  Spinner, Alert,
} from '../components/ui';
import { theme } from '../styles/theme';

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
  const [autoLoaded, setAutoLoaded] = useState(false);
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
        if (!autoLoaded && countryId && period) {
          setAutoLoaded(true);
        }
      })
      .catch(() => {});
  }, [statusFilter]);

  useEffect(() => {
    if (autoLoaded && countryId && period && !statement && !loading) {
      loadStatement();
    }
  }, [autoLoaded]);

  const loadStatement = async () => {
    if (!countryId || !period) {
      setError('Please select a country and accounting period.');
      return;
    }
    setLoading(true);
    setError('');
    setStatement(null);

    try {
      const res = await api.get(`/statement/${countryId}`, {
        params: { period, releaseDate, paymentTermDays },
      });
      setStatement(res.data.data);
      setDueUntilLabel(res.data.data.accountStatement.dueUntilDate);
      const bal = res.data.data.accountStatement.balanceOpenItems;
      setBalanceLabel(bal < 0 ? 'Payment is kindly requested' : 'Payment will be initiated by Sixt');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error loading statement.');
    } finally {
      setLoading(false);
    }
  };

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
          <FormGroup>
            <Label>Country</Label>
            <Select value={countryId} onChange={(e) => setCountryId(e.target.value)}>
              <option value="">-- Select country --</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fir} - {c.name} ({c.iso})
                </option>
              ))}
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
          <FormGroup>
            <Label>&nbsp;</Label>
            <Button onClick={loadStatement} disabled={loading}>
              {loading ? 'Loading...' : 'Load Statement'}
            </Button>
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
                {statement.billing.map((line, i) => (
                  <tr key={i}>
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
                    </td>
                  </tr>
                ))}
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
                <tr>
                  <td>Account Balance Previous Month - Overdue (excl. Interest Amount)</td>
                  <AmountCell>{formatEur(computedAccount?.overdueBalance ?? 0)}</AmountCell>
                </tr>
                <tr>
                  <td>Account Balance Previous Month - due until <span style={{ color: '#c00', fontWeight: 600 }}>{formatDateDE(dueUntilLabel)}</span></td>
                  <AmountCell>{formatEur(computedAccount?.dueBalance ?? 0)}</AmountCell>
                </tr>
                {(statement.accountStatement.paymentBySixtItems || []).length > 0 ? (
                  statement.accountStatement.paymentBySixtItems.map((item, i) => (
                    <tr key={`sixt-${i}`}>
                      <td>Payment by Sixt – {formatDateDE(item.date)}</td>
                      <AmountCell>{formatEur(item.amount)}</AmountCell>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>Payment by Sixt – {formatDateDE(dueUntilLabel)}</td>
                    <AmountCell>{formatEur(0)}</AmountCell>
                  </tr>
                )}
                {(statement.accountStatement.paymentByPartnerItems || []).length > 0 ? (
                  statement.accountStatement.paymentByPartnerItems.map((item, i) => (
                    <tr key={`partner-${i}`}>
                      <td>Payment by you – {formatDateDE(item.date)}</td>
                      <AmountCell>{formatEur(item.amount)}</AmountCell>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>Payment by you – {formatDateDE(dueUntilLabel)}</td>
                    <AmountCell>{formatEur(0)}</AmountCell>
                  </tr>
                )}
                <tr>
                  <td>Total Interfacing Amount – due <span style={{ color: '#c00', fontWeight: 600 }}>{formatDateDE(statement.accountStatement.totalInterfacingDueDate)}</span></td>
                  <AmountCell>{formatEur(totalInterfacingDue)}</AmountCell>
                </tr>
                <SubtotalRow>
                  <td>
                    <strong>Balance (Open Items) – </strong>
                    <EditInput
                      value={balanceLabel}
                      onChange={e => setBalanceLabel(e.target.value)}
                      style={{ display: 'inline-block', width: 280, fontWeight: 600 }}
                    />
                  </td>
                  <AmountCell><strong>{formatEur(computedAccount?.balanceOpenItems ?? 0)}</strong></AmountCell>
                </SubtotalRow>
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
