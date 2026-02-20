import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatEur, generatePeriodOptions } from '../utils/format';
import type { StatementData, Country } from '@sixt/shared';
import {
  PageTitle, Card, Button, Select, Input, Label, FormGroup, FormRow,
  Table, AmountCell, SubtotalRow, TotalRow, SectionTitle,
  Spinner, Alert,
} from '../components/ui';

export default function StatementPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState('');
  const [period, setPeriod] = useState('');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTermDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState('aktiv');
  const [statement, setStatement] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const periods = generatePeriodOptions();

  useEffect(() => {
    api.get('/countries', { params: { status: statusFilter !== 'alle' ? statusFilter : undefined } })
      .then((res) => setCountries(res.data.data))
      .catch(() => {});
  }, [statusFilter]);

  const loadStatement = async () => {
    if (!countryId || !period) {
      setError('Bitte Land und Abrechnungsmonat auswählen.');
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Laden des Statements.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageTitle>Monthly Interfacing Statement</PageTitle>

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
            <Label>Land</Label>
            <Select value={countryId} onChange={(e) => setCountryId(e.target.value)}>
              <option value="">-- Land wählen --</option>
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
            <Button onClick={loadStatement} disabled={loading}>
              {loading ? 'Lade...' : 'Statement laden'}
            </Button>
          </FormGroup>
        </FormRow>
      </Card>

      {loading && <Spinner />}

      {statement && (
        <>
          <SectionTitle>CLEARING STATEMENT</SectionTitle>
          <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
            <Table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Document Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>EUR Amount</th>
                </tr>
              </thead>
              <tbody>
                {statement.clearing.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>Keine Clearing-Positionen</td></tr>
                )}
                {statement.clearing.map((line, i) => (
                  <tr key={i}>
                    <td>{line.type}</td>
                    <td>{line.reference}</td>
                    <td>{line.documentType}</td>
                    <td>{line.description}</td>
                    <AmountCell>{formatEur(line.amount)}</AmountCell>
                  </tr>
                ))}
                <SubtotalRow>
                  <td colSpan={4}><strong>SUBTOTAL</strong></td>
                  <AmountCell><strong>{formatEur(statement.clearingSubtotal)}</strong></AmountCell>
                </SubtotalRow>
              </tbody>
            </Table>
          </Card>

          <SectionTitle>BILLING STATEMENT</SectionTitle>
          <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
            <Table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>EUR Amount</th>
                </tr>
              </thead>
              <tbody>
                {statement.billing.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>Keine Billing-Positionen</td></tr>
                )}
                {statement.billing.map((line, i) => (
                  <tr key={i}>
                    <td>{line.type}</td>
                    <td>{line.reference}</td>
                    <td>{line.date}</td>
                    <td>{line.description}</td>
                    <AmountCell>{formatEur(line.amount)}</AmountCell>
                  </tr>
                ))}
                <SubtotalRow>
                  <td colSpan={4}><strong>SUBTOTAL</strong></td>
                  <AmountCell><strong>{formatEur(statement.billingSubtotal)}</strong></AmountCell>
                </SubtotalRow>
              </tbody>
            </Table>
          </Card>

          <Card>
            <Table>
              <tbody>
                <TotalRow>
                  <td colSpan={4}><strong>TOTAL INTERFACING DUE AMOUNT</strong></td>
                  <AmountCell as="td" style={{ textAlign: 'right', color: 'white' }}>
                    <strong>{formatEur(statement.totalInterfacingDue)}</strong>
                  </AmountCell>
                </TotalRow>
              </tbody>
            </Table>
          </Card>

          <SectionTitle>ACCOUNT STATEMENT</SectionTitle>
          <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
            <Table>
              <tbody>
                <tr>
                  <td>Account Balance Previous Month - Overdue</td>
                  <AmountCell>{formatEur(statement.accountStatement.overdueBalance)}</AmountCell>
                </tr>
                <tr>
                  <td>Account Balance Previous Month - due until {statement.accountStatement.dueUntilDate}</td>
                  <AmountCell>{formatEur(statement.accountStatement.dueBalance)}</AmountCell>
                </tr>
                <tr>
                  <td>Payment by Sixt</td>
                  <AmountCell>{formatEur(statement.accountStatement.paymentBySixt)}</AmountCell>
                </tr>
                <tr>
                  <td>Payment by you</td>
                  <AmountCell>{formatEur(statement.accountStatement.paymentByPartner)}</AmountCell>
                </tr>
                <tr>
                  <td>Total Interfacing Amount</td>
                  <AmountCell>{formatEur(statement.accountStatement.totalInterfacingAmount)}</AmountCell>
                </tr>
                <SubtotalRow>
                  <td><strong>Balance (Open Items)</strong></td>
                  <AmountCell><strong>{formatEur(statement.accountStatement.balanceOpenItems)}</strong></AmountCell>
                </SubtotalRow>
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
