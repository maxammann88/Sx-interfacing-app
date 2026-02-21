import React, { useState, useRef } from 'react';
import api from '../utils/api';
import {
  PageTitle, Card, Button, Label, FormGroup, FileInput, Alert, Spinner,
} from '../components/ui';
import styled from 'styled-components';

const UploadSection = styled.div`
  margin-bottom: 32px;
`;

const SectionLabel = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
`;

export default function StammdatenUploadPage() {
  const [countryFile, setCountryFile] = useState<File | null>(null);
  const [masterFile, setMasterFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  const masterRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (endpoint: string, file: File, label: string) => {
    setLoading(label);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: res.data.message || `${label} erfolgreich!` });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || `Fehler beim ${label}.`,
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <PageTitle>Stammdaten Upload</PageTitle>

      {message && <Alert $type={message.type}>{message.text}</Alert>}

      <Card>
        <UploadSection>
          <SectionLabel>Länderliste CSV</SectionLabel>
          <FormGroup>
            <Label>CSV-Datei mit Länderdaten (Semikolon-getrennt, überschreibt bestehende Daten)</Label>
            <FileInput onClick={() => countryRef.current?.click()}>
              <input
                ref={countryRef}
                type="file"
                accept=".csv"
                onChange={(e) => setCountryFile(e.target.files?.[0] || null)}
              />
              <p>{countryFile ? countryFile.name : 'Länderliste CSV auswählen'}</p>
            </FileInput>
          </FormGroup>
          <Button
            onClick={() => countryFile && uploadFile('/uploads/countries', countryFile, 'Länderliste-Import')}
            disabled={!countryFile || loading !== null}
          >
            {loading === 'Länderliste-Import' ? 'Importiere...' : 'Länderliste importieren'}
          </Button>
        </UploadSection>

        <UploadSection>
          <SectionLabel>Stammdaten CSV</SectionLabel>
          <FormGroup>
            <Label>CSV-Datei mit Stammdaten (Semikolon-getrennt, überschreibt bestehende Daten)</Label>
            <FileInput onClick={() => masterRef.current?.click()}>
              <input
                ref={masterRef}
                type="file"
                accept=".csv"
                onChange={(e) => setMasterFile(e.target.files?.[0] || null)}
              />
              <p>{masterFile ? masterFile.name : 'Stammdaten CSV auswählen'}</p>
            </FileInput>
          </FormGroup>
          <Button
            onClick={() => masterFile && uploadFile('/uploads/master-data', masterFile, 'Stammdaten-Import')}
            disabled={!masterFile || loading !== null}
          >
            {loading === 'Stammdaten-Import' ? 'Importiere...' : 'Stammdaten importieren'}
          </Button>
        </UploadSection>

        {loading && <Spinner />}
      </Card>
    </div>
  );
}
