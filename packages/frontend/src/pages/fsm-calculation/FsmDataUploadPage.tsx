import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PageTitle, Card, Button } from '../../components/ui';
import { GdsDcfUpload } from '@sixt/shared';

const UploadContainer = styled.div`
  padding: 20px;
`;

const UploadZone = styled.div<{ isDragging?: boolean }>`
  border: 2px dashed ${props => props.isDragging ? props.theme.colors.primary : '#ccc'};
  border-radius: 8px;
  padding: 48px;
  text-align: center;
  background: ${props => props.isDragging ? '#fff5f0' : '#fafafa'};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 32px;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: #fff5f0;
  }
`;

const UploadIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  color: ${props => props.theme.colors.primary};
`;

const UploadText = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${props => props.theme.colors.text};
`;

const UploadHint = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
`;

const HistorySection = styled.div`
  margin-top: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${props => props.theme.colors.text};
`;

const UploadTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }
  
  th {
    background: #f5f5f5;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
  }
  
  tbody tr:hover {
    background: #f9f9f9;
  }
`;

const StatusBadge = styled.span<{ status?: string }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.status === 'validated') return '#d4edda';
    if (props.status === 'uploaded') return '#d1ecf1';
    return '#f8d7da';
  }};
  color: ${props => {
    if (props.status === 'validated') return '#155724';
    if (props.status === 'uploaded') return '#0c5460';
    return '#721c24';
  }};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin: 16px 0;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: ${props => props.theme.colors.primary};
  transition: width 0.3s;
`;

export default function FsmDataUploadPage() {
  const [uploads, setUploads] = useState<(GdsDcfUpload & { status?: string })[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      const response = await fetch('/api/gds-dcf/uploads');
      const result = await response.json();
      if (result.success) {
        setUploads(result.data.map((u: GdsDcfUpload) => ({ ...u, status: 'uploaded' })));
      }
    } catch (err) {
      console.error('Failed to load uploads:', err);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(30);

      const response = await fetch('/api/gds-dcf/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(70);

      const result = await response.json();

      if (result.success) {
        setUploadProgress(90);
        
        const validateResponse = await fetch(`/api/gds-dcf/validate/${result.data.uploadId}`, {
          method: 'POST',
        });

        const validateResult = await validateResponse.json();
        
        setUploadProgress(100);

        if (validateResult.success) {
          alert(`Upload successful!\n\nTotal Reservations: ${validateResult.data.totalReservations}\nChargeable: ${validateResult.data.chargeableReservations}\nTotal Fees: ${validateResult.data.totalFees.toFixed(2)}`);
          await loadUploads();
        }
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Please check file format and try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleViewResults = (uploadId: number) => {
    window.location.href = `/fsm/results?uploadId=${uploadId}`;
  };

  return (
    <div>
      <PageTitle>Data Upload - GDS & DCF Reservations</PageTitle>
      
      <Card>
        <UploadContainer>
          <UploadZone
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon>📁</UploadIcon>
            <UploadText>
              {uploading ? 'Uploading and validating...' : 'Drop your reservation file here or click to browse'}
            </UploadText>
            <UploadHint>
              Supported formats: Excel (.xlsx, .xls) or CSV (.csv)<br/>
              Expected columns: RES-NUMBER, SOURCE, POS, PCI, PICK-UP, RATECODE, AGENCY, IATA, FEE
            </UploadHint>
            {uploading && (
              <ProgressBar>
                <ProgressFill progress={uploadProgress} />
              </ProgressBar>
            )}
          </UploadZone>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          <HistorySection>
            <SectionTitle>Upload History</SectionTitle>
            
            {uploads.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 32 }}>
                No uploads yet. Upload a file to get started.
              </div>
            ) : (
              <UploadTable>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Filename</th>
                    <th>Uploaded At</th>
                    <th>Records</th>
                    <th>Chargeable</th>
                    <th>Total Fees</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map(upload => (
                    <tr key={upload.id}>
                      <td>{upload.id}</td>
                      <td>{upload.filename}</td>
                      <td>{new Date(upload.uploadedAt).toLocaleString()}</td>
                      <td>{upload.recordCount}</td>
                      <td>{upload.chargeableCount || 0}</td>
                      <td>{upload.totalFees?.toFixed(2) || '0.00'}</td>
                      <td>
                        <StatusBadge status={upload.status}>
                          {upload.status || 'uploaded'}
                        </StatusBadge>
                      </td>
                      <td>
                        <Button onClick={() => handleViewResults(upload.id)}>
                          View Results
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </UploadTable>
            )}
          </HistorySection>
        </UploadContainer>
      </Card>
    </div>
  );
}
