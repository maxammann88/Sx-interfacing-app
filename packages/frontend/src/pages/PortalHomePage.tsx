import React from 'react';
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

const HeaderText = styled.span`
  margin-left: auto;
  font-size: 13px;
  color: ${theme.colors.primary};
  font-weight: 600;
`;

const Hero = styled.section`
  padding: 48px 32px 24px;
  text-align: center;
`;

const HeroTitle = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin-bottom: 8px;
`;

const HeroSub = styled.p`
  font-size: 15px;
  color: ${theme.colors.textSecondary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 32px 48px;
  animation: ${fadeIn} 0.4s ease;
`;

const AppCard = styled(Link)`
  background: ${theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${theme.shadow};
  padding: 32px 28px;
  transition: all 0.25s;
  border-top: 5px solid ${theme.colors.primary};
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    box-shadow: ${theme.shadowHover};
    transform: translateY(-4px);
  }
`;

const FeedbackCard = styled(Link)`
  background: ${theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${theme.shadow};
  padding: 32px 28px;
  transition: all 0.25s;
  border-top: 5px solid ${theme.colors.info};
  border-style: dashed;
  border-width: 2px;
  border-color: ${theme.colors.info};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;

  &:hover {
    box-shadow: ${theme.shadowHover};
    transform: translateY(-4px);
    border-color: ${theme.colors.primary};
  }
`;

const AppIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${theme.colors.primary}, #ff8c40);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: white;
`;

const FeedbackIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${theme.colors.info};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  font-weight: 700;
`;

const AppTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const AppDesc = styled.p`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  line-height: 1.6;
`;

const FeedbackTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.info};
  text-align: center;
`;

const Badge = styled.span`
  display: inline-block;
  background: ${theme.colors.success};
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const apps = [
  {
    path: '/interfacing',
    icon: '\u{1F4CA}',
    title: 'Franchise Interfacing',
    desc: 'Monthly data import, statement generation, overview, planning, and PDF/XLSX export for all franchise countries.',
    badge: 'Live',
  },
];

export default function PortalHomePage() {
  return (
    <Page>
      <Header>
        <LogoImg src="/sixt-logo.png" alt="SIXT" />
        <HeaderText>You rock today!</HeaderText>
      </Header>

      <Hero>
        <HeroTitle>Int. Franchise Controlling</HeroTitle>
        <HeroSub>Choose an application to get started</HeroSub>
      </Hero>

      <Grid>
        {apps.map((a) => (
          <AppCard key={a.path} to={a.path}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AppIcon>{a.icon}</AppIcon>
              <div>
                <AppTitle>{a.title}</AppTitle>
                {a.badge && <Badge>{a.badge}</Badge>}
              </div>
            </div>
            <AppDesc>{a.desc}</AppDesc>
          </AppCard>
        ))}

        <FeedbackCard to="/feedback">
          <FeedbackIcon>+</FeedbackIcon>
          <FeedbackTitle>App Requests &amp; Bugs</FeedbackTitle>
          <AppDesc style={{ textAlign: 'center' }}>
            Submit new feature ideas, report bugs, and track progress.
          </AppDesc>
        </FeedbackCard>
      </Grid>
    </Page>
  );
}
