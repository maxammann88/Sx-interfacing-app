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
    path: '/import',
    title: 'Monatlicher Datenimport',
    desc: 'SAP CSV-Dateien hochladen und in die Datenbank importieren.',
  },
  {
    path: '/stammdaten/upload',
    title: 'Stammdaten Upload',
    desc: 'Länderliste und Stammdaten-CSV hochladen.',
  },
  {
    path: '/stammdaten/view',
    title: 'Stammdaten Übersicht',
    desc: 'Alle Länder mit Stammdaten anzeigen, filtern und durchsuchen.',
  },
  {
    path: '/statement',
    title: 'Interfacing Statement',
    desc: 'Monthly Interfacing Statement pro Land generieren und anzeigen.',
  },
  {
    path: '/uploads',
    title: 'Upload History',
    desc: 'Alle bisherigen Uploads einsehen und verwalten.',
  },
  {
    path: '/export',
    title: 'PDF Export',
    desc: 'Interfacing Statements als PDF im DIN-A4-Format exportieren.',
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
