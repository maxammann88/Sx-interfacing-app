import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { generatePeriodOptions, formatDate } from '../utils/format';
import type { Upload } from '@sixt/shared';
import {
  PageTitle, Card, Button, Select, Label, FormGroup, FormRow,
  FileInput, Alert, Spinner, SectionTitle, Table, Badge,
} from '../components/ui';
import { theme } from '../styles/theme';

const UploadCard = styled(Card)`
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin-top: 0;
`;

const UploadRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
`;

const typeLabels: Record<string, string> = {
  sap: 'SAP Import',
  countries: 'Länderliste',
  'master-data': 'Stammdaten',
};

const typeColors: Record<string, string> = {
  sap: theme.colors.primary,
  countries: theme.colors.info,
  'master-data': theme.colors.success,
};

export default function ImportPage() {
  const [sapFile, setSapFile] = useState<File | null>(null);
  const [period, setPeriod] = useState('');
  const [countryFile, setCountryFile] = useState<File | null>(null);
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const sapRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  const masterRef = useRef<HTMLInputElement>(null);

  const periods = generatePeriodOptions();

  const loadUploads = useCallback(() => {
    setUploadsLoading(true);
    api.get('/uploads')
      .then((res) => setUploads(res.data.data))
      .catch(() => {})
      .finally(() => setUploadsLoading(false));
  }, []);

  useEffect(() => { loadUploads(); }, [loadUploads]);

  const handleDelete = async (id: number) => {
    if (!confirm('Upload wirklich löschen? Alle zugehörigen Daten werden entfernt.')) return;
    setDeleting(id);
    try {
      await api.delete(`/uploads/${id}`);
      loadUploads();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Fehler beim Löschen' });
    } finally {
      setDeleting(null);
    }
  };

  const handleSapUpload = async () => {
    if (!sapFile || !period) {
      setMessage({ type: 'error', text: 'Bitte SAP-Datei und Abrechnungsmonat auswählen.' });
      return;
    }
    setLoading('sap');
    setMessage(null);
    const formData = new FormData();
    formData.append('file', sapFile);
    formData.append('accountingPeriod', period);
    try {
      const res = await api.post('/uploads/sap', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: res.data.message || 'SAP Import erfolgreich!' });
      setSapFile(null);
      if (sapRef.current) sapRef.current.value = '';
      loadUploads();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Fehler beim SAP Import.' });
    } finally {
      setLoading(null);
    }
  };

  const handleFileUpload = async (endpoint: string, file: File, label: string) => {
    setLoading(label);
    setMessage(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: res.data.message || `${label} erfolgreich!` });
      loadUploads();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || `Fehler beim ${label}.` });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <PageTitle>Datenimport</PageTitle>

      {message && <Alert $type={message.type}>{message.text}</Alert>}

      {/* SAP Import */}
      <SectionTitle>SAP Daten (monatlich)</SectionTitle>
      <UploadCard>
        <UploadRow>
          <FormGroup style={{ marginBottom: 0 }}>
            <Label>Abrechnungsmonat</Label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="">-- Monat wählen --</option>
              {periods.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup style={{ flex: 1, marginBottom: 0 }}>
            <Label>SAP Export CSV (Semikolon-getrennt)</Label>
            <FileInput onClick={() => sapRef.current?.click()} style={{ padding: 16 }}>
              <input
                ref={sapRef}
                type="file"
                accept=".csv"
                onChange={(e) => setSapFile(e.target.files?.[0] || null)}
              />
              <p style={{ margin: 0 }}>{sapFile ? sapFile.name : 'CSV auswählen'}</p>
            </FileInput>
          </FormGroup>
          <Button onClick={handleSapUpload} disabled={loading !== null || !sapFile || !period}>
            {loading === 'sap' ? 'Importiere...' : 'SAP importieren'}
          </Button>
        </UploadRow>
      </UploadCard>

      {/* Länderliste */}
      <SectionTitle style={{ marginTop: 28 }}>Länderliste</SectionTitle>
      <UploadCard>
        <UploadRow>
          <FormGroup style={{ flex: 1, marginBottom: 0 }}>
            <Label>Länderliste CSV (Semikolon-getrennt, überschreibt bestehende Daten)</Label>
            <FileInput onClick={() => countryRef.current?.click()} style={{ padding: 16 }}>
              <input
                ref={countryRef}
                type="file"
                accept=".csv"
                onChange={(e) => setCountryFile(e.target.files?.[0] || null)}
              />
              <p style={{ margin: 0 }}>{countryFile ? countryFile.name : 'CSV auswählen'}</p>
            </FileInput>
          </FormGroup>
          <Button
            onClick={() => countryFile && handleFileUpload('/uploads/countries', countryFile, 'Länderliste-Import')}
            disabled={loading !== null || !countryFile}
          >
            {loading === 'Länderliste-Import' ? 'Importiere...' : 'Länderliste importieren'}
          </Button>
        </UploadRow>
      </UploadCard>

      {/* Stammdaten */}
      <SectionTitle style={{ marginTop: 28 }}>Stammdaten</SectionTitle>
      <UploadCard>
        <UploadRow>
          <FormGroup style={{ flex: 1, marginBottom: 0 }}>
            <Label>Stammdaten CSV (Semikolon-getrennt, überschreibt bestehende Daten)</Label>
            <FileInput onClick={() => masterRef.current?.click()} style={{ padding: 16 }}>
              <input
                ref={masterRef}
                type="file"
                accept=".csv"
                onChange={(e) => setMasterFile(e.target.files?.[0] || null)}
              />
              <p style={{ margin: 0 }}>{masterFile ? masterFile.name : 'CSV auswählen'}</p>
            </FileInput>
          </FormGroup>
          <Button
            onClick={() => masterFile && handleFileUpload('/uploads/master-data', masterFile, 'Stammdaten-Import')}
            disabled={loading !== null || !masterFile}
          >
            {loading === 'Stammdaten-Import' ? 'Importiere...' : 'Stammdaten importieren'}
          </Button>
        </UploadRow>
      </UploadCard>

      {loading && <Spinner />}

      {/* Upload Historie */}
      <SectionTitle style={{ marginTop: 28 }}>Upload Historie ({uploads.length})</SectionTitle>
      <UploadCard style={{ overflowX: 'auto' }}>
        {uploadsLoading ? <Spinner /> : (
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Datum</th>
                <th>Dateiname</th>
                <th>Typ</th>
                <th>Periode</th>
                <th>Datensätze</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999' }}>Keine Uploads vorhanden</td></tr>
              )}
              {uploads.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{formatDate(u.uploadedAt)}</td>
                  <td>{u.filename}</td>
                  <td>
                    <Badge $color={typeColors[u.uploadType] || theme.colors.textSecondary}>
                      {typeLabels[u.uploadType] || u.uploadType}
                    </Badge>
                  </td>
                  <td>{u.accountingPeriod || '-'}</td>
                  <td>{u.recordCount.toLocaleString('de-DE')}</td>
                  <td>
                    <Button
                      $variant="danger"
                      onClick={() => handleDelete(u.id)}
                      disabled={deleting === u.id}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      {deleting === u.id ? '...' : 'Löschen'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </UploadCard>
    </div>
  );
}
