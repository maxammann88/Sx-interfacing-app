import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { generatePeriodOptions, getDefaultPeriod } from '../utils/format';
import type { Country } from '@sixt/shared';
import {
  PageTitle, Card, Table, Button, Select, Input, Label, FormGroup, FormRow,
  Spinner, Alert, Badge,
} from '../components/ui';
import { theme } from '../styles/theme';

const BulkButton = styled(Button)`
  background: ${theme.colors.primary};
  font-size: 14px;
  padding: 10px 24px;
  &:disabled { opacity: 0.5; }
`;

const PreviewButton = styled(Button)`
  background: ${theme.colors.secondary};
  padding: 6px 14px;
  font-size: 12px;
  margin-right: 6px;
`;

const ProgressBar = styled.div<{ $pct: number }>`
  height: 6px;
  background: #eee;
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${p => p.$pct}%;
    background: ${theme.colors.primary};
    transition: width 0.3s;
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
  background: ${theme.colors.secondary};
  color: white;
`;

const ModalTitle = styled.span`
  font-weight: 600;
  font-size: 14px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  border-radius: 4px;
  &:hover { background: rgba(255,255,255,0.15); }
`;

export default function ExportPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [period, setPeriod] = useState(getDefaultPeriod());
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<number | null>(null);
  const [bulkExporting, setBulkExporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [previewing, setPreviewing] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [error, setError] = useState('');

  const periods = generatePeriodOptions();

  useEffect(() => {
    api.get('/countries', { params: { status: 'aktiv' } })
      .then((res) => setCountries(res.data.data))
      .catch((err) => setError(err.response?.data?.error || 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, []);

  const downloadBlob = (data: Blob, filename: string) => {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

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
      const disposition = res.headers['content-disposition'];
      const filename = disposition
        ? decodeURIComponent(disposition.split('filename=')[1]?.replace(/"/g, ''))
        : `Interfacing_${countryId}_${period}.pdf`;
      downloadBlob(new Blob([res.data]), filename);
    } catch {
      setError('Fehler beim PDF-Export. Bitte prüfen Sie, ob Puppeteer installiert ist.');
    } finally {
      setExporting(null);
    }
  };

  const handleBulkExport = async () => {
    if (!period) {
      setError('Bitte zuerst einen Abrechnungsmonat auswählen.');
      return;
    }
    setBulkExporting(true);
    setBulkProgress(10);
    setError('');

    try {
      const progressTimer = setInterval(() => {
        setBulkProgress(prev => Math.min(prev + 2, 90));
      }, 1000);

      const res = await api.get('/export/bulk/pdf', {
        params: { period, releaseDate },
        responseType: 'blob',
        timeout: 600000,
      });

      clearInterval(progressTimer);
      setBulkProgress(100);

      const disposition = res.headers['content-disposition'];
      const filename = disposition
        ? decodeURIComponent(disposition.split('filename=')[1]?.replace(/"/g, ''))
        : `Interfacing_${period}.zip`;
      downloadBlob(new Blob([res.data], { type: 'application/zip' }), filename);
    } catch {
      setError('Fehler beim Bulk-Export. Der Vorgang kann einige Minuten dauern.');
    } finally {
      setBulkExporting(false);
      setBulkProgress(0);
    }
  };

  const handlePreview = async (country: Country) => {
    if (!period) {
      setError('Bitte zuerst einen Abrechnungsmonat auswählen.');
      return;
    }
    setPreviewing(country.id);
    setError('');
    try {
      const res = await api.get(`/export/${country.id}/preview`, {
        params: { period, releaseDate },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewTitle(`${country.fir} – ${country.name} (${country.iso})`);
    } catch {
      setError('Fehler beim Laden der Vorschau.');
    } finally {
      setPreviewing(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewTitle('');
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
          <FormGroup>
            <Label>&nbsp;</Label>
            <BulkButton
              onClick={handleBulkExport}
              disabled={bulkExporting || !period}
            >
              {bulkExporting ? 'Exportiere alle...' : 'Alle PDFs exportieren (ZIP)'}
            </BulkButton>
          </FormGroup>
        </FormRow>
        {bulkExporting && (
          <>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              Generiere PDFs für {countries.length} Länder... ({Math.round(bulkProgress)}%)
            </div>
            <ProgressBar $pct={bulkProgress} />
          </>
        )}
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
                  <PreviewButton
                    onClick={() => handlePreview(c)}
                    disabled={previewing === c.id || !period}
                  >
                    {previewing === c.id ? '...' : 'Preview'}
                  </PreviewButton>
                  <Button
                    onClick={() => handleExport(c.id)}
                    disabled={exporting === c.id || !period}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    {exporting === c.id ? 'Exportiere...' : 'PDF'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {previewUrl && (
        <Overlay onClick={closePreview}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{previewTitle}</ModalTitle>
              <CloseButton onClick={closePreview}>&times;</CloseButton>
            </ModalHeader>
            <iframe
              src={previewUrl}
              style={{ flex: 1, border: 'none', width: '100%' }}
              title="PDF Preview"
            />
          </ModalContainer>
        </Overlay>
      )}
    </div>
  );
}
