import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

const Page = styled.div`
  min-height: 100vh;
  background: ${theme.colors.background};
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

const BackLink = styled(Link)`
  color: ${theme.colors.white};
  font-size: 15px;
  padding: 6px 10px;
  border-radius: ${theme.borderRadius};
  &:hover { color: ${theme.colors.primary}; background: rgba(255,95,0,0.08); }
`;

const HeaderTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.colors.white};
`;

const Content = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 48px 32px 80px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 15px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 40px;
  line-height: 1.6;
`;

const Section = styled.section`
  margin-bottom: 36px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Card = styled.div`
  background: ${theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${theme.shadow};
  padding: 24px;
  margin-bottom: 16px;
`;

const RuleList = styled.ol`
  padding-left: 20px;
  margin: 0;
  li {
    font-size: 14px;
    line-height: 1.8;
    color: ${theme.colors.textPrimary};
    margin-bottom: 8px;
  }
`;

const Highlight = styled.span`
  font-weight: 700;
  color: ${theme.colors.primary};
`;

const FlowDiagram = styled.div`
  background: #1a1a2e;
  border-radius: 12px;
  padding: 28px 32px;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
  overflow-x: auto;
  white-space: pre;
  margin-bottom: 24px;
`;

const Badge = styled.span<{ $color: string }>`
  font-size: 10px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 10px;
  background: ${p => p.$color};
  color: white;
`;

export default function CollaborationModelPage() {
  return (
    <Page>
      <Header>
        <Link to="/"><LogoImg src="/sixt-logo.png" alt="SIXT" /></Link>
        <BackLink to="/">&larr;</BackLink>
        <HeaderTitle>Collaboration Model &amp; Guidance</HeaderTitle>
      </Header>

      <Content>
        <Title>Vibe-Coding Collaboration Model</Title>
        <Subtitle>
          This document describes how multiple Finance team members can simultaneously develop
          and extend the Sixt Franchise Portal using AI-assisted coding ("vibe-coding"). Each person
          owns a sub-app and works independently, while sharing the same codebase and infrastructure.
        </Subtitle>

        <Section>
          <SectionTitle>Architecture Overview</SectionTitle>
          <FlowDiagram>{`┌─────────────────────────────────────────────────────┐
│                   Portal Home Page                   │
│   ┌──────────┬──────────┬──────────┬──────────┐     │
│   │Interfacing│  FSM     │Parameter │Automation│     │
│   │  App     │  App     │Maint.App │Controlling│    │
│   │ Person A │ Person B │ Person C │ Person D │     │
│   └────┬─────┴────┬─────┴────┬─────┴────┬─────┘    │
│        │          │          │          │            │
│   ┌────▼──────────▼──────────▼──────────▼─────┐     │
│   │         Shared Backend (Express)           │     │
│   │         Shared Database (PostgreSQL)       │     │
│   │         Shared Components (UI Kit)         │     │
│   └───────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘`}</FlowDiagram>
        </Section>

        <Section>
          <SectionTitle>Core Principles</SectionTitle>
          <Card>
            <RuleList>
              <li><Highlight>One person per sub-app.</Highlight> Each sub-app (Interfacing, FSM, Parameter Maintenance, etc.) has a single owner who is responsible for its features and quality.</li>
              <li><Highlight>Describe before you build.</Highlight> If you can clearly explain a feature in plain language, the AI can implement it. Spend time on the "what" and "why", not the "how".</li>
              <li><Highlight>Focus on impact.</Highlight> Prioritize features that save the most time or reduce the most errors. Use the Automation Controlling page to track FTE savings.</li>
              <li><Highlight>Iterate in small steps.</Highlight> Make one change at a time, verify it works, then move to the next. Avoid requesting large, multi-feature changes in a single prompt.</li>
              <li><Highlight>Commit frequently.</Highlight> After each meaningful change, ask the AI to push to Git. This creates a safety net and keeps the team in sync.</li>
              <li><Highlight>Use the ticket system.</Highlight> Log all feature requests and bugs through "App Requests & Bugs" on the portal. This creates visibility and helps prioritize.</li>
            </RuleList>
          </Card>
        </Section>

        <Section>
          <SectionTitle>Workflow per Person</SectionTitle>
          <Card>
            <RuleList>
              <li><strong>Step 1:</strong> Open Cursor IDE with the shared project <Badge $color={theme.colors.info}>interfacing-app</Badge></li>
              <li><strong>Step 2:</strong> Navigate to your sub-app folder (e.g. <code>pages/fsm/</code>)</li>
              <li><strong>Step 3:</strong> Describe your desired feature or fix in plain German or English</li>
              <li><strong>Step 4:</strong> Review the AI's implementation in the browser (<code>localhost:3000</code>)</li>
              <li><strong>Step 5:</strong> Request adjustments if needed (iterate)</li>
              <li><strong>Step 6:</strong> Ask to push to Git when satisfied</li>
              <li><strong>Step 7:</strong> Update ticket status in the ticket system</li>
            </RuleList>
          </Card>
        </Section>

        <Section>
          <SectionTitle>Conflict Avoidance</SectionTitle>
          <Card>
            <RuleList>
              <li><Highlight>Isolated pages:</Highlight> Each sub-app has its own directory (<code>pages/fsm/</code>, <code>pages/parameter-maintenance/</code>, etc.). Changes within your directory won't affect others.</li>
              <li><Highlight>Shared files:</Highlight> Files like <code>App.tsx</code>, <code>PortalHomePage.tsx</code>, and <code>schema.prisma</code> are shared. Coordinate with the team before making changes here.</li>
              <li><Highlight>Sequential Git pushes:</Highlight> Only one person should push at a time. Pull before you push to avoid merge conflicts.</li>
              <li><Highlight>Backend routes:</Highlight> If you need a new API endpoint, prefix it with your app name (e.g. <code>/api/fsm/...</code>, <code>/api/b2p/...</code>).</li>
            </RuleList>
          </Card>
        </Section>

        <Section>
          <SectionTitle>Quality Checklist</SectionTitle>
          <Card>
            <RuleList>
              <li>Does the feature work correctly in the browser?</li>
              <li>Are there any console errors in the browser dev tools?</li>
              <li>Does the backend still start without errors?</li>
              <li>Has the change been pushed to Git?</li>
              <li>Is the corresponding ticket updated?</li>
              <li>Are FTE savings estimated and recorded on the ticket?</li>
            </RuleList>
          </Card>
        </Section>
      </Content>
    </Page>
  );
}
