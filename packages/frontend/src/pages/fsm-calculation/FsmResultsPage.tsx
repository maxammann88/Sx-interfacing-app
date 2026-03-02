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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  
  &:nth-child(2) {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  
  &:nth-child(3) {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
  
  &:nth-child(4) {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }
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

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
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
  const [filterChargeable, setFilterChargeable] = useState('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (uploadId) {
      loadResults(parseInt(uploadId, 10));
    }
  }, [uploadId]);

  useEffect(() => {
    applyFilters();
  }, [results, filterPartner, filterChargeable]);

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

  const applyFilters = () => {
    let filtered = [...results];

    if (filterPartner !== 'all') {
      filtered = filtered.filter(r => r.partner === filterPartner);
    }

    if (filterChargeable === 'chargeable') {
      filtered = filtered.filter(r => r.isChargeable);
    } else if (filterChargeable === 'non-chargeable') {
      filtered = filtered.filter(r => !r.isChargeable);
    }

    setFilteredResults(filtered);
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

  const uniquePartners = Array.from(new Set(results.map(r => r.partner)));
  const chargeableCount = results.filter(r => r.isChargeable).length;
  const totalFees = results.filter(r => r.isChargeable).reduce((sum, r) => sum + r.calculatedFee, 0);

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
              <StatValue>{results.length}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Chargeable</StatLabel>
              <StatValue>{chargeableCount}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Non-Chargeable</StatLabel>
              <StatValue>{results.length - chargeableCount}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Total Fees</StatLabel>
              <StatValue>{totalFees.toFixed(2)}</StatValue>
            </StatCard>
          </SummaryGrid>

          <FilterBar>
            <Select value={filterPartner} onChange={(e) => setFilterPartner(e.target.value)}>
              <option value="all">All Partners</option>
              {uniquePartners.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>

            <Select value={filterChargeable} onChange={(e) => setFilterChargeable(e.target.value)}>
              <option value="all">All Reservations</option>
              <option value="chargeable">Chargeable Only</option>
              <option value="non-chargeable">Non-Chargeable Only</option>
            </Select>

            <Button onClick={() => alert('Export feature coming soon')}>
              Export to Excel
            </Button>
          </FilterBar>

          <div style={{ overflowX: 'auto' }}>
            <ResultsTable>
              <thead>
                <tr>
                  <th>RES-NUMBER</th>
                  <th>SOURCE</th>
                  <th>POS</th>
                  <th>Partner</th>
                  <th>Region</th>
                  <th>Chargeable</th>
                  <th>Fee</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map(result => (
                  <React.Fragment key={result.reservation.resNumber}>
                    <tr>
                      <td>{result.reservation.resNumber}</td>
                      <td>{result.reservation.source}</td>
                      <td>{result.reservation.pos}</td>
                      <td>{result.partner}</td>
                      <td>{result.region}</td>
                      <td>
                        <ChargeableBadge chargeable={result.isChargeable}>
                          {result.isChargeable ? 'YES' : 'NO'}
                        </ChargeableBadge>
                      </td>
                      <td>
                        {result.isChargeable ? (
                          <strong>{result.currency} {result.calculatedFee.toFixed(2)}</strong>
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
                        <DetailCell colSpan={8}>
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
