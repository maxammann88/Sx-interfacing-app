import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PageTitle, Card, Select, Button } from '../../components/ui';

const FilterBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const ReportsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }
  
  th {
    background: #f5f5f5;
    font-weight: 600;
    color: #555;
    font-size: 14px;
  }
  
  td {
    font-size: 14px;
  }
  
  tbody tr:hover {
    background: #fafafa;
  }
`;

const DownloadButton = styled(Button)`
  padding: 8px 16px;
  font-size: 14px;
  background: linear-gradient(135deg, #ff5f00 0%, #ff8533 100%);
  
  &:hover {
    background: linear-gradient(135deg, #e05500 0%, #e07020 100%);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
`;

interface Report {
  feeType: string;
  country: string;
  countryName: string;
  fir: string;
  invoicingPeriod: string;
  totalFees: number;
  count: number;
}

export default function FsmReportingPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterFeeType, setFilterFeeType] = useState('all');
  
  const [countries, setCountries] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filterPeriod, filterCountry, filterFeeType]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load reports
      const reportsResponse = await fetch('/api/gds-dcf/reports');
      const reportsResult = await reportsResponse.json();
      
      // Load countries
      const countriesResponse = await fetch('/api/gds-dcf/mandants');
      const countriesResult = await countriesResponse.json();
      
      if (reportsResult.success) {
        setReports(reportsResult.data);
      }
      
      if (countriesResult.success) {
        setCountries(countriesResult.data);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (filterPeriod !== 'all') {
      filtered = filtered.filter(r => r.invoicingPeriod === filterPeriod);
    }

    if (filterCountry !== 'all') {
      filtered = filtered.filter(r => r.country === filterCountry);
    }

    if (filterFeeType !== 'all') {
      filtered = filtered.filter(r => r.feeType === filterFeeType);
    }

    setFilteredReports(filtered);
  };

  const handleDownload = (report: Report) => {
    const url = `/api/gds-dcf/export/excel-filtered/${report.country}/${report.invoicingPeriod}/${encodeURIComponent(report.feeType)}`;
    window.location.href = url;
  };

  // Generate period options (Jan 2025 - Dec 2026)
  const generatePeriods = () => {
    const periods = [];
    for (let year = 2025; year <= 2026; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        periods.push(`${year}-${monthStr}`);
      }
    }
    return periods;
  };

  const periods = generatePeriods();

  // Get unique fee types from reports
  const feeTypes = Array.from(new Set(reports.map(r => r.feeType)));

  // Format period for display
  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div>
      <PageTitle>Download</PageTitle>
      
      <Card>
        <FilterBar>
          <FilterGroup>
            <FilterLabel>Invoicing Period</FilterLabel>
            <Select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
              <option value="all">All Periods</option>
              {periods.map(period => (
                <option key={period} value={period}>{formatPeriod(period)}</option>
              ))}
            </Select>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Country</FilterLabel>
            <Select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country.iso} value={country.iso}>
                  {country.iso} - {country.fir} {country.countryName ? `(${country.countryName})` : ''}
                </option>
              ))}
            </Select>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Fee Type</FilterLabel>
            <Select value={filterFeeType} onChange={(e) => setFilterFeeType(e.target.value)}>
              <option value="all">All Fee Types</option>
              {feeTypes.map(feeType => (
                <option key={feeType} value={feeType}>{feeType}</option>
              ))}
            </Select>
          </FilterGroup>
        </FilterBar>

        {loading ? (
          <LoadingState>Loading reports...</LoadingState>
        ) : filteredReports.length === 0 ? (
          <EmptyState>
            No reports available for the selected filters.
            <br />
            Please upload GDS/DCF data first.
          </EmptyState>
        ) : (
          <ReportsTable>
            <thead>
              <tr>
                <th>Fee Type</th>
                <th>Country</th>
                <th>Invoicing Period</th>
                <th>Total Fees (EUR)</th>
                <th>Reservations</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report, index) => (
                <tr key={index}>
                  <td>{report.feeType}</td>
                  <td>{report.country} - {report.fir}</td>
                  <td>{formatPeriod(report.invoicingPeriod)}</td>
                  <td>€{report.totalFees.toFixed(2)}</td>
                  <td>{report.count}</td>
                  <td>
                    <DownloadButton onClick={() => handleDownload(report)}>
                      📥 Download Excel
                    </DownloadButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </ReportsTable>
        )}
      </Card>
    </div>
  );
}
