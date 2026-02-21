import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: ${theme.colors.background};
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: ${theme.colors.secondary};
  color: ${theme.colors.white};
  padding: 0 32px;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const LogoImg = styled.img`
  height: 36px;
  border-radius: 6px;
`;

const HeaderRight = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const HeaderText = styled.span`
  font-size: 13px;
  color: ${theme.colors.primary};
  font-weight: 600;
`;

const FeedbackLink = styled(Link)`
  font-size: 12px;
  color: ${theme.colors.white};
  padding: 6px 12px;
  border-radius: ${theme.borderRadius};
  transition: all 0.15s;
  &:hover {
    color: ${theme.colors.primary};
    background: rgba(255, 95, 0, 0.08);
  }
`;

const Hero = styled.section`
  padding: 48px 32px 32px;
  text-align: center;
`;

const HeroTitle = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin-bottom: 6px;
`;

const HeroSub = styled.p`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
`;

const ProcessContainer = styled.div`
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 0 32px 64px;
  animation: ${fadeIn} 0.4s ease;
`;

const ProcessTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 12px;
  padding-left: 4px;
`;

const FlowRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0;
`;

const StepCard = styled.div<{ $active: boolean; $clickable: boolean; $idx: number }>`
  flex: 1;
  position: relative;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 28px 28px 28px ${p => p.$idx === 0 ? '28px' : '36px'};
  cursor: ${p => p.$clickable ? 'pointer' : 'default'};
  background: ${p => p.$active ? theme.colors.primary : theme.colors.surface};
  color: ${p => p.$active ? 'white' : theme.colors.textPrimary};
  clip-path: ${p => {
    if (p.$idx === 0) return 'polygon(0 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 0 100%)';
    return 'polygon(0 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 0 100%, 24px 50%)';
  }};
  transition: all 0.25s;
  box-shadow: ${p => p.$active ? 'none' : 'inset 0 0 0 1px #e0e0e0'};

  &:hover {
    ${p => p.$clickable ? `
      filter: brightness(1.05);
      transform: scale(1.02);
      z-index: 2;
    ` : ''}
  }
`;

const StepNumber = styled.div<{ $active: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 10px;
  background: ${p => p.$active ? 'rgba(255,255,255,0.2)' : '#f0f0f0'};
  color: ${p => p.$active ? 'white' : theme.colors.textSecondary};
`;

const StepTitle = styled.div<{ $active: boolean }>`
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 6px;
  color: ${p => p.$active ? 'white' : theme.colors.textPrimary};
`;

const StepDesc = styled.div<{ $active: boolean }>`
  font-size: 11px;
  line-height: 1.4;
  color: ${p => p.$active ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary};
`;

const StepBadge = styled.span<{ $color?: string }>`
  display: inline-block;
  margin-top: 8px;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${p => p.$color || theme.colors.success};
  color: white;
`;

interface Step {
  label: string;
  desc: string;
  path: string | null;
  badge: string;
  badgeColor: string;
  active: boolean;
}

interface ProcessRow {
  title: string;
  steps: Step[];
  progress: number;
}

const ProgressBarOuter = styled.div`
  width: 100%;
  height: 22px;
  background: #e8e8e8;
  border-radius: 11px;
  margin-top: 12px;
  overflow: hidden;
  position: relative;
`;

const ProgressBarInner = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${p => p.$pct}%;
  background: linear-gradient(90deg, ${theme.colors.primary}, #ff8c40);
  border-radius: 11px;
  transition: width 0.6s ease;
  min-width: ${p => p.$pct > 0 ? '28px' : '0'};
`;

const ProgressLabel = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  letter-spacing: 0.3px;
`;

const ProgressWrapper = styled.div`
  position: relative;
  margin-top: 24px;
`;

const TargetMarker = styled.div<{ $pct: number }>`
  position: absolute;
  left: ${p => p.$pct}%;
  top: -18px;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
  z-index: 2;
`;

const TargetLine = styled.div<{ $highlight?: boolean }>`
  width: 1px;
  flex: 1;
  border-left: 2px dashed ${p => p.$highlight ? theme.colors.primary : theme.colors.textSecondary};
  opacity: ${p => p.$highlight ? 0.8 : 0.4};
`;

const TargetLabel = styled.span<{ $highlight?: boolean }>`
  font-size: 9px;
  font-weight: 700;
  color: ${p => p.$highlight ? theme.colors.primary : theme.colors.textSecondary};
  white-space: nowrap;
  margin-bottom: 2px;
  letter-spacing: 0.3px;
`;

const quarterTargets = [
  { label: 'Q2 Target 2026', pct: 15, highlight: true },
  { label: 'Q3 Target 2026', pct: 35, highlight: false },
  { label: 'Q4 Target 2026', pct: 55, highlight: false },
  { label: '...', pct: 75, highlight: false },
  { label: '...', pct: 100, highlight: false },
];

const processes: ProcessRow[] = [
  {
    title: 'Franchise Controlling',
    progress: 1,
    steps: [
      {
        label: 'Partner Requests',
        desc: 'Person 1',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
      },
      {
        label: 'Parameter Maintenance',
        desc: 'Person 2',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
      },
      {
        label: 'FSM – Calculation',
        desc: 'Person 3',
        path: '/fsm',
        badge: 'Coming soon',
        badgeColor: '#999',
        active: false,
      },
      {
        label: 'Bookings & Invoicing',
        desc: 'Person 4',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
      },
      {
        label: 'Interfacing',
        desc: 'Person 5',
        path: '/interfacing',
        badge: 'Live',
        badgeColor: theme.colors.success,
        active: true,
      },
      {
        label: 'Controlling',
        desc: 'Person 6',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
      },
    ],
  },
  {
    title: 'B2P',
    progress: 0,
    steps: [
      {
        label: 'Partner Requests',
        desc: 'Person 1',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
      },
      {
        label: 'Dummy',
        desc: 'Person 2',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
      },
      {
        label: 'Dummy',
        desc: 'Person 3',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
      },
      {
        label: 'Dummy',
        desc: 'Person 4',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
      },
      {
        label: 'Dummy',
        desc: 'Person 5',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
      },
      {
        label: 'Dummy',
        desc: 'Person 6',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
      },
    ],
  },
];

export default function PortalHomePage() {
  const navigate = useNavigate();

  return (
    <Page>
      <Header>
        <LogoImg src="/sixt-logo.png" alt="SIXT" />
        <HeaderRight>
          <FeedbackLink to="/feedback">App Requests &amp; Bugs</FeedbackLink>
          <HeaderText>You rock today!</HeaderText>
        </HeaderRight>
      </Header>

      <ProcessContainer style={{ paddingTop: 40 }}>
        {processes.map((proc) => (
          <div key={proc.title} style={{ marginBottom: 36 }}>
            <ProcessTitle>{proc.title}</ProcessTitle>
            <FlowRow>
              {proc.steps.map((step, i) => (
                <StepCard
                  key={`${proc.title}-${i}`}
                  $active={step.active}
                  $clickable={!!step.path}
                  $idx={i}
                  onClick={() => step.path && navigate(step.path)}
                >
                  <StepNumber $active={step.active}>{i + 1}</StepNumber>
                  <StepTitle $active={step.active}>{step.label}</StepTitle>
                  <StepDesc $active={step.active}>{step.desc}</StepDesc>
                  <StepBadge $color={step.badgeColor}>{step.badge}</StepBadge>
                </StepCard>
              ))}
            </FlowRow>
            <ProgressWrapper>
              {quarterTargets.map((qt, qi) => (
                <TargetMarker key={`${qt.label}-${qi}`} $pct={qt.pct}>
                  <TargetLabel $highlight={qt.highlight}>{qt.label}</TargetLabel>
                  <TargetLine $highlight={qt.highlight} />
                </TargetMarker>
              ))}
              <ProgressBarOuter>
                <ProgressBarInner $pct={proc.progress} />
                <ProgressLabel>{proc.progress}% Automation Progress</ProgressLabel>
              </ProgressBarOuter>
            </ProgressWrapper>
          </div>
        ))}
      </ProcessContainer>
    </Page>
  );
}
