import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { PageTitle, Card, Button } from '../../components/ui';
import { GdsDcfValidationResult, GdsDcfUpload } from '@sixt/shared';

const ResultsContainer = styled.div`
  padding: 20px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #ff5f00 0%, #ff8533 100%);
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 8px rgba(255, 95, 0, 0.2);
`;

const StatLabel = styled.div`
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
`;

const ExportButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ExportButton = styled(Button)`
  font-size: 13px;
  padding: 8px 16px;
  background: ${props => props.theme.colors.primary};
  
  &:hover {
    opacity: 0.9;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ResultsTable = styled.table`
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
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  tbody tr:hover {
    background: #f9f9f9;
  }
`;

const ChargeableBadge = styled.span<{ chargeable: boolean }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: ${props => props.chargeable ? '#d4edda' : '#f8d7da'};
  color: ${props => props.chargeable ? '#155724' : '#721c24'};
`;

const ValidationSteps = styled.div`
  font-size: 11px;
  color: #666;
  margin-top: 4px;
`;

const StepIndicator = styled.span<{ passed: boolean }>`
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${props => props.passed ? '#28a745' : '#dc3545'};
  color: white;
  text-align: center;
  line-height: 18px;
  margin-right: 4px;
  font-size: 10px;
  font-weight: 600;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const DetailRow = styled.tr`
  background: #f8f9fa !important;
`;

const DetailCell = styled.td`
  padding: 16px !important;
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StepItem = styled.div<{ passed: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid ${props => props.passed ? '#28a745' : '#dc3545'};
`;

export default function FsmResultsPage() {
  const [searchParams] = useSearchParams();
  const uploadId = searchParams.get('uploadId');
  
  const [upload, setUpload] = useState<GdsDcfUpload | null>(null);
  const [results, setResults] = useState<GdsDcfValidationResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<GdsDcfValidationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPartner, setFilterPartner] = useState('all');
  const [filterFeeType, setFilterFeeType] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [franchiseMandants, setFranchiseMandants] = useState<any[]>([]);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (uploadId) {
      loadResults(parseInt(uploadId, 10));
      loadFranchiseMandants();
    }
  }, [uploadId]);

  useEffect(() => {
    applyFilters();
  }, [results, filterPartner, filterFeeType, filterCountry, franchiseMandants]);

  useEffect(() => {
    if (sortField) {
      applySorting();
    }
  }, [filteredResults, sortField, sortDirection]);

  const loadResults = async (id: number) => {
    try {
      const response = await fetch(`/api/gds-dcf/results/${id}`);
      const result = await response.json();
      
      if (result.success) {
        setUpload(result.data.upload);
        setResults(result.data.results);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFranchiseMandants = async () => {
    try {
      const response = await fetch('/api/gds-dcf/mandants');
      const result = await response.json();
      if (result.success) {
        setFranchiseMandants(result.data);
      }
    } catch (err) {
      console.error('Failed to load franchise mandants:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...results];

    if (filterPartner !== 'all') {
      filtered = filtered.filter(r => r.partner === filterPartner);
    }

    if (filterFeeType !== 'all') {
      filtered = filtered.filter(r => r.feeType === filterFeeType);
    }

    if (filterCountry !== 'all') {
      filtered = filtered.filter(r => {
        const mandant = franchiseMandants.find(m => m.fir === r.reservation.mandantCode);
        return mandant && mandant.iso === filterCountry;
      });
    }

    setFilteredResults(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, start with ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const applySorting = () => {
    if (!sortField) return;

    const sorted = [...filteredResults].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'feeType':
          aVal = a.feeType || '';
          bVal = b.feeType || '';
          break;
        case 'country':
          const aMandant = franchiseMandants.find(m => m.fir === a.reservation.mandantCode);
          const bMandant = franchiseMandants.find(m => m.fir === b.reservation.mandantCode);
          aVal = aMandant?.iso || '';
          bVal = bMandant?.iso || '';
          break;
        case 'fee':
          aVal = a.calculatedFee;
          bVal = b.calculatedFee;
          break;
        case 'partner':
          aVal = a.partner;
          bVal = b.partner;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredResults(sorted);
  };

  const toggleExpand = (resNumber: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(resNumber)) {
      newExpanded.delete(resNumber);
    } else {
      newExpanded.add(resNumber);
    }
    setExpandedRows(newExpanded);
  };

  const handleExportPDF = () => {
    window.open(`/api/gds-dcf/export/pdf/${uploadId}`, '_blank');
  };

  const handleExportExcel = () => {
    window.open(`/api/gds-dcf/export/excel/${uploadId}`, '_blank');
  };

  const uniquePartners = Array.from(new Set(results.map(r => r.partner)));
  const uniqueCountries = Array.from(new Set(
    results
      .map(r => {
        const mandant = franchiseMandants.find(m => m.fir === r.reservation.mandantCode);
        return mandant ? mandant.iso : null;
      })
      .filter(Boolean)
  ));
  
  // Calculate dynamic summary stats based on filtered results
  const filteredChargeableCount = filteredResults.length;
  const filteredTotalFees = filteredResults.reduce((sum, r) => sum + r.calculatedFee, 0);

  if (loading) {
    return (
      <div>
        <PageTitle>Validation Results</PageTitle>
        <Card>
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            Loading results...
          </div>
        </Card>
      </div>
    );
  }

  if (!upload) {
    return (
      <div>
        <PageTitle>Validation Results</PageTitle>
        <Card>
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            No upload found. Please upload a file first.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageTitle>Validation Results - {upload.filename}</PageTitle>
      
      <Card>
        <ResultsContainer>
          <SummaryGrid>
            <StatCard>
              <StatLabel>Total Reservations</StatLabel>
              <StatValue>{filteredChargeableCount}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Chargeable</StatLabel>
              <StatValue>{filteredChargeableCount}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Total Fees (EUR)</StatLabel>
              <StatValue>€{filteredTotalFees.toFixed(2)}</StatValue>
            </StatCard>
          </SummaryGrid>

          <FilterBar>
            <FilterSection>
              <Select value={filterPartner} onChange={(e) => setFilterPartner(e.target.value)}>
                <option value="all">All Partners</option>
                {uniquePartners.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>

              <Select value={filterFeeType} onChange={(e) => setFilterFeeType(e.target.value)}>
                <option value="all">All Fee Types</option>
                <option value="GDS">GDS</option>
                <option value="DCF">DCF</option>
              </Select>

              <Select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
                <option value="all">All Countries</option>
                {uniqueCountries.sort().map(country => (
                  <option key={country} value={country}>
                    {country} - {franchiseMandants.filter(m => m.iso === country).map(m => m.fir).join(', ')}
                  </option>
                ))}
              </Select>
            </FilterSection>

            <ExportButtons>
              <ExportButton onClick={handleExportPDF}>
                📄 Export PDF
              </ExportButton>
              <ExportButton onClick={handleExportExcel}>
                📊 Export Excel
              </ExportButton>
            </ExportButtons>
          </FilterBar>

          <div style={{ overflowX: 'auto' }}>
            <ResultsTable>
              <thead>
                <tr>
                  <th>RES-NUMBER</th>
                  <th>Source Ch2</th>
                  <th>Source Ch3</th>
                  <th>Mandant</th>
                  <th 
                    onClick={() => handleSort('country')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    POS Country {sortField === 'country' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th>Status</th>
                  <th 
                    onClick={() => handleSort('partner')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Partner {sortField === 'partner' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th 
                    onClick={() => handleSort('feeType')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Fee Type {sortField === 'feeType' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th>Chargeable</th>
                  <th 
                    onClick={() => handleSort('fee')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Fee (EUR) {sortField === 'fee' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map(result => (
                  <React.Fragment key={result.reservation.resNumber}>
                    <tr>
                      <td>{result.reservation.resNumber}</td>
                      <td>{result.reservation.sourceChannel2}</td>
                      <td>{result.reservation.sourceChannel3}</td>
                      <td>{result.reservation.mandantCode}</td>
                      <td>{result.reservation.posCountryCode}</td>
                      <td>{result.reservation.statusExtended}</td>
                      <td>{result.partner}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: result.feeType === 'GDS' ? '#e3f2fd' : '#fff3e0',
                          color: result.feeType === 'GDS' ? '#1976d2' : '#f57c00'
                        }}>
                          {result.feeType || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <ChargeableBadge chargeable={result.isChargeable}>
                          {result.isChargeable ? 'YES' : 'NO'}
                        </ChargeableBadge>
                      </td>
                      <td>
                        {result.isChargeable ? (
                          <strong>EUR {result.calculatedFee.toFixed(2)}</strong>
                        ) : (
                          <span style={{ color: '#999' }}>0.00</span>
                        )}
                      </td>
                      <td>
                        <ExpandButton onClick={() => toggleExpand(result.reservation.resNumber)}>
                          {expandedRows.has(result.reservation.resNumber) ? '▼ Hide' : '▶ Show'} Steps
                        </ExpandButton>
                      </td>
                    </tr>
                    {expandedRows.has(result.reservation.resNumber) && (
                      <DetailRow>
                        <DetailCell colSpan={10}>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                            Validation Steps:
                          </div>
                          <StepList>
                            {result.validationSteps.map((step, idx) => (
                              <StepItem key={idx} passed={step.passed}>
                                <StepIndicator passed={step.passed}>
                                  {step.passed ? '✓' : '✗'}
                                </StepIndicator>
                                <div>
                                  <strong>{step.step}</strong>
                                  {step.reason && (
                                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                                      {step.reason}
                                    </div>
                                  )}
                                </div>
                              </StepItem>
                            ))}
                          </StepList>
                        </DetailCell>
                      </DetailRow>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </ResultsTable>
          </div>
        </ResultsContainer>
      </Card>
    </div>
  );
}
