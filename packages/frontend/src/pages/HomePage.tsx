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
    path: '/interfacing/import',
    title: 'Monthly Data Import',
    desc: 'Upload SAP CSV files and import them into the database.',
  },
  {
    path: '/interfacing/statement',
    title: 'Interfacing Statement',
    desc: 'Generate and view monthly interfacing statements per country.',
  },
  {
    path: '/interfacing/overview',
    title: 'Statement Overview',
    desc: 'Overview of all country statements with deviation analysis.',
  },
  {
    path: '/interfacing/planning',
    title: 'Interfacing Planning',
    desc: 'Calendar, creator and reviewer assignments per country.',
  },
  {
    path: '/interfacing/export',
    title: 'PDF Export',
    desc: 'Export interfacing statements as A4 PDF documents.',
  },
];

export default function HomePage() {
  return (
    <div>
      <PageTitle>Sixt Franchise Interfacing</PageTitle>
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
