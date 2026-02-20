import styled, { keyframes, css } from 'styled-components';
import { theme } from '../styles/theme';

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 24px;
`;

export const Card = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius};
  box-shadow: ${theme.shadow};
  padding: 24px;
  margin-bottom: 20px;
`;

export const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: ${theme.borderRadius};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;

  ${(p) => {
    switch (p.$variant) {
      case 'danger':
        return css`
          background: ${theme.colors.danger};
          color: ${theme.colors.white};
          &:hover { background: #c82333; }
        `;
      case 'secondary':
        return css`
          background: ${theme.colors.border};
          color: ${theme.colors.textPrimary};
          &:hover { background: #d0d0d0; }
        `;
      default:
        return css`
          background: ${theme.colors.primary};
          color: ${theme.colors.white};
          &:hover { background: ${theme.colors.primaryHover}; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Select = styled.select`
  padding: 10px 14px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius};
  font-size: 14px;
  background: ${theme.colors.white};
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 95, 0, 0.15);
  }
`;

export const Input = styled.input`
  padding: 10px 14px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 95, 0, 0.15);
  }
`;

export const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  margin-bottom: 6px;
`;

export const FormGroup = styled.div`
  margin-bottom: 16px;
`;

export const FormRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

export const Table = styled.table`
  width: 100%;
  font-size: 13px;

  th {
    background: ${theme.colors.secondary};
    color: ${theme.colors.white};
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    white-space: nowrap;
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid ${theme.colors.border};
  }

  tr:nth-child(even) {
    background: ${theme.colors.background};
  }

  tr:hover {
    background: rgba(255, 95, 0, 0.04);
  }
`;

export const AmountCell = styled.td`
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
`;

export const SubtotalRow = styled.tr`
  background: #f0f0f0 !important;
  font-weight: 700;

  td {
    border-top: 2px solid ${theme.colors.secondary};
  }
`;

export const TotalRow = styled.tr`
  background: ${theme.colors.primary} !important;
  color: ${theme.colors.white};
  font-weight: 700;
  font-size: 14px;

  td, th {
    color: ${theme.colors.white};
  }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  margin: 40px auto;
`;

export const Alert = styled.div<{ $type?: 'success' | 'error' | 'info' }>`
  padding: 12px 16px;
  border-radius: ${theme.borderRadius};
  margin-bottom: 16px;
  font-size: 14px;

  ${(p) => {
    switch (p.$type) {
      case 'error':
        return css`background: #fce4e4; color: ${theme.colors.danger}; border: 1px solid #f5c6cb;`;
      case 'success':
        return css`background: #d4edda; color: ${theme.colors.success}; border: 1px solid #c3e6cb;`;
      default:
        return css`background: #d1ecf1; color: ${theme.colors.info}; border: 1px solid #bee5eb;`;
    }
  }}
`;

export const Badge = styled.span<{ $color?: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: ${(p) => p.$color || theme.colors.primary};
  color: ${theme.colors.white};
`;

export const FileInput = styled.div`
  border: 2px dashed ${theme.colors.border};
  border-radius: ${theme.borderRadius};
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${theme.colors.primary};
    background: rgba(255, 95, 0, 0.02);
  }

  input[type="file"] {
    display: none;
  }

  p {
    color: ${theme.colors.textSecondary};
    font-size: 14px;
    margin-top: 8px;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  padding: 8px 16px;
  margin: 20px 0 0;
  border-radius: ${theme.borderRadius} ${theme.borderRadius} 0 0;
`;
