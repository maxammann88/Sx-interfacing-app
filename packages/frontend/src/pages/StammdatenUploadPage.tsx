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
      setMessage({ type: 'success', text: res.data.message || `${label} successful!` });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || `Error during ${label}.`,
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <PageTitle>Master Data Upload</PageTitle>

      {message && <Alert $type={message.type}>{message.text}</Alert>}

      <Card>
        <UploadSection>
          <SectionLabel>Country List CSV</SectionLabel>
          <FormGroup>
            <Label>CSV file with country data (semicolon-separated, overwrites existing data)</Label>
            <FileInput onClick={() => countryRef.current?.click()}>
              <input
                ref={countryRef}
                type="file"
                accept=".csv"
                onChange={(e) => setCountryFile(e.target.files?.[0] || null)}
              />
              <p>{countryFile ? countryFile.name : 'Select Country List CSV'}</p>
            </FileInput>
          </FormGroup>
          <Button
            onClick={() => countryFile && uploadFile('/uploads/countries', countryFile, 'Country List Import')}
            disabled={!countryFile || loading !== null}
          >
            {loading === 'Country List Import' ? 'Importing...' : 'Import Country List'}
          </Button>
        </UploadSection>

        <UploadSection>
          <SectionLabel>Master Data CSV</SectionLabel>
          <FormGroup>
            <Label>CSV file with master data (semicolon-separated, overwrites existing data)</Label>
            <FileInput onClick={() => masterRef.current?.click()}>
              <input
                ref={masterRef}
                type="file"
                accept=".csv"
                onChange={(e) => setMasterFile(e.target.files?.[0] || null)}
              />
              <p>{masterFile ? masterFile.name : 'Select Master Data CSV'}</p>
            </FileInput>
          </FormGroup>
          <Button
            onClick={() => masterFile && uploadFile('/uploads/master-data', masterFile, 'Master Data Import')}
            disabled={!masterFile || loading !== null}
          >
            {loading === 'Master Data Import' ? 'Importing...' : 'Import Master Data'}
          </Button>
        </UploadSection>

        {loading && <Spinner />}
      </Card>
    </div>
  );
}
