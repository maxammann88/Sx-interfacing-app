import React from 'react';
import styled from 'styled-components';
import { PageTitle, Card } from '../components/ui';
import { theme } from '../styles/theme';

const InfoBox = styled.div`
  background: #f0f7ff;
  border: 1px solid #bee5eb;
  border-radius: 8px;
  padding: 28px 32px;
  text-align: center;
  max-width: 700px;
  margin: 40px auto;
`;

const InfoIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const InfoTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 12px;
`;

const InfoText = styled.p`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  line-height: 1.7;
`;

const FeatureList = styled.ul`
  text-align: left;
  margin: 20px auto 0;
  max-width: 500px;
  list-style: none;
  padding: 0;
`;

const FeatureItem = styled.li`
  font-size: 13px;
  color: ${theme.colors.textPrimary};
  padding: 8px 0;
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  gap: 10px;

  &:last-child { border-bottom: none; }
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${p => p.$color};
  flex-shrink: 0;
`;

export default function DataQualityCheckPage() {
  return (
    <div>
      <PageTitle>Data Quality Check</PageTitle>
      <Card>
        <InfoBox>
          <InfoIcon>🔍</InfoIcon>
          <InfoTitle>Automated Data Validation</InfoTitle>
          <InfoText>
            This module will automatically validate all imported SAP data and interfacing statements
            against predefined quality rules. Anomalies, missing entries and inconsistencies are
            flagged before statements are finalized, reducing manual review effort and preventing errors.
          </InfoText>
          <FeatureList>
            <FeatureItem>
              <Dot $color={theme.colors.danger} />
              Detect missing or duplicate invoices across periods
            </FeatureItem>
            <FeatureItem>
              <Dot $color={theme.colors.warning} />
              Flag unusual amount deviations vs. prior periods
            </FeatureItem>
            <FeatureItem>
              <Dot $color={theme.colors.info} />
              Cross-check SAP balances against statement totals
            </FeatureItem>
            <FeatureItem>
              <Dot $color={theme.colors.success} />
              Validate master data completeness per country
            </FeatureItem>
            <FeatureItem>
              <Dot $color="#6f42c1" />
              Generate quality score and audit trail per period
            </FeatureItem>
          </FeatureList>
        </InfoBox>
      </Card>
    </div>
  );
}
