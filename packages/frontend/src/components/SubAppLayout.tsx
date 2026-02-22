import React from 'react';
import { Link, useLocation, Outlet, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../styles/theme';

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: ${theme.colors.secondary};
  color: ${theme.colors.white};
  padding: 0 24px;
  display: flex;
  align-items: center;
  height: 60px;
  gap: 32px;
`;

const HeaderRight = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: ${theme.colors.primary};
  font-weight: 600;
  gap: 16px;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  img {
    height: 36px;
    border-radius: 6px;
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: 4px;
  margin-left: 16px;
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  color: ${(p) => (p.$active ? theme.colors.primary : theme.colors.white)};
  padding: 8px 14px;
  border-radius: ${theme.borderRadius};
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
  background: ${(p) => (p.$active ? 'rgba(255,95,0,0.1)' : 'transparent')};
  &:hover {
    color: ${theme.colors.primary};
    background: rgba(255, 95, 0, 0.08);
  }
`;

const AppTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.colors.white};
  margin-left: 8px;
`;

const Main = styled.main`
  flex: 1;
  padding: 24px;
  max-width: 1800px;
  width: 100%;
  margin: 0 auto;
`;

interface SubAppLayoutProps {
  appName: string;
  basePath: string;
}

export default function SubAppLayout({ appName, basePath }: SubAppLayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: `${basePath}/feature-requests`, label: 'Feature Requests' },
  ];

  return (
    <Wrapper>
      <Header>
        <Logo to={basePath}><img src="/sixt-logo.png" alt="SIXT" /></Logo>
        <NavLink to="/" $active={false} style={{ fontSize: 15 }} title="Back to Portal">&larr;</NavLink>
        <AppTitle>{appName}</AppTitle>
        <Nav>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              $active={location.pathname.startsWith(item.path)}
            >
              {item.label}
            </NavLink>
          ))}
        </Nav>
        <HeaderRight>
          <NavLink to="/feedback" $active={false} style={{ fontSize: 12 }}>
            Features &amp; Bugs
          </NavLink>
          <span>You rock today!</span>
        </HeaderRight>
      </Header>
      <Main>
        <Outlet />
      </Main>
    </Wrapper>
  );
}
