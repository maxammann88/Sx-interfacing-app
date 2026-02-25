import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import api from '../utils/api';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  padding: 28px 32px;
  max-width: 400px;
  width: 90%;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 8px;
`;

const Description = styled.p`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 20px;
  line-height: 1.5;
`;

const Label = styled.label`
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 4px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 12px;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 12px;
  box-sizing: border-box;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const ErrorMsg = styled.div`
  font-size: 12px;
  color: ${theme.colors.danger};
  margin-bottom: 12px;
  font-weight: 600;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const Btn = styled.button<{ $variant?: string }>`
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  background: ${p => p.$variant === 'danger' ? theme.colors.danger : theme.colors.border};
  color: ${p => p.$variant === 'danger' ? 'white' : theme.colors.textPrimary};
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ message, onConfirm, onCancel }: Props) {
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    api.get('/team-members').then(res => {
      const names = (res.data as any[])
        .filter(m => m.hasDeletePassword)
        .map(m => m.name);
      setTeamMembers(names);
    }).catch(() => {});
  }, []);

  const handleConfirm = async () => {
    if (!selectedName || !password) {
      setError('Bitte Name und Passwort eingeben');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await api.post('/team-members/verify-delete', { name: selectedName, password });
      if (res.data.success) {
        onConfirm();
      } else {
        setError(res.data.error || 'Falsches Passwort');
      }
    } catch {
      setError('Fehler bei der Validierung');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Overlay onClick={onCancel}>
      <Modal onClick={e => e.stopPropagation()}>
        <Title>Löschen bestätigen</Title>
        <Description>{message}</Description>

        <Label>Name</Label>
        <Select value={selectedName} onChange={e => { setSelectedName(e.target.value); setError(''); }}>
          <option value="">– Bitte wählen –</option>
          {teamMembers.map(n => <option key={n} value={n}>{n}</option>)}
        </Select>

        <Label>Delete-Passwort</Label>
        <Input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(''); }}
          placeholder="Passwort eingeben..."
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          autoFocus
        />

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <ButtonRow>
          <Btn onClick={onCancel}>Abbrechen</Btn>
          <Btn
            $variant="danger"
            onClick={handleConfirm}
            disabled={verifying || !selectedName || !password}
          >
            {verifying ? 'Prüfe...' : 'Löschen'}
          </Btn>
        </ButtonRow>
      </Modal>
    </Overlay>
  );
}
