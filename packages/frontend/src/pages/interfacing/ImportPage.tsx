import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import api from '../../utils/api';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import { generatePeriodOptions, formatDate } from '../../utils/format';
import type { Upload } from '@sixt/shared';
import {
  PageTitle, Card, Button, Select, Label, FormGroup, FormRow,
  FileInput, Alert, Spinner, SectionTitle, Table, Badge,
} from '../../components/ui';
import { theme } from '../../styles/theme';

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
  sap: 'SAP Post Booking Debitor/Kreditor (Herbert)',
  countries: 'Country List (Henning)',
  'master-data': 'Master Data (Henning)',
  deposit: 'Deposit (Henning)',
  'billing-costs': 'SAP BU88/BU89 (Vroni)',
};

const typeColors: Record<string, string> = {
  sap: theme.colors.primary,
  countries: theme.colors.info,
  'master-data': theme.colors.success,
  deposit: '#6f42c1',
  'billing-costs': '#0d9488',
};

export default function ImportPage() {
  const [sapFile, setSapFile] = useState<File | null>(null);
  const [period, setPeriod] = useState('');
  const [countryFile, setCountryFile] = useState<File | null>(null);
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [depositFile, setDepositFile] = useState<File | null>(null);
  const [billingCostsFile, setBillingCostsFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ message: string; action: () => void } | null>(null);

  const sapRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  const masterRef = useRef<HTMLInputElement>(null);
  const depositRef = useRef<HTMLInputElement>(null);
  const billingCostsRef = useRef<HTMLInputElement>(null);

  const periods = generatePeriodOptions();

  const loadUploads = useCallback(() => {
    setUploadsLoading(true);
    api.get('/uploads')
      .then((res) => setUploads(res.data.data))
      .catch(() => {})
      .finally(() => setUploadsLoading(false));
  }, []);

  useEffect(() => { loadUploads(); }, [loadUploads]);

  const handleDelete = (id: number) => {
    setDeleteModal({
      message: 'Upload und alle zugehörigen Daten löschen?',
      action: async () => {
        setDeleting(id);
        try {
          await api.delete(`/uploads/${id}`);
          loadUploads();
        } catch (err: any) {
          setMessage({ type: 'error', text: err.response?.data?.error || 'Error deleting upload' });
        } finally {
          setDeleting(null);
        }
      },
    });
  };

  const handleSapUpload = async () => {
    if (!sapFile || !period) {
      setMessage({ type: 'error', text: 'Please select a SAP file and accounting period.' });
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
      setMessage({ type: 'success', text: res.data.message || 'SAP import successful!' });
      setSapFile(null);
      if (sapRef.current) sapRef.current.value = '';
      loadUploads();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error during SAP import.' });
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
      setMessage({ type: 'success', text: res.data.message || `${label} successful!` });
      loadUploads();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || `Error during ${label}.` });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <PageTitle>Data Import</PageTitle>

      {message && <Alert $type={message.type}>{message.text}</Alert>}

      {/* SAP Import */}
      <SectionTitle>SAP Post Booking Debitor/Kreditor CSV (from Herbert)</SectionTitle>
      <UploadCard>
        <UploadRow>
          <FormGroup style={{ marginBottom: 0 }}>
            <Label>Accounting Period</Label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="">-- Select period --</option>
              {periods.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup style={{ flex: 1, marginBottom: 0 }}>
            <Label>SAP Export CSV (semicolon-separated)</Label>
            <FileInput onClick={() => sapRef.current?.click()} style={{ padding: 16 }}>
              <input
                ref={sapRef}
                type="file"
                accept=".csv"
                onChange={(e) => setSapFile(e.target.files?.[0] || null)}
              />
              <p style={{ margin: 0 }}>{sapFile ? sapFile.name : 'Select CSV'}</p>
            </FileInput>
          </FormGroup>
          <Button onClick={handleSapUpload} disabled={loading !== null || !sapFile || !period}>
            {loading === 'sap' ? 'Importing...' : 'Import SAP'}
          </Button>
        </UploadRow>
      </UploadCard>

      {/* Country List */}
      <SectionTitle style={{ marginTop: 28 }}>Country List (from Henning)</SectionTitle>
      <UploadCard>
        <UploadRow>
          <FormGroup style={{ flex: 1, marginBottom: 0 }}>
            <Label>Country List CSV (semicolon-separated, overwrites existing data)</Label>
            <FileInput onClick={() => countryRef.current?.click()} style={{ padding: 16 }}>
              <input
                ref={countryRef}
                type="file"
                accept=".csv"
                onChange={(e) => setCountryFile(e.target.files?.[0] || null)}
              />
              <p style={{ margin: 0 }}>{countryFile ? countryFile.name : 'Select CSV'}</p>
            </FileInput>
          </FormGroup>
          <Button
            onClick={() => countryFile && handleFileUpload('/uploads/countries', countryFile, 'Country List Import')}
            disabled={loading !== null || !countryFile}
          >
            {loading === 'Country List Import' ? 'Importing...' : 'Import Country List'}
          </Button>
        </UploadRow>
      </UploadCard>

      {/* Master Data */}
      <SectionTitle style={{ marginTop: 28 }}>Master Data (from Henning)</SectionTitle>
      <UploadCard>
        <UploadRow>
          <FormGroup style={{ flex: 1, marginBottom: 0 }}>
            <Label>Master Data CSV (semicolon-separated, overwrites existing data)</Label>
            <FileInput onClick={() => masterRef.current?.click()} style={{ padding: 16 }}>
              <input
                ref={masterRef}
                type="file"
                accept=".csv"
                onChange={(e) => setMasterFile(e.target.files?.[0] || null)}
              />
              <p style={{ margin: 0 }}>{masterFile ? masterFile.name : 'Select CSV'}</p>
            </FileInput>
          </FormGroup>
          <Button
            onClick={() => masterFile && handleFileUpload('/uploads/master-data', masterFile, 'Master Data Import')}
            disabled={loading !== null || !masterFile}
          >
            {loading === 'Master Data Import' ? 'Importing...' : 'Import Master Data'}
          </Button>
        </UploadRow>
      </UploadCard>

      {/* SAP BU88/BU89 */}
      <SectionTitle style={{ marginTop: 28 }}>SAP BU88/BU89 CSV (from Vroni)</SectionTitle>
      <UploadCard>
        <UploadRow>
          <FormGroup style={{ flex: 1, marginBottom: 0 }}>
            <Label>Billing CSV (Semikolon; Daten werden angehängt, bestehende Einträge bleiben erhalten)</Label>
            <FileInput onClick={() => billingCostsRef.current?.click()} style={{ padding: 16 }}>
              <input
                ref={billingCostsRef}
                type="file"
                accept=".csv"
                onChange={(e) => setBillingCostsFile(e.target.files?.[0] || null)}
              />
              <p style={{ margin: 0 }}>{billingCostsFile ? billingCostsFile.name : 'Select CSV'}</p>
            </FileInput>
          </FormGroup>
          <Button
            onClick={() => billingCostsFile && handleFileUpload('/uploads/billing-costs', billingCostsFile, 'Billing Costs')}
            disabled={loading !== null || !billingCostsFile}
          >
            {loading === 'Billing Costs' ? 'Importing...' : 'Import BU88/BU89'}
          </Button>
        </UploadRow>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666' }}>
          Daten werden angehängt, bestehende Einträge bleiben erhalten.
        </p>
      </UploadCard>

      {/* Deposit */}
      <SectionTitle style={{ marginTop: 28 }}>Deposit (from Henning)</SectionTitle>
      <UploadCard>
        <UploadRow>
          <FormGroup style={{ flex: 1, marginBottom: 0 }}>
            <Label>Deposit CSV (semicolon-separated, overwrites existing data)</Label>
            <FileInput onClick={() => depositRef.current?.click()} style={{ padding: 16 }}>
              <input
                ref={depositRef}
                type="file"
                accept=".csv"
                onChange={(e) => setDepositFile(e.target.files?.[0] || null)}
              />
              <p style={{ margin: 0 }}>{depositFile ? depositFile.name : 'Select CSV'}</p>
            </FileInput>
          </FormGroup>
          <Button
            onClick={() => depositFile && handleFileUpload('/uploads/deposit', depositFile, 'Deposit Import')}
            disabled={loading !== null || !depositFile}
          >
            {loading === 'Deposit Import' ? 'Importing...' : 'Import Deposit'}
          </Button>
        </UploadRow>
      </UploadCard>

      {loading && <Spinner />}

      {/* Upload History */}
      <SectionTitle style={{ marginTop: 28 }}>Upload History ({uploads.length})</SectionTitle>
      <UploadCard style={{ overflowX: 'auto' }}>
        {uploadsLoading ? <Spinner /> : (
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Filename</th>
                <th>Type</th>
                <th>Period</th>
                <th>Records</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999' }}>No uploads found</td></tr>
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
                  <td>{u.recordCount.toLocaleString('en-US')}</td>
                  <td>
                    <Button
                      $variant="danger"
                      onClick={() => handleDelete(u.id)}
                      disabled={deleting === u.id}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      {deleting === u.id ? '...' : 'Delete'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </UploadCard>

      {deleteModal && (
        <DeleteConfirmModal
          message={deleteModal.message}
          onConfirm={() => { deleteModal.action(); setDeleteModal(null); }}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
