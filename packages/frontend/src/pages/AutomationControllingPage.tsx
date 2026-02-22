import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { getSubAppRegistry } from './ApiManagementPage';

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
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin-bottom: 24px;
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
`;

const Card = styled.div`
  background: ${theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${theme.shadow};
  padding: 24px;
`;

const CardTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;

  th, td {
    padding: 10px 12px;
    border-bottom: 1px solid ${theme.colors.border};
    text-align: left;
  }

  th {
    font-weight: 600;
    color: ${theme.colors.textSecondary};
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #fafafa;
    position: sticky;
    top: 0;
  }

  tbody tr:hover {
    background: #f8f9fa;
  }
`;

const NumberInput = styled.input`
  width: 70px;
  padding: 4px 8px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  text-align: right;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const SliderCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Slider = styled.input`
  width: 100px;
  accent-color: ${theme.colors.primary};
`;

const ScoreBar = styled.div`
  width: 100%;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
`;

const ScoreFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%;
  width: ${p => p.$pct}%;
  background: ${p => p.$color};
  border-radius: 4px;
  transition: width 0.3s;
`;

const Badge = styled.span<{ $color: string }>`
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 10px;
  background: ${p => p.$color};
  color: white;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 28px;
`;

const SummaryCard = styled.div<{ $color: string }>`
  flex: 1;
  background: ${theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${theme.shadow};
  padding: 20px 24px;
  border-top: 4px solid ${p => p.$color};
  text-align: center;
`;

const SummaryValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
`;

const SummaryLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  margin-top: 4px;
`;

const FullWidthCard = styled(Card)`
  grid-column: 1 / -1;
`;

interface KPIWeight {
  id: string;
  name: string;
  description: string;
  weight: number;
  unit: string;
}

interface TicketFTE {
  id: number;
  app: string;
  title: string;
  automationFTE: number;
  status: string;
  type: string;
  deadlineDate: string | null;
}

const BUDGET_STORAGE_KEY = 'automationBudgetHours_v1';

function loadBudgetHours(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveBudgetHours(data: Record<string, number>) {
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(data));
}

const initialKPIs: KPIWeight[] = [
  { id: 'time-saved', name: 'Time Saved', description: 'Hours saved per month through automation', weight: 30, unit: 'hrs/month' },
  { id: 'error-reduction', name: 'Error Reduction', description: 'Reduction in manual errors', weight: 25, unit: '%' },
  { id: 'process-coverage', name: 'Process Coverage', description: 'Percentage of process steps automated', weight: 20, unit: '%' },
  { id: 'data-quality', name: 'Data Quality', description: 'Automated data validation score', weight: 15, unit: 'score' },
  { id: 'user-adoption', name: 'User Adoption', description: 'Active usage rate of automated tools', weight: 10, unit: '%' },
];

const scoreRules = [
  { range: '0 – 20%', label: 'Not Started', color: '#ccc', description: 'No significant automation implemented' },
  { range: '21 – 40%', label: 'Initial', color: theme.colors.danger, description: 'Basic automation, mostly manual processes' },
  { range: '41 – 60%', label: 'Developing', color: '#e05c00', description: 'Key processes partially automated' },
  { range: '61 – 80%', label: 'Advanced', color: theme.colors.warning, description: 'Most processes automated, manual oversight' },
  { range: '81 – 100%', label: 'Fully Automated', color: theme.colors.success, description: 'End-to-end automation achieved' },
];

const CalendarWrapper = styled.div`
  margin-top: 8px;
`;

const CalendarNav = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const CalendarNavBtn = styled.button`
  background: none;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 14px;
  cursor: pointer;
  color: ${theme.colors.textPrimary};
  &:hover { background: #f0f0f0; }
`;

const MonthLabel = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  min-width: 160px;
  text-align: center;
`;

const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const DayHeader = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: ${theme.colors.textLight};
  text-transform: uppercase;
  text-align: center;
  padding: 6px 0;
`;

const DayCell = styled.div<{ $isToday: boolean; $isCurrentMonth: boolean }>`
  min-height: 80px;
  background: ${p => p.$isToday ? 'rgba(255,95,0,0.06)' : p.$isCurrentMonth ? theme.colors.surface : '#fafafa'};
  border: 1px solid ${p => p.$isToday ? theme.colors.primary : theme.colors.border};
  border-radius: 4px;
  padding: 4px;
  opacity: ${p => p.$isCurrentMonth ? 1 : 0.4};
`;

const DayNum = styled.div<{ $isToday: boolean }>`
  font-size: 11px;
  font-weight: ${p => p.$isToday ? 800 : 600};
  color: ${p => p.$isToday ? theme.colors.primary : theme.colors.textSecondary};
  margin-bottom: 2px;
`;

const CalTicket = styled.div<{ $color: string }>`
  font-size: 9px;
  font-weight: 600;
  padding: 2px 4px;
  margin-bottom: 1px;
  border-radius: 3px;
  background: ${p => p.$color};
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getStatusColor(status: string): string {
  if (status === 'done') return theme.colors.success;
  if (status === 'in_progress') return theme.colors.info;
  if (status === 'review') return '#6f42c1';
  if (status === 'testing') return theme.colors.warning;
  return '#bbb';
}

function getScoreColor(pct: number): string {
  if (pct <= 20) return '#ccc';
  if (pct <= 40) return theme.colors.danger;
  if (pct <= 60) return '#e05c00';
  if (pct <= 80) return theme.colors.warning;
  return theme.colors.success;
}

export default function AutomationControllingPage() {
  const [tickets, setTickets] = useState<TicketFTE[]>([]);
  const [budgetHours, setBudgetHours] = useState<Record<string, number>>(loadBudgetHours);
  const [kpis, setKpis] = useState(initialKPIs);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [budgetExpandedStreams, setBudgetExpandedStreams] = useState<Set<string>>(() => new Set());

  const toggleBudgetStream = (name: string) => {
    setBudgetExpandedStreams(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const registry = useMemo(() => getSubAppRegistry(), []);

  const loadTickets = useCallback(async () => {
    try {
      const res = await api.get('/feedback');
      setTickets(res.data.map((t: any) => ({
        id: t.id,
        app: t.app || 'Interfacing',
        title: t.title,
        automationFTE: t.automationFTE || 0,
        status: t.status,
        type: t.type,
        deadlineDate: t.deadlineDate || null,
      })));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const norm = (s: string) => s.toLowerCase().replace(/[-–—\s]+/g, '');

  const budgetStreams = useMemo(() => {
    const streamNames = Array.from(new Set(registry.map(r => r.stream)));
    return streamNames.map(stream => {
      const apps = registry.filter(r => r.stream === stream);
      const streamOwner = apps[0]?.streamOwner || '';
      const subApps = apps.map(a => {
        const appTickets = tickets.filter(t => {
          const tApp = norm(t.app || '');
          const aApp = norm(a.app || '');
          return tApp === aApp || tApp.includes(aApp) || aApp.includes(tApp);
        });
        const planned = appTickets.reduce((s, t) => s + t.automationFTE, 0);
        const done = appTickets.filter(t => t.status === 'done').reduce((s, t) => s + t.automationFTE, 0);
        const budget = budgetHours[a.app] ?? 0;
        const progress = budget > 0 ? Math.round((done / budget) * 100) : 0;
        return { ...a, planned, done, budget, progress, ticketCount: appTickets.length };
      });
      const totalBudget = subApps.reduce((s, a) => s + a.budget, 0);
      const totalPlanned = subApps.reduce((s, a) => s + a.planned, 0);
      const totalDone = subApps.reduce((s, a) => s + a.done, 0);
      const totalProgress = totalBudget > 0 ? Math.round((totalDone / totalBudget) * 100) : 0;
      return { name: stream, streamOwner, subApps, totalBudget, totalPlanned, totalDone, totalProgress };
    });
  }, [registry, tickets, budgetHours]);

  const totals = useMemo(() => {
    const totalFTE = budgetStreams.reduce((s, st) => s + st.totalBudget, 0);
    const plannedFTE = budgetStreams.reduce((s, st) => s + st.totalPlanned, 0);
    const automatedFTE = budgetStreams.reduce((s, st) => s + st.totalDone, 0);
    const avgProgress = totalFTE > 0 ? Math.round((automatedFTE / totalFTE) * 100) : 0;
    return { totalFTE, plannedFTE, automatedFTE, avgProgress };
  }, [budgetStreams]);

  const updateBudget = (appName: string, value: number) => {
    setBudgetHours(prev => {
      const next = { ...prev, [appName]: value };
      saveBudgetHours(next);
      return next;
    });
  };


  const updateKPIWeight = (id: string, weight: number) => {
    setKpis(prev => prev.map(k => k.id === id ? { ...k, weight } : k));
  };

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startDow = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDow);

    const days: Date[] = [];
    const d = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [calMonth, calYear]);

  const ticketsByDate = useMemo(() => {
    const map: Record<string, TicketFTE[]> = {};
    tickets.forEach(t => {
      if (!t.deadlineDate) return;
      const key = t.deadlineDate.split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tickets]);

  const navigateMonth = (dir: number) => {
    let m = calMonth + dir;
    let y = calYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalMonth(m);
    setCalYear(y);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const totalWeight = useMemo(() => kpis.reduce((s, k) => s + k.weight, 0), [kpis]);

  return (
    <Page>
      <Header>
        <Link to="/"><LogoImg src="/sixt-logo.png" alt="SIXT" /></Link>
        <BackLink to="/">&larr;</BackLink>
        <HeaderTitle>Automation Controlling</HeaderTitle>
      </Header>

      <Content>
        <PageTitle>Automation Controlling</PageTitle>

        {loading && <p style={{ color: theme.colors.textLight }}>Loading ticket data...</p>}

        <SummaryRow>
          <SummaryCard $color={theme.colors.primary}>
            <SummaryValue>{totals.totalFTE.toFixed(1)} h</SummaryValue>
            <SummaryLabel>Total Hours (Budget)</SummaryLabel>
          </SummaryCard>
          <SummaryCard $color={theme.colors.warning}>
            <SummaryValue>{totals.plannedFTE.toFixed(1)} h</SummaryValue>
            <SummaryLabel>Planned Hours (from Tickets)</SummaryLabel>
          </SummaryCard>
          <SummaryCard $color={theme.colors.success}>
            <SummaryValue>{totals.automatedFTE.toFixed(1)} h</SummaryValue>
            <SummaryLabel>Hours Saved (Done)</SummaryLabel>
          </SummaryCard>
          <SummaryCard $color={getScoreColor(totals.avgProgress)}>
            <SummaryValue>{totals.avgProgress}%</SummaryValue>
            <SummaryLabel>Overall Automation</SummaryLabel>
          </SummaryCard>
          <SummaryCard $color={theme.colors.info}>
            <SummaryValue>{(totals.totalFTE - totals.automatedFTE).toFixed(1)} h</SummaryValue>
            <SummaryLabel>Remaining Manual Hours</SummaryLabel>
          </SummaryCard>
        </SummaryRow>

        <FullWidthCard style={{ marginBottom: 28 }}>
          <CardTitle>Stream &rarr; Sub-App &rarr; Feature Reporting</CardTitle>
          <StreamReporting tickets={tickets} />
        </FullWidthCard>

        <Card style={{ marginBottom: 28 }}>
          <CardTitle>Release Schedule</CardTitle>
          <CalendarWrapper>
            <CalendarNav>
              <CalendarNavBtn onClick={() => navigateMonth(-1)}>&larr;</CalendarNavBtn>
              <MonthLabel>{MONTHS[calMonth]} {calYear}</MonthLabel>
              <CalendarNavBtn onClick={() => navigateMonth(1)}>&rarr;</CalendarNavBtn>
              <CalendarNavBtn onClick={() => { setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear()); }}>
                Today
              </CalendarNavBtn>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: theme.colors.textLight }}>
                {tickets.filter(t => t.deadlineDate).length} tickets with deadline
              </span>
            </CalendarNav>
            <CalGrid>
              {WEEKDAYS.map(d => <DayHeader key={d}>{d}</DayHeader>)}
              {calendarDays.map((day, i) => {
                const dateStr = day.toISOString().split('T')[0];
                const isCurrentMonth = day.getMonth() === calMonth;
                const isToday = dateStr === todayStr;
                const dayTickets = ticketsByDate[dateStr] || [];
                return (
                  <DayCell key={i} $isToday={isToday} $isCurrentMonth={isCurrentMonth}>
                    <DayNum $isToday={isToday}>{day.getDate()}</DayNum>
                    {dayTickets.slice(0, 3).map(t => (
                      <CalTicket key={t.id} $color={getStatusColor(t.status)} title={`[${t.app}] ${t.title} (${t.status})`}>
                        <span style={{ opacity: 0.8 }}>{t.app.substring(0, 3)}</span> {t.title}
                      </CalTicket>
                    ))}
                    {dayTickets.length > 3 && (
                      <span style={{ fontSize: 9, color: theme.colors.textLight }}>+{dayTickets.length - 3} more</span>
                    )}
                  </DayCell>
                );
              })}
            </CalGrid>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 10, color: theme.colors.textLight }}>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#bbb', marginRight: 4 }} />Open</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: theme.colors.info, marginRight: 4 }} />In Progress</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#6f42c1', marginRight: 4 }} />Review</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: theme.colors.warning, marginRight: 4 }} />Testing</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: theme.colors.success, marginRight: 4 }} />Done</span>
            </div>
          </CalendarWrapper>
        </Card>

        <SectionGrid>
          <Card style={{ gridColumn: '1 / -1' }}>
            <CardTitle>Hours Saved per Stream &amp; Sub-App (from Tickets)</CardTitle>
            <Table>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Stream / Sub-App</th>
                  <th style={{ textAlign: 'right', width: '14%' }}>Budget (h)</th>
                  <th style={{ textAlign: 'right', width: '12%' }}>Planned</th>
                  <th style={{ textAlign: 'right', width: '12%' }}>Done</th>
                  <th style={{ textAlign: 'right', width: '10%' }}>Progress</th>
                  <th style={{ width: '12%' }}>Visual</th>
                  <th style={{ textAlign: 'right', width: '10%' }}>Tickets</th>
                </tr>
              </thead>
              <tbody>
                {budgetStreams.map(stream => {
                  const bOpen = budgetExpandedStreams.has(stream.name);
                  return (
                    <React.Fragment key={stream.name}>
                      <tr style={{ background: theme.colors.secondary, color: 'white', cursor: 'pointer' }} onClick={() => toggleBudgetStream(stream.name)}>
                        <td style={{ fontWeight: 700, fontSize: 13, padding: '10px 14px' }}>
                          <span style={{ display: 'inline-block', width: 16, fontSize: 11, opacity: 0.8 }}>{bOpen ? '▼' : '▶'}</span>
                          <span style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 }}>Stream</span>
                          {stream.name}
                          {stream.streamOwner && <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 12 }}>({stream.streamOwner})</span>}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{stream.totalBudget.toFixed(1)}</td>
                        <td style={{ textAlign: 'right', color: '#ffc107' }}>{stream.totalPlanned.toFixed(1)}</td>
                        <td style={{ textAlign: 'right', color: '#90ee90' }}>{stream.totalDone.toFixed(1)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{stream.totalProgress}%</td>
                        <td>
                          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, height: 8 }}>
                            <div style={{ background: '#28a745', borderRadius: 6, height: 8, width: `${Math.min(stream.totalProgress, 100)}%` }} />
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>{stream.subApps.reduce((s, a) => s + a.ticketCount, 0)}</td>
                      </tr>
                      {bOpen && stream.subApps.map(app => (
                        <tr key={`${stream.name}-${app.app}`} style={{ background: '#f8f8f8', borderLeft: `3px solid ${theme.colors.primary}` }}>
                          <td style={{ fontWeight: 600, fontSize: 12, paddingLeft: 38 }}>{app.app}</td>
                          <td style={{ textAlign: 'right' }}>
                            <NumberInput
                              type="number"
                              step="0.5"
                              min="0"
                              value={app.budget}
                              onChange={e => { e.stopPropagation(); updateBudget(app.app, parseFloat(e.target.value) || 0); }}
                              onClick={e => e.stopPropagation()}
                              style={{ width: 70 }}
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: theme.colors.warning }}>{app.planned.toFixed(1)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: theme.colors.success }}>{app.done.toFixed(1)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: getScoreColor(app.progress) }}>{app.progress}%</td>
                          <td>
                            <ScoreBar>
                              <ScoreFill $pct={Math.min(app.progress, 100)} $color={getScoreColor(app.progress)} />
                            </ScoreBar>
                          </td>
                          <td style={{ textAlign: 'right', color: theme.colors.textSecondary }}>{app.ticketCount}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
                <tr style={{ fontWeight: 700, borderTop: `2px solid ${theme.colors.textPrimary}` }}>
                  <td>Total</td>
                  <td style={{ textAlign: 'right' }}>{totals.totalFTE.toFixed(1)}</td>
                  <td style={{ textAlign: 'right', color: theme.colors.warning }}>{totals.plannedFTE.toFixed(1)}</td>
                  <td style={{ textAlign: 'right', color: theme.colors.success }}>{totals.automatedFTE.toFixed(1)}</td>
                  <td style={{ textAlign: 'right', color: getScoreColor(totals.avgProgress) }}>{totals.avgProgress}%</td>
                  <td>
                    <ScoreBar>
                      <ScoreFill $pct={Math.min(totals.avgProgress, 100)} $color={getScoreColor(totals.avgProgress)} />
                    </ScoreBar>
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </Table>
          </Card>

          <Card>
            <CardTitle>
              KPI Weights
              {totalWeight !== 100 && (
                <Badge $color={theme.colors.danger}>
                  Sum: {totalWeight}% (should be 100%)
                </Badge>
              )}
              {totalWeight === 100 && (
                <Badge $color={theme.colors.success}>100%</Badge>
              )}
            </CardTitle>
            <Table>
              <thead>
                <tr>
                  <th>KPI</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Weight</th>
                  <th style={{ width: 140 }}>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map(k => (
                  <tr key={k.id}>
                    <td style={{ fontWeight: 600 }}>{k.name}</td>
                    <td style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{k.description}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{k.weight}%</td>
                    <td>
                      <SliderCell>
                        <Slider
                          type="range"
                          min={0}
                          max={100}
                          value={k.weight}
                          onChange={e => updateKPIWeight(k.id, parseInt(e.target.value))}
                        />
                      </SliderCell>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <FullWidthCard>
            <CardTitle>Score Logic & Maturity Levels</CardTitle>
            <Table>
              <thead>
                <tr>
                  <th>Automation Range</th>
                  <th>Maturity Level</th>
                  <th>Color</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {scoreRules.map(r => (
                  <tr key={r.range}>
                    <td style={{ fontWeight: 600 }}>{r.range}</td>
                    <td>
                      <Badge $color={r.color}>{r.label}</Badge>
                    </td>
                    <td>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: r.color }} />
                    </td>
                    <td style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </FullWidthCard>

          <FullWidthCard>
            <CardTitle>Ticket Hours Saved Breakdown ({tickets.filter(t => t.automationFTE > 0).length} tickets with hours)</CardTitle>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <Table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>App</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Hours Saved / Month</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.filter(t => t.automationFTE > 0).map((t, i) => (
                    <tr key={t.id}>
                      <td style={{ color: theme.colors.textLight }}>{i + 1}</td>
                      <td>{t.app}</td>
                      <td style={{ fontWeight: 600 }}>{t.title}</td>
                      <td>
                        <Badge $color={t.type === 'bug' ? theme.colors.danger : '#6f42c1'}>
                          {t.type === 'bug' ? 'Bug' : 'Feature'}
                        </Badge>
                      </td>
                      <td>
                        <Badge $color={
                          t.status === 'done' ? theme.colors.success :
                          t.status === 'in_progress' ? theme.colors.info :
                          t.status === 'review' ? '#6f42c1' :
                          t.status === 'testing' ? theme.colors.warning : '#ccc'
                        }>
                          {t.status === 'in_progress' ? 'In Progress' :
                           t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{t.automationFTE.toFixed(1)}</td>
                    </tr>
                  ))}
                  {tickets.filter(t => t.automationFTE > 0).length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: theme.colors.textLight, padding: 24 }}>
                        No tickets with Hours Saved set yet. Go to "App Requests & Bugs" and set hours saved values on feature tickets.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </FullWidthCard>
        </SectionGrid>
      </Content>
    </Page>
  );
}

const REPORT_STATUS_COLORS: Record<string, string> = {
  Live: '#28a745', Dev: '#ff5f00', Planned: '#999', Blocked: '#dc3545',
  open: '#6c757d', in_progress: '#ff5f00', review: '#6f42c1', testing: '#0d6efd', done: '#28a745',
};

const ReportBadge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: white;
  background: ${p => p.$color};
`;

const StreamRow = styled.tr`
  td {
    background: ${theme.colors.secondary} !important;
    color: white !important;
    font-weight: 700 !important;
    font-size: 14px !important;
    padding: 12px 14px !important;
    letter-spacing: 0.3px;
  }
`;

const SubAppRow = styled.tr`
  td {
    background: #f0f0f0 !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    padding: 9px 14px 9px 36px !important;
    border-left: 3px solid ${theme.colors.primary} !important;
  }
`;

const FeatureRow = styled.tr`
  cursor: pointer;
  td {
    font-size: 12px;
    padding: 6px 14px 6px 60px;
    color: ${theme.colors.textSecondary};
    border-left: 3px solid #e0e0e0;
  }
  &:hover td {
    background: #fef6f0 !important;
    color: ${theme.colors.primary};
  }
`;

const FeatureLink = styled.span`
  text-decoration: none;
  color: inherit;
  &:hover {
    text-decoration: underline;
    color: ${theme.colors.primary};
  }
`;

function StreamReporting({ tickets }: { tickets: { id: number; app: string; title: string; automationFTE: number; status: string }[] }) {
  const registry = useMemo(() => getSubAppRegistry(), []);
  const [expandedStreams, setExpandedStreams] = useState<Set<string>>(() => new Set());
  const [expandedApps, setExpandedApps] = useState<Set<string>>(() => new Set());

  const toggleStream = (name: string) => {
    setExpandedStreams(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const toggleApp = (key: string) => {
    setExpandedApps(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const streams = useMemo(() => {
    const streamNames = Array.from(new Set(registry.map(r => r.stream)));
    return streamNames.map(stream => {
      const apps = registry.filter(r => r.stream === stream);
      const streamOwner = apps[0]?.streamOwner || '';
      return {
        name: stream,
        streamOwner,
        apps: apps.map(a => {
          const normStr = (s: string) => s.toLowerCase().replace(/[-–—\s]+/g, '');
          const appTickets = tickets.filter(t => {
            const tApp = normStr(t.app || '');
            const aApp = normStr(a.app || '');
            return tApp === aApp || tApp.includes(aApp) || aApp.includes(tApp);
          });
          const totalHours = appTickets.reduce((s, t) => s + t.automationFTE, 0);
          const doneHours = appTickets.filter(t => t.status === 'done').reduce((s, t) => s + t.automationFTE, 0);
          return { ...a, tickets: appTickets, totalHours, doneHours };
        }),
      };
    });
  }, [registry, tickets]);

  return (
    <div style={{ maxHeight: 700, overflowY: 'auto' }}>
      <Table>
        <thead>
          <tr>
            <th style={{ width: '35%' }}>Name</th>
            <th style={{ width: '15%' }}>Owner</th>
            <th style={{ width: '10%' }}>Status</th>
            <th style={{ width: '10%', textAlign: 'right' }}>Hours</th>
            <th style={{ width: '15%' }}>Progress</th>
            <th style={{ width: '15%', textAlign: 'right' }}>Features</th>
          </tr>
        </thead>
        <tbody>
          {streams.map(stream => {
            const totalHours = stream.apps.reduce((s, a) => s + a.totalHours, 0);
            const doneHours = stream.apps.reduce((s, a) => s + a.doneHours, 0);
            const totalFeatures = stream.apps.reduce((s, a) => s + a.tickets.length, 0);
            const streamOpen = expandedStreams.has(stream.name);
            return (
              <React.Fragment key={stream.name}>
                <StreamRow onClick={() => toggleStream(stream.name)} style={{ cursor: 'pointer' }}>
                  <td colSpan={2}>
                    <span style={{ display: 'inline-block', width: 16, fontSize: 11, opacity: 0.8 }}>{streamOpen ? '▼' : '▶'}</span>
                    <span style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 }}>Stream</span>
                    {stream.name}
                    {stream.streamOwner && (
                      <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 16 }}>Owner: {stream.streamOwner}</span>
                    )}
                  </td>
                  <td></td>
                  <td style={{ textAlign: 'right' }}>{totalHours.toFixed(1)} h</td>
                  <td>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, height: 8, width: '100%' }}>
                      <div style={{ background: '#28a745', borderRadius: 6, height: 8, width: `${totalHours > 0 ? (doneHours / totalHours * 100) : 0}%` }} />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>{totalFeatures}</td>
                </StreamRow>
                {streamOpen && stream.apps.map(app => {
                  const appKey = `${stream.name}::${app.app}`;
                  const appOpen = expandedApps.has(appKey);
                  return (
                    <React.Fragment key={appKey}>
                      <SubAppRow onClick={() => app.tickets.length > 0 && toggleApp(appKey)} style={{ cursor: app.tickets.length > 0 ? 'pointer' : 'default' }}>
                        <td>
                          {app.tickets.length > 0 && <span style={{ display: 'inline-block', width: 14, fontSize: 10, color: theme.colors.textSecondary }}>{appOpen ? '▼' : '▶'}</span>}
                          {app.app}
                        </td>
                        <td style={{ color: theme.colors.textSecondary }}>{app.owner || '–'}</td>
                        <td><ReportBadge $color={REPORT_STATUS_COLORS[app.status] || '#999'}>{app.status}</ReportBadge></td>
                        <td style={{ textAlign: 'right' }}>{app.totalHours.toFixed(1)} h</td>
                        <td>
                          <div style={{ background: '#e0e0e0', borderRadius: 6, height: 6, width: '100%' }}>
                            <div style={{ background: '#28a745', borderRadius: 6, height: 6, width: `${app.totalHours > 0 ? (app.doneHours / app.totalHours * 100) : 0}%` }} />
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>{app.tickets.length}</td>
                      </SubAppRow>
                      {appOpen && app.tickets.map(t => (
                        <FeatureRow key={t.id} onClick={() => window.location.href = `/feedback?ticket=${t.id}`}>
                          <td>
                            <FeatureLink title="Click to open ticket">
                              #{t.id} {t.title}
                            </FeatureLink>
                          </td>
                          <td></td>
                          <td><ReportBadge $color={REPORT_STATUS_COLORS[t.status] || '#999'}>{t.status}</ReportBadge></td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{t.automationFTE > 0 ? `${t.automationFTE.toFixed(1)} h` : '–'}</td>
                          <td></td>
                          <td></td>
                        </FeatureRow>
                      ))}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
