import React, { useState, useRef } from 'react';
import api from '../utils/api';
import { generatePeriodOptions } from '../utils/format';
import {
  PageTitle, Card, Button, Select, Label, FormGroup, FormRow,
  FileInput, Alert, Spinner,
} from '../components/ui';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [period, setPeriod] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const periods = generatePeriodOptions();

  const handleUpload = async () => {
    if (!file || !period) {
      setMessage({ type: 'error', text: 'Bitte Datei und Abrechnungsmonat auswählen.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountingPeriod', period);

    try {
      const res = await api.post('/uploads/sap', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: res.data.message || 'Import erfolgreich!' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Fehler beim Import.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageTitle>Monatlicher SAP Datenimport</PageTitle>

      {message && <Alert $type={message.type}>{message.text}</Alert>}

      <Card>
        <FormGroup>
          <Label>Abrechnungsmonat</Label>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="">-- Monat wählen --</option>
            {periods.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>SAP Export CSV (Semikolon-getrennt)</Label>
          <FileInput onClick={() => fileRef.current?.click()}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p>{file ? file.name : 'Klicken zum Auswählen oder Datei hierher ziehen'}</p>
          </FileInput>
        </FormGroup>

        <FormRow>
          <Button onClick={handleUpload} disabled={loading || !file || !period}>
            {loading ? 'Importiere...' : 'CSV Importieren'}
          </Button>
        </FormRow>

        {loading && <Spinner />}
      </Card>
    </div>
  );
}
