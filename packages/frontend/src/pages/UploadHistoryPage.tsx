import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDate } from '../utils/format';
import type { Upload } from '@sixt/shared';
import {
  PageTitle, Card, Table, Button, Spinner, Alert, Badge,
} from '../components/ui';
import { theme } from '../styles/theme';

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

export default function UploadHistoryPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadUploads = () => {
    setLoading(true);
    api.get('/uploads')
      .then((res) => setUploads(res.data.data))
      .catch((err) => setError(err.response?.data?.error || 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUploads(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Upload wirklich löschen? Alle zugehörigen Daten werden entfernt.')) return;
    setDeleting(id);
    try {
      await api.delete(`/uploads/${id}`);
      loadUploads();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Fehler beim Löschen');
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
      </Card>
    </div>
  );
}
