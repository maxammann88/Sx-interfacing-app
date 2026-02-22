import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const Wrapper = styled.div`max-width: 900px;`;
const Title = styled.h1`font-size: 22px; font-weight: 700; margin-bottom: 16px; color: ${theme.colors.textPrimary};`;
const InfoBox = styled.div`
  background: #f8f9fa; border: 1px solid ${theme.colors.border}; border-radius: 10px;
  padding: 24px 28px; line-height: 1.7; font-size: 14px; color: ${theme.colors.textSecondary};
`;

export default function AccountMappingPage() {
  return (
    <Wrapper>
      <Title>Account Mapping</Title>
      <InfoBox>
        <p>Manage the mapping between SAP accounts and interfacing statement line items. Define which GL accounts map to Clearing, Billing and Account Statement sections.</p>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>GL account to statement section mapping</li>
          <li>A/P and A/R account assignments per country</li>
          <li>Deposit account configuration</li>
          <li>Reconciliation account setup</li>
        </ul>
      </InfoBox>
    </Wrapper>
  );
}
