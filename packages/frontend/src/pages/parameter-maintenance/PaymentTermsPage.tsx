import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const Wrapper = styled.div`max-width: 900px;`;
const Title = styled.h1`font-size: 22px; font-weight: 700; margin-bottom: 16px; color: ${theme.colors.textPrimary};`;
const InfoBox = styled.div`
  background: #f8f9fa; border: 1px solid ${theme.colors.border}; border-radius: 10px;
  padding: 24px 28px; line-height: 1.7; font-size: 14px; color: ${theme.colors.textSecondary};
`;

export default function PaymentTermsPage() {
  return (
    <Wrapper>
      <Title>Payment Terms</Title>
      <InfoBox>
        <p>Define and manage payment terms for each franchise partner. Configure due dates, grace periods and payment conditions that drive the Account Statement calculations.</p>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>Payment term definitions (Net 30, Net 60, etc.)</li>
          <li>Country-specific payment conditions</li>
          <li>Grace period configuration</li>
          <li>Interest rate settings for overdue amounts</li>
        </ul>
      </InfoBox>
    </Wrapper>
  );
}
