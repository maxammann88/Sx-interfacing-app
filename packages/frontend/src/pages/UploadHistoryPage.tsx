import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDateTime } from '../utils/format';
import type { Upload } from '@sixt/shared';
import {
  PageTitle, Card, Table, Button, Spinner, Alert, Badge,
} from '../components/ui';
import { theme } from '../styles/theme';

const typeLabels: Record<string, string> = {
  sap: 'SAP Import',
  countries: 'Country List',
  'master-data': 'Master Data',
  deposit: 'Deposit',
};

const typeColors: Record<string, string> = {
  sap: theme.colors.primary,
  countries: theme.colors.info,
  'master-data': theme.colors.success,
  deposit: '#6f42c1',
};

export default function UploadHistoryPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadUploads = () => {
    setLoading(true);
    api.get('/uploads')
      .then((res) => setUploads(res.data.data))
      .catch((err) => setError(err.response?.data?.error || 'Error loading data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUploads(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this upload? All associated data will be removed.')) return;
    setDeleting(id);
    try {
      await api.delete(`/uploads/${id}`);
      loadUploads();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error deleting upload');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert $type="error">{error}</Alert>;

  return (
    <div>
      <PageTitle>Upload History ({uploads.length})</PageTitle>

      <Card style={{ overflowX: 'auto' }}>
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
                <td>{formatDateTime(u.uploadedAt)}</td>
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
      </Card>
    </div>
  );
}
