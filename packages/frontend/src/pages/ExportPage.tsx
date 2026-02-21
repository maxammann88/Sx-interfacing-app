import React, { useEffect, useState, useCallback } from 'react';
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
  const [releaseDate, setReleaseDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<number | null>(null);
  const [exportingXlsx, setExportingXlsx] = useState<number | null>(null);
  const [bulkExporting, setBulkExporting] = useState(false);
  const [bulkExportingXlsx, setBulkExportingXlsx] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkProgressXlsx, setBulkProgressXlsx] = useState(0);
  const [previewing, setPreviewing] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState<Record<number, { creator: string | null; reviewer: string | null }>>({});

  const periods = generatePeriodOptions();

  useEffect(() => {
    if (!period) return;
    api.get(`/planning/${period}`)
      .then(res => {
        const plan = res.data.data;
        setReleaseDate(plan?.releaseDate || new Date().toISOString().split('T')[0]);
      })
      .catch(() => {
        setReleaseDate(new Date().toISOString().split('T')[0]);
      });

    api.get('/planning/assignments', { params: { period } })
      .then(res => {
        const map: Record<number, { creator: string | null; reviewer: string | null }> = {};
        (res.data.data as { countryId: number; creator: string | null; reviewer: string | null }[]).forEach(a => {
          map[a.countryId] = { creator: a.creator, reviewer: a.reviewer };
        });
        setAssignments(map);
      })
      .catch(() => setAssignments({}));
  }, [period]);

  useEffect(() => {
    api.get('/countries', { params: { status: 'aktiv' } })
      .then((res) => setCountries(res.data.data))
      .catch((err) => setError(err.response?.data?.error || 'Error loading data'))
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
      setError('Please select an accounting period first.');
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
      setError('Error during PDF export. Please check if Puppeteer is installed.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportXlsx = async (countryId: number) => {
    if (!period) {
      setError('Please select an accounting period first.');
      return;
    }
    setExportingXlsx(countryId);
    setError('');

    try {
      const res = await api.get(`/export/${countryId}/xlsx`, {
        params: { period, releaseDate },
        responseType: 'blob',
      });
      const disposition = res.headers['content-disposition'];
      const filename = disposition
        ? decodeURIComponent(disposition.split('filename=')[1]?.replace(/"/g, ''))
        : `Interfacing_${countryId}_${period}.xlsx`;
      downloadBlob(new Blob([res.data]), filename);
    } catch {
      setError('Error during XLSX export.');
    } finally {
      setExportingXlsx(null);
    }
  };

  const handleBulkExport = async () => {
    if (!period) {
      setError('Please select an accounting period first.');
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
      setError('Error during bulk export. This process may take a few minutes.');
    } finally {
      setBulkExporting(false);
      setBulkProgress(0);
    }
  };

  const handleBulkExportXlsx = async () => {
    if (!period) {
      setError('Please select an accounting period first.');
      return;
    }
    setBulkExportingXlsx(true);
    setBulkProgressXlsx(10);
    setError('');

    try {
      const progressTimer = setInterval(() => {
        setBulkProgressXlsx(prev => Math.min(prev + 3, 90));
      }, 800);

      const res = await api.get('/export/bulk/xlsx', {
        params: { period, releaseDate },
        responseType: 'blob',
        timeout: 600000,
      });

      clearInterval(progressTimer);
      setBulkProgressXlsx(100);

      const disposition = res.headers['content-disposition'];
      const filename = disposition
        ? decodeURIComponent(disposition.split('filename=')[1]?.replace(/"/g, ''))
        : `Interfacing_${period}_XLSX.zip`;
      downloadBlob(new Blob([res.data], { type: 'application/zip' }), filename);
    } catch {
      setError('Error during bulk XLSX export.');
    } finally {
      setBulkExportingXlsx(false);
      setBulkProgressXlsx(0);
    }
  };

  const handlePreview = async (country: Country) => {
    if (!period) {
      setError('Please select an accounting period first.');
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
      setError('Error loading preview.');
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
      <PageTitle>Export</PageTitle>

      {error && <Alert $type="error">{error}</Alert>}

      <Card>
        <FormRow>
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
            <BulkButton
              onClick={handleBulkExport}
              disabled={bulkExporting || !period}
            >
              {bulkExporting ? 'Exporting all...' : 'Export all PDFs (ZIP)'}
            </BulkButton>
          </FormGroup>
          <FormGroup>
            <Label>&nbsp;</Label>
            <BulkButton
              onClick={handleBulkExportXlsx}
              disabled={bulkExportingXlsx || !period}
              style={{ background: '#217346' }}
            >
              {bulkExportingXlsx ? 'Exporting all...' : 'Export all XLSX (ZIP)'}
            </BulkButton>
          </FormGroup>
        </FormRow>
        {bulkExporting && (
          <>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              Generating PDFs for {countries.length} countries... ({Math.round(bulkProgress)}%)
            </div>
            <ProgressBar $pct={bulkProgress} />
          </>
        )}
        {bulkExportingXlsx && (
          <>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              Generating XLSX for {countries.length} countries... ({Math.round(bulkProgressXlsx)}%)
            </div>
            <ProgressBar $pct={bulkProgressXlsx} />
          </>
        )}
      </Card>

      <Card style={{ overflowX: 'auto' }}>
        <Table>
          <thead>
            <tr>
              <th>FIR</th>
              <th>Country</th>
              <th>ISO</th>
              <th>Creator</th>
              <th>Reviewer</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => {
              const a = assignments[c.id];
              return (
              <tr key={c.id}>
                <td>{c.fir}</td>
                <td><strong>{c.name}</strong></td>
                <td>{c.iso}</td>
                <td style={{ fontSize: 12, color: a?.creator ? theme.colors.textPrimary : '#ccc' }}>
                  {a?.creator || '–'}
                </td>
                <td style={{ fontSize: 12, color: a?.reviewer ? theme.colors.textPrimary : '#ccc' }}>
                  {a?.reviewer || '–'}
                </td>
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
                    {exporting === c.id ? 'Exporting...' : 'PDF'}
                  </Button>
                  <Button
                    onClick={() => handleExportXlsx(c.id)}
                    disabled={exportingXlsx === c.id || !period}
                    style={{ padding: '6px 14px', fontSize: '12px', marginLeft: 4, background: '#217346' }}
                  >
                    {exportingXlsx === c.id ? 'Exporting...' : 'XLSX'}
                  </Button>
                </td>
              </tr>
              );
            })}
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
