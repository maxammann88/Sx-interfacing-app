import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { PageTitle } from '../components/ui';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 8px;
`;

const CardLink = styled(Link)`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius};
  box-shadow: ${theme.shadow};
  padding: 28px 24px;
  transition: all 0.2s;
  border-left: 4px solid ${theme.colors.primary};

  &:hover {
    box-shadow: ${theme.shadowHover};
    transform: translateY(-2px);
  }

  h3 {
    font-size: 16px;
    font-weight: 700;
    color: ${theme.colors.textPrimary};
    margin-bottom: 8px;
  }

  p {
    font-size: 13px;
    color: ${theme.colors.textSecondary};
    line-height: 1.5;
  }
`;

const pages = [
  {
    path: '/fsm/feature-requests',
    title: 'Feature Request List',
    desc: 'Track and manage feature requests for FSM.',
  },
  {
    path: '/fsm/budget',
    title: 'Budget Management',
    desc: 'Manage budgets and cost allocations.',
  },
  {
    path: '/fsm/parameters',
    title: 'Calc. Parameter',
    desc: 'Configure calculation parameters for FSM.',
  },
  {
    path: '/fsm/calculation',
    title: 'Calculation',
    desc: 'Run and review FSM calculations.',
  },
  {
    path: '/fsm/bookings',
    title: 'Bookings',
    desc: 'View and manage franchise bookings.',
  },
  {
    path: '/fsm/reporting',
    title: 'Reporting',
    desc: 'FSM reports and analytics.',
  },
];

export default function FsmHomePage() {
  return (
    <div>
      <PageTitle>FSM – Calculation</PageTitle>
      <Grid>
        {pages.map((page) => (
          <CardLink key={page.path} to={page.path}>
            <h3>{page.title}</h3>
            <p>{page.desc}</p>
          </CardLink>
        ))}
      </Grid>
    </div>
  );
}
