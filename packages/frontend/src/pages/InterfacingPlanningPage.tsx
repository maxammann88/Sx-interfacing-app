import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import api from '../utils/api';
import { formatPeriodLabel } from '../utils/format';
import type { InterfacingPlan, Country } from '@sixt/shared';
import {
  PageTitle, Card, Select, Label, Alert, Spinner, SectionTitle, Table, FormGroup, FormRow,
} from '../components/ui';
import { theme } from '../styles/theme';

const TEAM = ['1 – Henning Seidel', '2 – Inês Boavida Couto', '3 – Herbert Krenn'];

function getDefaultYear(): string {
  return String(new Date().getFullYear());
}

function generateYearOptions(): string[] {
  const now = new Date();
  const years: string[] = [];
  for (let y = 2026; y <= now.getFullYear() + 1; y++) {
    years.push(String(y));
  }
  return years;
}

function getPeriodsForYear(year: string): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}${String(i + 1).padStart(2, '0')}`);
}

function shortMonth(period: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = parseInt(period.substring(4, 6), 10);
  return months[m - 1];
}

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getPortugalHolidays(year: number): Set<string> {
  const easter = easterSunday(year);
  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const holidays = [
    new Date(year, 0, 1),   // Ano Novo
    addDays(easter, -47),   // Carnaval (Shrove Tuesday)
    addDays(easter, -2),    // Sexta-feira Santa (Good Friday)
    easter,                 // Domingo de Páscoa
    new Date(year, 3, 25),  // Dia da Liberdade
    new Date(year, 4, 1),   // Dia do Trabalhador
    addDays(easter, 60),    // Corpo de Deus (Corpus Christi)
    new Date(year, 5, 10),  // Dia de Portugal
    new Date(year, 5, 13),  // Santo António (Lisbon only)
    new Date(year, 7, 15),  // Assunção de Nossa Senhora
    new Date(year, 9, 5),   // Implantação da República
    new Date(year, 10, 1),  // Dia de Todos os Santos
    new Date(year, 11, 1),  // Restauração da Independência
    new Date(year, 11, 8),  // Imaculada Conceição
    new Date(year, 11, 25), // Natal
  ];

  return new Set(holidays.map(fmt));
}

function getWorkingDays(period: string): number {
  const year = parseInt(period.substring(0, 4), 10);
  const month = parseInt(period.substring(4, 6), 10);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const holidays = getPortugalHolidays(nextYear);

  let count = 0;
  for (let day = 5; day <= 15; day++) {
    const d = new Date(nextYear, nextMonth - 1, day);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const key = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (holidays.has(key)) continue;
    count++;
  }
  return count;
}

function getDefaultQuarter(year: string): string {
  const now = new Date();
  if (String(now.getFullYear()) === year) {
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `${year}-Q${q}`;
  }
  return `${year}-Q1`;
}

function generateQuarterOptions(year: string): { value: string; label: string; periods: string[] }[] {
  const options: { value: string; label: string; periods: string[] }[] = [];
  for (let q = 1; q <= 4; q++) {
    const m1 = (q - 1) * 3 + 1;
    const periods = [0, 1, 2].map(offset => `${year}${String(m1 + offset).padStart(2, '0')}`);
    options.push({ value: `${year}-Q${q}`, label: `Q${q} ${year}`, periods });
  }
  return options;
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
`;

const PlanCard = styled(Card)<{ $hasDate?: boolean }>`
  padding: 12px 14px;
  border-left: 4px solid ${p => p.$hasDate ? theme.colors.success : theme.colors.border};
  margin-bottom: 0;
`;

const PeriodLabel = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const WorkingDaysBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  background: ${theme.colors.secondary};
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
`;

const DateInput = styled.input<{ $status: 'green' | 'red' | 'neutral' }>`
  padding: 5px 8px;
  border: 2px solid ${p =>
    p.$status === 'green' ? theme.colors.success :
    p.$status === 'red' ? theme.colors.danger :
    theme.colors.border};
  border-radius: ${theme.borderRadius};
  font-size: 12px;
  width: 100%;
  background: ${p =>
    p.$status === 'green' ? '#d4edda' :
    p.$status === 'red' ? '#fce4e4' :
    'white'};
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${p =>
      p.$status === 'green' ? 'rgba(40,167,69,0.25)' :
      p.$status === 'red' ? 'rgba(220,53,69,0.25)' :
      'rgba(255,95,0,0.15)'};
  }
`;

const StatusDot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${p => p.$color};
  margin-left: 6px;
`;

const TinySelect = styled.select`
  padding: 3px 4px;
  font-size: 11px;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  width: 100%;
  background: white;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const ScrollWrapper = styled.div`
  overflow-x: auto;
  max-width: 100%;
`;

const CompactTable = styled(Table)`
  font-size: 11px;
  white-space: nowrap;
  th { padding: 6px 8px; font-size: 11px; }
  td { padding: 4px 6px; }
`;

const MonthHeader = styled.th`
  background: ${theme.colors.primary} !important;
  color: white !important;
  text-align: center !important;
  font-size: 11px !important;
  letter-spacing: 0.5px;
`;

const SubHeader = styled.th`
  background: #444 !important;
  color: white !important;
  text-align: center !important;
  font-size: 10px !important;
  font-weight: 500 !important;
`;

interface Assignment {
  period: string;
  countryId: number;
  creator: string | null;
  reviewer: string | null;
}

function getDateStatus(releaseDate: string | null, period: string): 'green' | 'red' | 'neutral' {
  if (!releaseDate) return 'neutral';
  const year = parseInt(period.substring(0, 4), 10);
  const month = parseInt(period.substring(4, 6), 10);
  const [cy, cm, cd] = releaseDate.split('-').map(Number);
  const deadlineVal = new Date(year, month, 15).getTime();
  const chosenVal = new Date(cy, cm - 1, cd).getTime();
  return chosenVal <= deadlineVal ? 'green' : 'red';
}

function assignmentKey(period: string, countryId: number): string {
  return `${period}_${countryId}`;
}

export default function InterfacingPlanningPage() {
  const [plans, setPlans] = useState<Record<string, InterfacingPlan>>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(getDefaultYear());
  const [selectedQuarter, setSelectedQuarter] = useState(getDefaultQuarter(getDefaultYear()));

  const yearOptions = useMemo(() => generateYearOptions(), []);
  const yearPeriods = useMemo(() => getPeriodsForYear(selectedYear), [selectedYear]);
  const quarterOptions = useMemo(() => generateQuarterOptions(selectedYear), [selectedYear]);
  const quarterPeriods = useMemo(() => {
    const q = quarterOptions.find(o => o.value === selectedQuarter);
    return q ? q.periods : [];
  }, [selectedQuarter, quarterOptions]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, countriesRes, assignRes] = await Promise.all([
        api.get('/planning'),
        api.get('/countries', { params: { status: 'aktiv' } }),
        api.get('/planning/assignments'),
      ]);

      const map: Record<string, InterfacingPlan> = {};
      (plansRes.data.data as InterfacingPlan[]).forEach(p => { map[p.period] = p; });
      setPlans(map);

      setCountries(countriesRes.data.data);

      const aMap: Record<string, Assignment> = {};
      (assignRes.data.data as Assignment[]).forEach(a => {
        aMap[assignmentKey(a.period, a.countryId)] = a;
      });
      setAssignments(aMap);
    } catch {
      setError('Error loading planning data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const savePlan = async (period: string, field: string, value: string) => {
    setSaving(period);
    const current = plans[period] || { releaseDate: null, creator: null, reviewer: null };
    const body = {
      releaseDate: current.releaseDate,
      creator: current.creator,
      reviewer: current.reviewer,
      [field]: value || null,
    };
    try {
      const res = await api.put(`/planning/${period}`, body);
      setPlans(prev => ({ ...prev, [period]: res.data.data }));
    } catch {
      setError(`Error saving data for ${formatPeriodLabel(period)}.`);
    } finally {
      setSaving(null);
    }
  };

  const saveAssignment = async (period: string, countryId: number, field: 'creator' | 'reviewer', value: string) => {
    const key = assignmentKey(period, countryId);
    const current = assignments[key] || { period, countryId, creator: null, reviewer: null };
    const body = {
      creator: current.creator,
      reviewer: current.reviewer,
      [field]: value || null,
    };

    setAssignments(prev => ({
      ...prev,
      [key]: { ...current, [field]: value || null },
    }));

    try {
      await api.put(`/planning/assignments/${period}/${countryId}`, body);
    } catch {
      setError(`Error saving assignment.`);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageTitle>Interfacing Planning</PageTitle>

      {error && <Alert $type="error">{error}</Alert>}

      <Card style={{ marginBottom: 20, padding: '12px 20px' }}>
        <FormRow style={{ alignItems: 'center' }}>
          <FormGroup>
            <Label>Year</Label>
            <Select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setSelectedQuarter(getDefaultQuarter(e.target.value)); }}>
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </FormGroup>
          <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
            Target: Release date by the <strong>15th of the following month</strong>.
            <StatusDot $color={theme.colors.success} /> = on/before the 15th
            <StatusDot $color={theme.colors.danger} style={{ marginLeft: 16 }} /> = after the 15th
          </div>
        </FormRow>
      </Card>

      <Grid>
        {yearPeriods.map(period => {
          const plan = plans[period];
          const releaseDate = plan?.releaseDate || '';
          const status = getDateStatus(releaseDate || null, period);

          return (
            <PlanCard key={period} $hasDate={!!releaseDate}>
              <PeriodLabel>
                <span>
                  {formatPeriodLabel(period)}
                  {releaseDate && <StatusDot $color={status === 'green' ? theme.colors.success : theme.colors.danger} />}
                </span>
                <WorkingDaysBadge>{getWorkingDays(period)} WD</WorkingDaysBadge>
              </PeriodLabel>
              <DateInput
                type="date"
                $status={status}
                value={releaseDate}
                onChange={e => savePlan(period, 'releaseDate', e.target.value)}
                disabled={saving === period}
              />
            </PlanCard>
          );
        })}
      </Grid>

      <SectionTitle style={{ marginTop: 32 }}>Creator &amp; Reviewer per Country</SectionTitle>
      <Card>
        <FormRow>
          <FormGroup>
            <Label>Quarter</Label>
            <Select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}>
              {quarterOptions.map(q => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </Select>
          </FormGroup>
        </FormRow>
      </Card>

      {quarterPeriods.length > 0 && (
        <Card style={{ padding: 12 }}>
          <ScrollWrapper>
            <CompactTable>
              <thead>
                <tr>
                  <th rowSpan={2}>FIR</th>
                  <th rowSpan={2}>Country</th>
                  <th rowSpan={2}>ISO</th>
                  {quarterPeriods.map(p => (
                    <MonthHeader key={p} colSpan={2}>{shortMonth(p)} {p.substring(0, 4)}</MonthHeader>
                  ))}
                </tr>
                <tr>
                  {quarterPeriods.map(p => (
                    <React.Fragment key={p}>
                      <SubHeader>Creator</SubHeader>
                      <SubHeader>Reviewer</SubHeader>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {countries.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.fir}</strong></td>
                    <td>{c.name}</td>
                    <td>{c.iso}</td>
                    {quarterPeriods.map(p => {
                      const key = assignmentKey(p, c.id);
                      const a = assignments[key];
                      return (
                        <React.Fragment key={p}>
                          <td>
                            <TinySelect
                              value={a?.creator || ''}
                              onChange={e => saveAssignment(p, c.id, 'creator', e.target.value)}
                            >
                              <option value="">–</option>
                              {TEAM.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </TinySelect>
                          </td>
                          <td>
                            <TinySelect
                              value={a?.reviewer || ''}
                              onChange={e => saveAssignment(p, c.id, 'reviewer', e.target.value)}
                            >
                              <option value="">–</option>
                              {TEAM.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </TinySelect>
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </CompactTable>
          </ScrollWrapper>
        </Card>
      )}
    </div>
  );
}
