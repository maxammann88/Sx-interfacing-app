import React, { useEffect, useState, useMemo, useCallback } from 'react';
import ReactSelect from 'react-select';
import api from '../utils/api';
import { formatEur, generatePeriodOptions, getDefaultPeriod } from '../utils/format';
import type { Country } from '@sixt/shared';
import styled from 'styled-components';
import {
  Card,
  Select,
  Label,
  FormGroup,
  FormRow,
  Table,
  AmountCell,
  SubtotalRow,
  SectionTitle,
  Spinner,
  Alert,
} from '../components/ui';
import { theme } from '../styles/theme';

interface BillingLine {
  id: number;
  postingDate: string;
  documentDate: string;
  documentType: string;
  text: string;
  assignment: string;
  costCenter: string;
  account: string;
  bookingProgram: string;
  postingKey: string;
  debitCreditInd: string;
  localCurrency: string;
  amount: number;
}

interface FixVarData {
  country: { id: number; fir: number; name: string; iso: string };
  period: string;
  variableLines: BillingLine[];
  variableUpload: number;
  fixLines: BillingLine[];
  fixUpload: number;
  variableSap: number;
  fixSap: number;
  variableDeviation: number;
  fixedDeviation: number;
}

interface OverviewRow {
  countryId: number;
  fir: number;
  name: string;
  iso: string;
  variableUpload: number;
  fixUpload: number;
  variableSap: number;
  fixSap: number;
  variableDeviation: number;
  fixedDeviation: number;
  totalDeviation: number;
}

type DrillDownType = 'variableUpload' | 'fixUpload' | 'variableSap' | 'fixSap';

interface DrillDownState {
  countryName: string;
  type: DrillDownType;
  lines: BillingLine[];
  loading: boolean;
}

const GraySectionTitle = styled(SectionTitle)<{ shade?: string }>`
  background: ${({ shade }) => shade || '#555'};
`;

const DeviationSummary = styled.div`
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  font-size: 14px;
`;

const DeviationCell = styled(AmountCell)<{ $hasDeviation?: boolean }>`
  ${({ $hasDeviation }) => $hasDeviation && `color: ${theme.colors.danger}; font-weight: 600;`}
`;

const CompareRow = styled.tr<{ $warn?: boolean }>`
  ${({ $warn }) => $warn && `background: #fff3e0 !important;`}
  td { font-weight: 600; }
`;

const OverviewCountryLink = styled.td`
  cursor: pointer;
  color: ${theme.colors.primary};
  font-weight: 500;
  &:hover { text-decoration: underline; }
`;

const ClickableAmount = styled(AmountCell)`
  cursor: pointer;
  color: ${theme.colors.primary};
  &:hover { text-decoration: underline; background: #f0f0f0; }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const FilterCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  max-width: 900px;
  width: 95%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
`;

const ModalBody = styled.div`
  padding: 16px 20px;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #666;
  padding: 0 4px;
  line-height: 1;
  &:hover { color: #333; }
`;

const DRILL_LABELS: Record<DrillDownType, string> = {
  variableUpload: 'Upload Variable (BU 89)',
  fixUpload: 'Upload Fix (BU 88)',
  variableSap: 'SAP Variable (Operational)',
  fixSap: 'SAP Fix (Contractual)',
};

export default function FixVarPage() {
  const DEFAULT_COUNTRY_ID = '335';
  const DEFAULT_PERIOD = getDefaultPeriod();

  const [countries, setCountries] = useState<Country[]>([]);
  const [countryId, setCountryId] = useState(DEFAULT_COUNTRY_ID);
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [data, setData] = useState<FixVarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter] = useState('aktiv');

  const [overviewData, setOverviewData] = useState<OverviewRow[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const [hideZeroDeviation, setHideZeroDeviation] = useState(false);
  const [hideZeroUpload, setHideZeroUpload] = useState(false);
  const [hideZeroSap, setHideZeroSap] = useState(false);

  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);

  const periods = generatePeriodOptions();
  const countryOptions = useMemo(
    () => countries.map((c) => ({ value: String(c.id), label: `${c.fir} - ${c.name} (${c.iso})` })),
    [countries],
  );
  const selectedCountryOption = useMemo(
    () => countryOptions.find((o) => o.value === countryId) || null,
    [countryOptions, countryId],
  );

  useEffect(() => {
    api
      .get('/countries', { params: statusFilter !== 'alle' ? { status: statusFilter } : undefined })
      .then((res) => setCountries(res.data.data))
      .catch(() => {});
  }, [statusFilter]);

  useEffect(() => {
    if (!countryId || !period) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setData(null);
    api
      .get('/fix-var', { params: { period, countryId } })
      .then((res) => { if (!cancelled) setData(res.data.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.error || 'Fehler beim Laden der Fix/Var-Daten.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [countryId, period]);

  useEffect(() => {
    if (!period) return;
    let cancelled = false;
    setOverviewLoading(true);
    setOverviewData([]);
    api
      .get('/fix-var/overview', { params: { period } })
      .then((res) => { if (!cancelled) setOverviewData(res.data.data.rows); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setOverviewLoading(false); });
    return () => { cancelled = true; };
  }, [period]);

  const hasAnyDeviation = data && (data.variableDeviation !== 0 || data.fixedDeviation !== 0);

  const filteredOverview = useMemo(() => {
    return overviewData.filter((row) => {
      if (hideZeroDeviation && row.totalDeviation === 0) return false;
      if (hideZeroUpload && row.variableUpload === 0 && row.fixUpload === 0) return false;
      if (hideZeroSap && row.variableSap === 0 && row.fixSap === 0) return false;
      return true;
    });
  }, [overviewData, hideZeroDeviation, hideZeroUpload, hideZeroSap]);

  const handleCountryClick = (id: number) => {
    setCountryId(String(id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDrillDown = useCallback((row: OverviewRow, type: DrillDownType) => {
    const val = row[type];
    if (val === 0) return;

    setDrillDown({ countryName: `${row.name} (${row.iso})`, type, lines: [], loading: true });

    api.get('/fix-var', { params: { period, countryId: row.countryId } })
      .then((res) => {
        const d: FixVarData = res.data.data;
        let lines: BillingLine[] = [];
        if (type === 'variableUpload') lines = d.variableLines;
        else if (type === 'fixUpload') lines = d.fixLines;
        setDrillDown((prev) => prev ? { ...prev, lines, loading: false } : null);
      })
      .catch(() => {
        setDrillDown((prev) => prev ? { ...prev, loading: false } : null);
      });
  }, [period]);

  const closeDrillDown = () => setDrillDown(null);

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '16px 0 12px' }}>Fix/Var – Abgleich Billing vs. SAP</h2>

      {error && <Alert $type="error">{error}</Alert>}

      <Card>
        <FormRow>
          <FormGroup>
            <Label>Status Filter</Label>
            <Select value={statusFilter} onChange={() => {}} disabled>
              <option value="aktiv">Active</option>
            </Select>
          </FormGroup>
          <FormGroup style={{ minWidth: 300 }}>
            <Label>Land</Label>
            <ReactSelect
              options={countryOptions}
              value={selectedCountryOption}
              onChange={(opt) => setCountryId(opt?.value || '')}
              placeholder="Land wählen..."
              isClearable={false}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: 38,
                  borderColor: '#ddd',
                  '&:hover': { borderColor: theme.colors.primary },
                }),
                option: (base, state) => ({
                  ...base,
                  fontSize: 13,
                  background: state.isSelected ? theme.colors.primary : state.isFocused ? '#fff3e0' : 'white',
                  color: state.isSelected ? 'white' : '#333',
                }),
                singleValue: (base) => ({ ...base, fontSize: 13 }),
                input: (base) => ({ ...base, fontSize: 13 }),
              }}
            />
          </FormGroup>
          <FormGroup>
            <Label>Abrechnungsperiode</Label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="">-- Periode --</option>
              {periods.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </FormGroup>
        </FormRow>
      </Card>

      {loading && <Spinner />}

      {data && !loading && (
        <>
          {hasAnyDeviation && (
            <DeviationSummary>
              <strong>Abweichungen zum SAP-Import:</strong>
              {data.variableDeviation !== 0 && (
                <span style={{ display: 'block', marginTop: 4 }}>
                  Variable Kosten (Operational): {formatEur(data.variableDeviation)}
                </span>
              )}
              {data.fixedDeviation !== 0 && (
                <span style={{ display: 'block', marginTop: 4 }}>
                  Fixkosten (Contractual): {formatEur(data.fixedDeviation)}
                </span>
              )}
            </DeviationSummary>
          )}

          <GraySectionTitle shade="#5a5a5a">Variable Kosten (Operational costs billing, BU 89)</GraySectionTitle>
          <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
            <Table>
              <thead>
                <tr>
                  <th>Posting Date</th>
                  <th>Text</th>
                  <th>Account</th>
                  <th>Cost Center</th>
                  <th>Assignment</th>
                  <th>BU</th>
                  <th style={{ textAlign: 'right' }}>Amount ({data.variableLines[0]?.localCurrency || 'EUR'})</th>
                </tr>
              </thead>
              <tbody>
                {data.variableLines.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999' }}>Keine BU 89 Zeilen im Upload</td></tr>
                )}
                {data.variableLines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.postingDate}</td>
                    <td>{line.text}</td>
                    <td>{line.account}</td>
                    <td>{line.costCenter}</td>
                    <td>{line.assignment}</td>
                    <td>{line.bookingProgram}</td>
                    <AmountCell>{formatEur(line.amount)}</AmountCell>
                  </tr>
                ))}
                <SubtotalRow>
                  <td colSpan={6}><strong>Summe Upload (BU 89)</strong></td>
                  <AmountCell><strong>{formatEur(data.variableUpload)}</strong></AmountCell>
                </SubtotalRow>
                <tr>
                  <td colSpan={6}>Summe SAP (&quot;Operational costs billing&quot;)</td>
                  <AmountCell>{formatEur(data.variableSap)}</AmountCell>
                </tr>
                <CompareRow $warn={data.variableDeviation !== 0}>
                  <td colSpan={6}><strong>Abweichung (Upload − SAP)</strong></td>
                  <DeviationCell $hasDeviation={data.variableDeviation !== 0}>
                    {formatEur(data.variableDeviation)}
                  </DeviationCell>
                </CompareRow>
              </tbody>
            </Table>
          </Card>

          <GraySectionTitle shade="#4a4a4a">Fixkosten (Contractual costs billing, BU 88)</GraySectionTitle>
          <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
            <Table>
              <thead>
                <tr>
                  <th>Posting Date</th>
                  <th>Text</th>
                  <th>Account</th>
                  <th>Cost Center</th>
                  <th>Assignment</th>
                  <th>BU</th>
                  <th style={{ textAlign: 'right' }}>Amount ({data.fixLines[0]?.localCurrency || 'EUR'})</th>
                </tr>
              </thead>
              <tbody>
                {data.fixLines.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999' }}>Keine BU 88 Zeilen im Upload</td></tr>
                )}
                {data.fixLines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.postingDate}</td>
                    <td>{line.text}</td>
                    <td>{line.account}</td>
                    <td>{line.costCenter}</td>
                    <td>{line.assignment}</td>
                    <td>{line.bookingProgram}</td>
                    <AmountCell>{formatEur(line.amount)}</AmountCell>
                  </tr>
                ))}
                <SubtotalRow>
                  <td colSpan={6}><strong>Summe Upload (BU 88)</strong></td>
                  <AmountCell><strong>{formatEur(data.fixUpload)}</strong></AmountCell>
                </SubtotalRow>
                <tr>
                  <td colSpan={6}>Summe SAP (&quot;Contractual costs billing&quot;)</td>
                  <AmountCell>{formatEur(data.fixSap)}</AmountCell>
                </tr>
                <CompareRow $warn={data.fixedDeviation !== 0}>
                  <td colSpan={6}><strong>Abweichung (Upload − SAP)</strong></td>
                  <DeviationCell $hasDeviation={data.fixedDeviation !== 0}>
                    {formatEur(data.fixedDeviation)}
                  </DeviationCell>
                </CompareRow>
              </tbody>
            </Table>
          </Card>
        </>
      )}

      {!data && !loading && countryId && period && (
        <Card>
          <p style={{ color: '#666', margin: 0 }}>Keine Daten für die gewählte Kombination aus Land und Periode.</p>
        </Card>
      )}

      {/* Länder-Übersicht */}
      <GraySectionTitle shade="#333" style={{ marginTop: 40 }}>
        Alle Länder – Fix/Var Übersicht (sortiert nach Abweichung)
      </GraySectionTitle>
      <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0 }}>
        <FilterBar>
          <FilterCheckbox>
            <input type="checkbox" checked={hideZeroDeviation} onChange={(e) => setHideZeroDeviation(e.target.checked)} />
            Abweichung = 0 ausblenden
          </FilterCheckbox>
          <FilterCheckbox>
            <input type="checkbox" checked={hideZeroUpload} onChange={(e) => setHideZeroUpload(e.target.checked)} />
            Upload = 0 ausblenden
          </FilterCheckbox>
          <FilterCheckbox>
            <input type="checkbox" checked={hideZeroSap} onChange={(e) => setHideZeroSap(e.target.checked)} />
            SAP = 0 ausblenden
          </FilterCheckbox>
          <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
            {filteredOverview.length} / {overviewData.length} Länder
          </span>
        </FilterBar>
        {overviewLoading && <Spinner />}
        {!overviewLoading && filteredOverview.length === 0 && (
          <p style={{ color: '#666', margin: 0 }}>Keine Daten für die gewählte Periode / Filter.</p>
        )}
        {!overviewLoading && filteredOverview.length > 0 && (
          <Table>
            <thead>
              <tr>
                <th>FIR</th>
                <th>Land</th>
                <th style={{ textAlign: 'right' }}>Upload Variable</th>
                <th style={{ textAlign: 'right' }}>SAP Variable</th>
                <th style={{ textAlign: 'right' }}>Abw. Variable</th>
                <th style={{ textAlign: 'right' }}>Upload Fix</th>
                <th style={{ textAlign: 'right' }}>SAP Fix</th>
                <th style={{ textAlign: 'right' }}>Abw. Fix</th>
                <th style={{ textAlign: 'right' }}>Σ |Abw.|</th>
              </tr>
            </thead>
            <tbody>
              {filteredOverview.map((row) => (
                <tr key={row.countryId}>
                  <td>{row.fir}</td>
                  <OverviewCountryLink onClick={() => handleCountryClick(row.countryId)}>
                    {row.name} ({row.iso})
                  </OverviewCountryLink>
                  <ClickableAmount
                    onClick={() => row.variableUpload !== 0 && openDrillDown(row, 'variableUpload')}
                    style={row.variableUpload === 0 ? { cursor: 'default', color: 'inherit' } : undefined}
                  >
                    {formatEur(row.variableUpload)}
                  </ClickableAmount>
                  <ClickableAmount
                    onClick={() => row.variableSap !== 0 && openDrillDown(row, 'variableSap')}
                    style={row.variableSap === 0 ? { cursor: 'default', color: 'inherit' } : undefined}
                  >
                    {formatEur(row.variableSap)}
                  </ClickableAmount>
                  <DeviationCell $hasDeviation={row.variableDeviation !== 0}>
                    {formatEur(row.variableDeviation)}
                  </DeviationCell>
                  <ClickableAmount
                    onClick={() => row.fixUpload !== 0 && openDrillDown(row, 'fixUpload')}
                    style={row.fixUpload === 0 ? { cursor: 'default', color: 'inherit' } : undefined}
                  >
                    {formatEur(row.fixUpload)}
                  </ClickableAmount>
                  <ClickableAmount
                    onClick={() => row.fixSap !== 0 && openDrillDown(row, 'fixSap')}
                    style={row.fixSap === 0 ? { cursor: 'default', color: 'inherit' } : undefined}
                  >
                    {formatEur(row.fixSap)}
                  </ClickableAmount>
                  <DeviationCell $hasDeviation={row.fixedDeviation !== 0}>
                    {formatEur(row.fixedDeviation)}
                  </DeviationCell>
                  <DeviationCell $hasDeviation={row.totalDeviation !== 0} style={{ fontWeight: 700 }}>
                    {formatEur(row.totalDeviation)}
                  </DeviationCell>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Drill-Down Modal */}
      {drillDown && (
        <ModalOverlay onClick={closeDrillDown}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <strong>{drillDown.countryName}</strong>
                <span style={{ marginLeft: 12, fontSize: 13, color: '#666' }}>{DRILL_LABELS[drillDown.type]}</span>
              </div>
              <CloseBtn onClick={closeDrillDown}>&times;</CloseBtn>
            </ModalHeader>
            <ModalBody>
              {drillDown.loading && <Spinner />}
              {!drillDown.loading && (drillDown.type === 'variableSap' || drillDown.type === 'fixSap') && (
                <p style={{ color: '#666' }}>
                  SAP-Einzelzeilen sind in der Detailansicht oben pro Land einsehbar (Land anklicken).
                  Die SAP-Summe wird aus dem Text-Feld der SAP-Importe ermittelt.
                </p>
              )}
              {!drillDown.loading && (drillDown.type === 'variableUpload' || drillDown.type === 'fixUpload') && (
                <>
                  {drillDown.lines.length === 0 ? (
                    <p style={{ color: '#666' }}>Keine Zeilen gefunden.</p>
                  ) : (
                    <Table>
                      <thead>
                        <tr>
                          <th>Posting Date</th>
                          <th>Text</th>
                          <th>Account</th>
                          <th>Cost Center</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drillDown.lines.map((line) => (
                          <tr key={line.id}>
                            <td>{line.postingDate}</td>
                            <td>{line.text}</td>
                            <td>{line.account}</td>
                            <td>{line.costCenter}</td>
                            <AmountCell>{formatEur(line.amount)}</AmountCell>
                          </tr>
                        ))}
                        <SubtotalRow>
                          <td colSpan={4}><strong>Summe</strong></td>
                          <AmountCell>
                            <strong>{formatEur(drillDown.lines.reduce((s, l) => s + l.amount, 0))}</strong>
                          </AmountCell>
                        </SubtotalRow>
                      </tbody>
                    </Table>
                  )}
                </>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
}
