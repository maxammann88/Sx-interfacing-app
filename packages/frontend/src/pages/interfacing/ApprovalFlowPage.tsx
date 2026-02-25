import React from 'react';
import styled from 'styled-components';
import { PageTitle, Card } from '../../components/ui';
import { theme } from '../../styles/theme';

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

export default function ApprovalFlowPage() {
  return (
    <div>
      <PageTitle>Approval Flow</PageTitle>
      <Card>
        <InfoBox>
          <InfoIcon>📋</InfoIcon>
          <InfoTitle>Highway Approval Integration</InfoTitle>
          <InfoText>
            This is where all documents that need to go through the Highway approval flow will be displayed.
            You can review them here and either send them automatically to Highway or download them manually.
          </InfoText>
          <FeatureList>
            <FeatureItem>
              <Dot $color={theme.colors.primary} />
              Review interfacing statements before approval
            </FeatureItem>
            <FeatureItem>
              <Dot $color={theme.colors.info} />
              Automated submission to Highway approval workflow
            </FeatureItem>
            <FeatureItem>
              <Dot $color={theme.colors.success} />
              Download documents for manual processing
            </FeatureItem>
            <FeatureItem>
              <Dot $color="#6f42c1" />
              Track approval status across all countries
            </FeatureItem>
          </FeatureList>
        </InfoBox>
      </Card>
    </div>
  );
}
