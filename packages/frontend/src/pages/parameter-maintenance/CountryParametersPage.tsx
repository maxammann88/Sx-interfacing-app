import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const Wrapper = styled.div`max-width: 900px;`;
const Title = styled.h1`font-size: 22px; font-weight: 700; margin-bottom: 16px; color: ${theme.colors.textPrimary};`;
const InfoBox = styled.div`
  background: #f8f9fa; border: 1px solid ${theme.colors.border}; border-radius: 10px;
  padding: 24px 28px; line-height: 1.7; font-size: 14px; color: ${theme.colors.textSecondary};
`;

export default function CountryParametersPage() {
  return (
    <Wrapper>
      <Title>Country Parameters</Title>
      <InfoBox>
        <p>Configure country-specific parameters used across the franchise system, including tax rates, currency settings, regional payment rules and franchise-specific overrides.</p>
        <ul style={{ marginTop: 12, paddingLeft: 20 }}>
          <li>Tax rate configuration per country</li>
          <li>Currency and exchange rate settings</li>
          <li>Regional compliance parameters</li>
          <li>Franchise fee structures</li>
        </ul>
      </InfoBox>
    </Wrapper>
  );
}
