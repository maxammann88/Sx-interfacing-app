import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { generatePeriodOptions } from '../utils/format';
import type { Country } from '@sixt/shared';
import {
  PageTitle, Card, Table, Button, Select, Input, Label, FormGroup, FormRow,
  Spinner, Alert, Badge,
} from '../components/ui';
import { theme } from '../styles/theme';

export default function ExportPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [period, setPeriod] = useState('');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<number | null>(null);
  const [error, setError] = useState('');

  const periods = generatePeriodOptions();

  useEffect(() => {
    api.get('/countries', { params: { status: 'aktiv' } })
      .then((res) => setCountries(res.data.data))
      .catch((err) => setError(err.response?.data?.error || 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (countryId: number) => {
    if (!period) {
      setError('Bitte zuerst einen Abrechnungsmonat auswählen.');
      return;
    }
    setExporting(countryId);
    setError('');

    try {
      const res = await api.get(`/export/${countryId}/pdf`, {
        params: { period, releaseDate },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const disposition = res.headers['content-disposition'];
      const filename = disposition
        ? disposition.split('filename=')[1]?.replace(/"/g, '')
        : `Interfacing_${countryId}_${period}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Fehler beim PDF-Export. Bitte prüfen Sie, ob Puppeteer installiert ist.');
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageTitle>PDF Export</PageTitle>

      {error && <Alert $type="error">{error}</Alert>}

      <Card>
        <FormRow>
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
        </FormRow>
      </Card>

      <Card style={{ overflowX: 'auto' }}>
        <Table>
          <thead>
            <tr>
              <th>FIR</th>
              <th>Land</th>
              <th>ISO</th>
              <th>Status</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => (
              <tr key={c.id}>
                <td>{c.fir}</td>
                <td><strong>{c.name}</strong></td>
                <td>{c.iso}</td>
                <td>
                  <Badge $color={theme.colors.success}>{c.partnerStatus}</Badge>
                </td>
                <td>
                  <Button
                    onClick={() => handleExport(c.id)}
                    disabled={exporting === c.id || !period}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    {exporting === c.id ? 'Exportiere...' : 'PDF Exportieren'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
