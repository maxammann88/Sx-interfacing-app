import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDate } from '../utils/format';
import {
  PageTitle, Card, Table, Spinner, Alert, Select, FormRow, FormGroup, Label, Input, Badge,
} from '../components/ui';
import { theme } from '../styles/theme';
import styled from 'styled-components';

const ScrollWrapper = styled.div`
  overflow-x: auto;
  max-width: 100%;
`;

const SmallTable = styled(Table)`
  font-size: 11px;
  white-space: nowrap;

  th { padding: 6px 8px; font-size: 11px; }
  td { padding: 4px 8px; }
`;

const SectionHeader = styled.th`
  background: ${theme.colors.primary} !important;
  color: ${theme.colors.white} !important;
  text-align: center !important;
  font-size: 11px !important;
  letter-spacing: 0.5px;
`;

interface MasterDataEntry {
  uid: string | null;
  ktod: string;
  nam1: string | null;
  nam2: string | null;
  nam3: string | null;
  str: string | null;
  ort: string | null;
  plz: string | null;
  lanb: string | null;
  payt: number | null;
}

interface CountryWithMaster {
  id: number;
  fir: number;
  debitor1: string;
  iso: string;
  kst: number | null;
  name: string;
  comment: string | null;
  verrkto: string | null;
  kreditor: string | null;
  revc: string | null;
  debitor760: string | null;
  kreditor760: string | null;
  stSchlLstRe: string | null;
  stSchlLstGs: string | null;
  revc2: string | null;
  stSchlLiefRe: string | null;
  emails: string | null;
  partnerStatus: string | null;
  zusatz: string | null;
  finalInterfacing: string | null;
  vertragsende: string | null;
  debitor10: string | null;
  masterData: MasterDataEntry | null;
}

export default function StammdatenViewPage() {
  const [data, setData] = useState<CountryWithMaster[]>([]);
  const [filtered, setFiltered] = useState<CountryWithMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/master-data')
      .then((res) => {
        setData(res.data.data);
        setFiltered(res.data.data);
      })
      .catch((err) => setError(err.response?.data?.error || 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = data;
    if (statusFilter !== 'alle') {
      result = result.filter((c) =>
        (c.partnerStatus || '').toLowerCase().includes(statusFilter)
      );
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.iso.toLowerCase().includes(s) ||
          String(c.fir).includes(s) ||
          c.debitor1.includes(s) ||
          (c.masterData?.nam1 || '').toLowerCase().includes(s) ||
          (c.masterData?.lanb || '').toLowerCase().includes(s) ||
          (c.masterData?.ort || '').toLowerCase().includes(s)
      );
    }
    setFiltered(result);
  }, [data, statusFilter, search]);

  if (loading) return <Spinner />;
  if (error) return <Alert $type="error">{error}</Alert>;

  return (
    <div>
      <PageTitle>Stammdaten Übersicht ({filtered.length} Einträge)</PageTitle>

      <Card>
        <FormRow>
          <FormGroup>
            <Label>Status</Label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="alle">Alle</option>
              <option value="aktiv">Aktiv</option>
              <option value="inaktiv">Inaktiv</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Suche</Label>
            <Input
              placeholder="Land, ISO, FIR, Debitor, Firma, Ort..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 300 }}
            />
          </FormGroup>
        </FormRow>
      </Card>

      <Card style={{ padding: 12 }}>
        <ScrollWrapper>
          <SmallTable>
            <thead>
              <tr>
                <SectionHeader colSpan={14}>LÄNDERLISTE</SectionHeader>
                <SectionHeader colSpan={9} style={{ background: theme.colors.secondary }}>STAMMDATEN</SectionHeader>
              </tr>
              <tr>
                {/* Länderliste-Spalten */}
                <th>FIR</th>
                <th>Debitor (1)</th>
                <th>ISO</th>
                <th>KST</th>
                <th>Land</th>
                <th>Kommentar</th>
                <th>VERRKTO</th>
                <th>Kreditor</th>
                <th>Debitor (760)</th>
                <th>Kreditor (760)</th>
                <th>Partner Status</th>
                <th>Final Interfacing</th>
                <th>Vertragsende</th>
                <th>Debitor (10)</th>
                {/* Stammdaten-Spalten */}
                <th style={{ background: '#444', color: 'white' }}>Konto (ktod)</th>
                <th style={{ background: '#444', color: 'white' }}>Name 1</th>
                <th style={{ background: '#444', color: 'white' }}>Name 2</th>
                <th style={{ background: '#444', color: 'white' }}>Name 3</th>
                <th style={{ background: '#444', color: 'white' }}>Straße</th>
                <th style={{ background: '#444', color: 'white' }}>Ort</th>
                <th style={{ background: '#444', color: 'white' }}>PLZ</th>
                <th style={{ background: '#444', color: 'white' }}>Land</th>
                <th style={{ background: '#444', color: 'white' }}>Zahlungsziel</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={23} style={{ textAlign: 'center', color: '#999', padding: 20 }}>Keine Daten vorhanden</td></tr>
              )}
              {filtered.map((c) => {
                const md = c.masterData;
                return (
                  <tr key={c.id}>
                    {/* Länderliste */}
                    <td><strong>{c.fir}</strong></td>
                    <td>{c.debitor1}</td>
                    <td>{c.iso}</td>
                    <td>{c.kst || '-'}</td>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.comment || ''}</td>
                    <td>{c.verrkto || ''}</td>
                    <td>{c.kreditor || ''}</td>
                    <td>{c.debitor760 || ''}</td>
                    <td>{c.kreditor760 || ''}</td>
                    <td>
                      <Badge $color={
                        (c.partnerStatus || '').toLowerCase().includes('aktiv') &&
                        !(c.partnerStatus || '').toLowerCase().includes('inaktiv')
                          ? theme.colors.success
                          : theme.colors.danger
                      }>
                        {c.partnerStatus || '-'}
                      </Badge>
                    </td>
                    <td>{c.finalInterfacing || ''}</td>
                    <td>{formatDate(c.vertragsende)}</td>
                    <td>{c.debitor10 || ''}</td>
                    {/* Stammdaten */}
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.ktod || '-'}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}><strong>{md?.nam1 || ''}</strong></td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.nam2 || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.nam3 || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.str || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.ort || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.plz || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.lanb || ''}</td>
                    <td style={{ background: md ? '#f8f8f0' : '#fff5f5' }}>{md?.payt != null ? `${md.payt} Tage` : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </SmallTable>
        </ScrollWrapper>
      </Card>
    </div>
  );
}
