import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const PageSubtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 24px;
  margin-bottom: 24px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
`;

const CardTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #333;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DownloadButton = styled(Button)`
  background: #28a745;
  color: white;

  &:hover {
    background: #218838;
  }
`;

const RuleSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #444;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 4px;
`;

const RuleTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    background: #f8f9fa;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #555;
    border-bottom: 2px solid #dee2e6;
  }

  td {
    padding: 10px 12px;
    border-bottom: 1px solid #e9ecef;
    color: #333;
  }

  tr:hover {
    background: #f8f9fa;
  }
`;

const InfoBox = styled.div`
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #1565c0;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  font-size: 16px;
  color: #666;
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  border-left: 4px solid #f44336;
  padding: 16px;
  border-radius: 4px;
  color: #c62828;
  font-size: 14px;
`;

interface CalculationRuleSnapshot {
  snapshotDate: string;
  validFrom: string;
  validTo: string | null;
  rulesetName: string;
  rulesetVersion: string;
  fullRulesetJson: any;
}

export default function FsmCalculationRulesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<CalculationRuleSnapshot | null>(null);
  const [downloading, setDownloading] = useState<'excel' | 'pdf' | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/gds-dcf/rules');
      const result = await response.json();
      
      if (result.success) {
        // Transform the API response to match our expected structure
        const transformedSnapshot = {
          snapshotDate: new Date().toISOString(),
          validFrom: result.data.validFrom,
          validTo: result.data.validTo,
          rulesetName: 'GDS & DCF Fee Rules',
          rulesetVersion: result.data.version || '1.0',
          fullRulesetJson: result.data.rules,
        };
        console.log('Loaded rules:', result.data.rules);
        console.log('Transformed snapshot:', transformedSnapshot);
        setSnapshot(transformedSnapshot);
      } else {
        setError(result.error || 'Failed to load calculation rules');
      }
    } catch (err) {
      console.error('Failed to load rules:', err);
      setError('Failed to load calculation rules');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'excel' | 'pdf') => {
    try {
      setDownloading(format);
      
      const response = await fetch(`/api/gds-dcf/rules/export/${format}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GDS_DCF_Rules_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner>Loading calculation rules...</LoadingSpinner>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageTitle>Calculation Rules</PageTitle>
        <ErrorMessage>{error}</ErrorMessage>
      </PageContainer>
    );
  }

  if (!snapshot || !snapshot.fullRulesetJson) {
    return (
      <PageContainer>
        <PageTitle>Calculation Rules</PageTitle>
        <ErrorMessage>No calculation rules found</ErrorMessage>
      </PageContainer>
    );
  }

  const rules = Array.isArray(snapshot.fullRulesetJson) ? snapshot.fullRulesetJson : [];
  
  // Group rules by category
  const rulesByCategory = rules.reduce((acc: any, rule: any) => {
    const category = rule.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(rule);
    return acc;
  }, {});

  // Sort rules within each category by ruleOrder
  Object.keys(rulesByCategory).forEach(category => {
    rulesByCategory[category].sort((a: any, b: any) => (a.ruleOrder || 0) - (b.ruleOrder || 0));
  });

  return (
    <PageContainer>
      <PageTitle>GDS & DCF Calculation Rules</PageTitle>
      <PageSubtitle>
        Complete rule set for fee calculation - Version {snapshot.rulesetVersion} (Generated: {new Date(snapshot.snapshotDate).toLocaleString('de-DE')})
      </PageSubtitle>

      <InfoBox>
        <strong>📋 About these rules:</strong> This is the current active calculation logic used by the system. 
        All parameters, fees, and mappings are dynamically generated from your configuration in Parameter Maintenance.
        Valid from {new Date(snapshot.validFrom).toLocaleDateString('de-DE')}{snapshot.validTo ? ` until ${new Date(snapshot.validTo).toLocaleDateString('de-DE')}` : ' (indefinite)'}.
      </InfoBox>

      <Card>
        <CardHeader>
          <CardTitle>Download Options</CardTitle>
          <ButtonGroup>
            <DownloadButton 
              onClick={() => handleDownload('excel')}
              disabled={downloading !== null}
            >
              {downloading === 'excel' ? '⏳ Downloading...' : '📊 Download Excel'}
            </DownloadButton>
            <DownloadButton 
              onClick={() => handleDownload('pdf')}
              disabled={downloading !== null}
            >
              {downloading === 'pdf' ? '⏳ Downloading...' : '📄 Download PDF'}
            </DownloadButton>
          </ButtonGroup>
        </CardHeader>
      </Card>

      {/* Validation Rules */}
      {rulesByCategory['Validation'] && rulesByCategory['Validation'].length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>1. Validation Rules</CardTitle>
          </CardHeader>
          <RuleSection>
            <SectionTitle>Required Fields & Format Validation</SectionTitle>
            <RuleTable>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Rule ID</th>
                  <th>Title</th>
                  <th style={{ width: '150px' }}>Applies To</th>
                </tr>
              </thead>
              <tbody>
                {rulesByCategory['Validation'].map((rule: any) => (
                  <tr key={rule.ruleId}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{rule.ruleId}</td>
                    <td>{rule.title}</td>
                    <td>{rule.appliesTo || 'All'}</td>
                  </tr>
                ))}
              </tbody>
            </RuleTable>
          </RuleSection>
        </Card>
      )}

      {/* Partner Detection */}
      {rulesByCategory['Partner Detection'] && rulesByCategory['Partner Detection'].length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Partner Detection Rules</CardTitle>
          </CardHeader>
          <RuleSection>
            <SectionTitle>How to Identify GDS/DCF Partners</SectionTitle>
            <RuleTable>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Rule ID</th>
                  <th>Title</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rulesByCategory['Partner Detection'].map((rule: any) => (
                  <tr key={rule.ruleId}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{rule.ruleId}</td>
                    <td style={{ fontWeight: 500 }}>{rule.title}</td>
                    <td style={{ fontSize: '12px', color: '#666' }}>
                      {rule.logic && typeof rule.logic === 'object' ? JSON.stringify(rule.logic) : rule.logic || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </RuleTable>
          </RuleSection>
        </Card>
      )}

      {/* Fee Calculation */}
      {rulesByCategory['Fee Calculation'] && rulesByCategory['Fee Calculation'].length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Fee Calculation Rules</CardTitle>
          </CardHeader>
          <RuleSection>
            <div style={{ 
              padding: '12px 16px', 
              background: '#fff3cd', 
              border: '1px solid #ffc107',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#856404'
            }}>
              <strong>ℹ️ Note:</strong> This fee table is automatically updated when you modify partner fees on the <strong>Parameter Maintenance</strong> page. All values displayed here reflect the currently active parameter configuration.
            </div>
            {rulesByCategory['Fee Calculation'].map((rule: any) => (
              <div key={rule.ruleId} style={{ marginBottom: '24px' }}>
                <div style={{ 
                  padding: '12px 16px', 
                  background: '#f8f9fa', 
                  borderLeft: '4px solid #007bff',
                  marginBottom: '12px',
                  fontWeight: 600
                }}>
                  {rule.title.replace(' Fee Calculation', '')}
                </div>
                {rule.feeStructure && (
                  <RuleTable>
                    <thead>
                      <tr>
                        <th>Region / Type</th>
                        <th>Currency</th>
                        <th>Amount</th>
                        <th>Conditions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(rule.feeStructure).map(([key, value]: [string, any]) => (
                        <tr key={key}>
                          <td style={{ fontWeight: 500 }}>{key}</td>
                          <td>{value.currency || 'EUR'}</td>
                          <td>{typeof value === 'object' ? value.amount?.toFixed(2) || '-' : value}</td>
                          <td style={{ fontSize: '12px', color: '#666' }}>{value.conditions || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </RuleTable>
                )}
              </div>
            ))}
          </RuleSection>
        </Card>
      )}

      {/* Region Mapping */}
      {rulesByCategory['Exceptions'] && rulesByCategory['Exceptions'].length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>4. Region Mapping</CardTitle>
          </CardHeader>
          <RuleSection>
            <div style={{ 
              padding: '12px 16px', 
              background: '#fff3cd', 
              border: '1px solid #ffc107',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px',
              color: '#856404'
            }}>
              <strong>ℹ️ Note:</strong> This region mapping is automatically updated when you modify country assignments on the <strong>Parameter Maintenance</strong> page. All countries not listed below are assigned to the default EMEA region.
            </div>
            <RuleTable>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Region</th>
                  <th>Assigned Countries</th>
                </tr>
              </thead>
              <tbody>
                {rulesByCategory['Exceptions'].map((rule: any) => (
                  <tr key={rule.ruleId}>
                    <td style={{ fontWeight: 600 }}>{rule.title.replace('Region Mapping: ', '')}</td>
                    <td style={{ fontSize: '12px' }}>
                      {rule.mapping && typeof rule.mapping === 'object' 
                        ? Object.entries(rule.mapping).map(([k, v]: [string, any]) => (
                            <span key={k}>{Array.isArray(v) ? v.join(', ').toUpperCase() : v}</span>
                          ))
                        : '-'}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#f8f9fa' }}>
                  <td style={{ fontWeight: 600 }}>EMEA</td>
                  <td style={{ fontSize: '12px', fontStyle: 'italic', color: '#666' }}>
                    All countries not explicitly assigned to Americas or Other (Default Region)
                  </td>
                </tr>
              </tbody>
            </RuleTable>
          </RuleSection>
        </Card>
      )}

      {/* Currency */}
      {rulesByCategory['Currency'] && rulesByCategory['Currency'].length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>5. Currency Conversion Rules</CardTitle>
          </CardHeader>
          <RuleSection>
            <div style={{ marginBottom: '12px', fontSize: '13px', color: '#666' }}>
              <strong>Note:</strong> All rates are end-of-month rates. USD fees are converted to EUR using the rate from the booking's handover month.
            </div>
            <RuleTable>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Rule ID</th>
                  <th>Title</th>
                  <th>Exchange Rates</th>
                </tr>
              </thead>
              <tbody>
                {rulesByCategory['Currency'].map((rule: any) => (
                  <tr key={rule.ruleId}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{rule.ruleId}</td>
                    <td style={{ fontWeight: 500 }}>{rule.title}</td>
                    <td style={{ fontSize: '12px' }}>
                      {rule.rates && typeof rule.rates === 'object' 
                        ? Object.entries(rule.rates).map(([month, rate]: [string, any]) => (
                            <span key={month} style={{ marginRight: '16px' }}>
                              <strong>{month}:</strong> {Number(rate).toFixed(4)}
                            </span>
                          ))
                        : rule.ruleId === 'CUR-002' ? 'Default: 0.9200 (fallback when month not found)' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </RuleTable>
          </RuleSection>
        </Card>
      )}
    </PageContainer>
  );
}
