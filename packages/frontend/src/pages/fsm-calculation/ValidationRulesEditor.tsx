import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '../../components/ui';

const Container = styled.div`
  padding: 20px;
`;

const Card = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  background: white;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #333;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #555;
`;

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 24px;
    
    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background-color: #007bff;
  }
  
  input:checked + span:before {
    transform: translateX(24px);
  }
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const HistoryContainer = styled.div`
  margin-top: 24px;
`;

const HistoryItem = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
  background: #fafafa;
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const HistoryDate = styled.div`
  font-weight: 600;
  color: #333;
`;

const Badge = styled.span<{ type: 'current' | 'future' | 'past' }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.type === 'current' ? '#e8f5e9' : props.type === 'future' ? '#fff3e0' : '#e0e0e0'};
  color: ${props => props.type === 'current' ? '#2e7d32' : props.type === 'future' ? '#f57c00' : '#757575'};
`;

const HistoryDetails = styled.div`
  font-size: 13px;
  color: #666;
  line-height: 1.6;
`;

const InfoBox = styled.div`
  padding: 12px 16px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #856404;
`;

interface ValidationRuleConfig {
  id?: number;
  configId: string;
  revision: number;
  enableDuplicateCheck: boolean;
  enableStatusCheck: boolean;
  enableMandantCheck: boolean;
  enableChannelCheck: boolean;
  validStatuses: string[];
  duplicateStrategy: 'first' | 'all' | 'latest';
  validFrom: Date;
  validTo: Date | null;
  createdBy: string;
  createdAt?: Date;
  notes?: string | null;
}

export default function ValidationRulesEditor() {
  const [config, setConfig] = useState<ValidationRuleConfig | null>(null);
  const [history, setHistory] = useState<ValidationRuleConfig[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [enableDuplicateCheck, setEnableDuplicateCheck] = useState(true);
  const [enableStatusCheck, setEnableStatusCheck] = useState(true);
  const [enableMandantCheck, setEnableMandantCheck] = useState(true);
  const [enableChannelCheck, setEnableChannelCheck] = useState(true);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'first' | 'all' | 'latest'>('first');
  const [validStatuses, setValidStatuses] = useState('invoice, no show, open');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gds-dcf/validation-config');
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
        setEnableDuplicateCheck(result.data.enableDuplicateCheck);
        setEnableStatusCheck(result.data.enableStatusCheck);
        setEnableMandantCheck(result.data.enableMandantCheck);
        setEnableChannelCheck(result.data.enableChannelCheck);
        setDuplicateStrategy(result.data.duplicateStrategy);
        setValidStatuses(result.data.validStatuses.join(', '));
        setValidFrom(new Date().toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Failed to load validation config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/gds-dcf/validation-config/history');
      const result = await response.json();
      
      if (result.success) {
        setHistory(result.data);
      }
    } catch (error) {
      console.error('Failed to load validation config history:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/gds-dcf/validation-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enableDuplicateCheck,
          enableStatusCheck,
          enableMandantCheck,
          enableChannelCheck,
          validStatuses: validStatuses.split(',').map(s => s.trim()),
          duplicateStrategy,
          validFrom,
          notes,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Validation rule configuration saved successfully!');
        await loadConfig();
        if (showHistory) {
          await loadHistory();
        }
        setNotes('');
      } else {
        alert('Failed to save: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save validation config:', error);
      alert('Failed to save validation configuration');
    } finally {
      setSaving(false);
    }
  };

  const toggleHistory = async () => {
    if (!showHistory) {
      await loadHistory();
    }
    setShowHistory(!showHistory);
  };

  const getConfigStatus = (cfg: ValidationRuleConfig): 'current' | 'future' | 'past' => {
    const now = new Date();
    const validFromDate = new Date(cfg.validFrom);
    const validToDate = cfg.validTo ? new Date(cfg.validTo) : null;
    
    if (validFromDate > now) return 'future';
    if (validToDate && validToDate < now) return 'past';
    return 'current';
  };

  if (loading) {
    return <Container>Loading...</Container>;
  }

  return (
    <Container>
      <Card>
        <Title>Validation Rule Configuration</Title>
        
        <InfoBox>
          <strong>Note:</strong> Changes to validation rules apply based on the "Valid From" date. 
          Rules are applied to each reservation based on its handover date, ensuring temporal consistency.
        </InfoBox>

        <FormGrid>
          <FormGroup>
            <Label>Channel Check (GDS/DCF Detection)</Label>
            <ToggleWrapper>
              <Toggle>
                <input
                  type="checkbox"
                  checked={enableChannelCheck}
                  onChange={(e) => setEnableChannelCheck(e.target.checked)}
                />
                <span />
              </Toggle>
              <span>{enableChannelCheck ? 'Enabled' : 'Disabled'}</span>
            </ToggleWrapper>
          </FormGroup>

          <FormGroup>
            <Label>Mandant Check (Franchise Validation)</Label>
            <ToggleWrapper>
              <Toggle>
                <input
                  type="checkbox"
                  checked={enableMandantCheck}
                  onChange={(e) => setEnableMandantCheck(e.target.checked)}
                />
                <span />
              </Toggle>
              <span>{enableMandantCheck ? 'Enabled' : 'Disabled'}</span>
            </ToggleWrapper>
          </FormGroup>

          <FormGroup>
            <Label>Status Check</Label>
            <ToggleWrapper>
              <Toggle>
                <input
                  type="checkbox"
                  checked={enableStatusCheck}
                  onChange={(e) => setEnableStatusCheck(e.target.checked)}
                />
                <span />
              </Toggle>
              <span>{enableStatusCheck ? 'Enabled' : 'Disabled'}</span>
            </ToggleWrapper>
          </FormGroup>

          {enableStatusCheck && (
            <FormGroup>
              <Label>Valid Statuses (comma-separated)</Label>
              <Input
                type="text"
                value={validStatuses}
                onChange={(e) => setValidStatuses(e.target.value)}
                placeholder="invoice, no show, open"
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label>Duplicate Check</Label>
            <ToggleWrapper>
              <Toggle>
                <input
                  type="checkbox"
                  checked={enableDuplicateCheck}
                  onChange={(e) => setEnableDuplicateCheck(e.target.checked)}
                />
                <span />
              </Toggle>
              <span>{enableDuplicateCheck ? 'Enabled' : 'Disabled'}</span>
            </ToggleWrapper>
          </FormGroup>

          {enableDuplicateCheck && (
            <FormGroup>
              <Label>Duplicate Strategy</Label>
              <Select
                value={duplicateStrategy}
                onChange={(e) => setDuplicateStrategy(e.target.value as 'first' | 'all' | 'latest')}
              >
                <option value="first">Keep First Occurrence</option>
                <option value="latest">Keep Latest Occurrence</option>
                <option value="all">Keep All (No Deduplication)</option>
              </Select>
            </FormGroup>
          )}

          <FormGroup>
            <Label>Valid From Date</Label>
            <Input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Notes (optional)</Label>
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the changes made..."
            />
          </FormGroup>
        </FormGrid>

        <ButtonGroup>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
          <Button onClick={toggleHistory} style={{ background: '#6c757d' }}>
            {showHistory ? 'Hide History' : 'Show History'}
          </Button>
        </ButtonGroup>
      </Card>

      {showHistory && (
        <Card>
          <Title>Configuration History</Title>
          <HistoryContainer>
            {history.map((cfg) => (
              <HistoryItem key={cfg.id}>
                <HistoryHeader>
                  <HistoryDate>
                    Valid From: {new Date(cfg.validFrom).toLocaleDateString()}
                    {cfg.validTo && ` - ${new Date(cfg.validTo).toLocaleDateString()}`}
                  </HistoryDate>
                  <Badge type={getConfigStatus(cfg)}>
                    {getConfigStatus(cfg).toUpperCase()}
                  </Badge>
                </HistoryHeader>
                <HistoryDetails>
                  <div><strong>Revision:</strong> {cfg.revision}</div>
                  <div><strong>Channel Check:</strong> {cfg.enableChannelCheck ? '✓' : '✗'}</div>
                  <div><strong>Mandant Check:</strong> {cfg.enableMandantCheck ? '✓' : '✗'}</div>
                  <div><strong>Status Check:</strong> {cfg.enableStatusCheck ? '✓' : '✗'}</div>
                  <div><strong>Duplicate Check:</strong> {cfg.enableDuplicateCheck ? '✓' : '✗'}</div>
                  {cfg.enableDuplicateCheck && (
                    <div><strong>Duplicate Strategy:</strong> {cfg.duplicateStrategy}</div>
                  )}
                  {cfg.enableStatusCheck && (
                    <div><strong>Valid Statuses:</strong> {cfg.validStatuses.join(', ')}</div>
                  )}
                  <div><strong>Created By:</strong> {cfg.createdBy}</div>
                  {cfg.notes && <div><strong>Notes:</strong> {cfg.notes}</div>}
                </HistoryDetails>
              </HistoryItem>
            ))}
          </HistoryContainer>
        </Card>
      )}
    </Container>
  );
}
