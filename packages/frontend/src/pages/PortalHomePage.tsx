import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';
import api from '../utils/api';

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

const StepCard = styled.div<{ $active: boolean; $clickable: boolean; $idx: number; $dragOver?: boolean }>`
  width: 100%;
  position: relative;
  height: 170px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px 24px 20px ${p => p.$idx === 0 ? '24px' : '36px'};
  cursor: ${p => p.$clickable ? 'pointer' : 'grab'};
  background: ${p => p.$active ? theme.colors.primary : theme.colors.surface};
  color: ${p => p.$active ? 'white' : theme.colors.textPrimary};
  clip-path: ${p => {
    if (p.$idx === 0) return 'polygon(0 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 0 100%)';
    return 'polygon(0 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 0 100%, 24px 50%)';
  }};
  transition: all 0.25s;
  box-shadow: ${p => p.$active ? 'none' : 'inset 0 0 0 1px #e0e0e0'};
  ${p => p.$dragOver ? `outline: 2px dashed ${theme.colors.primary}; outline-offset: -4px;` : ''}

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

const StepDeadline = styled.div<{ $active: boolean }>`
  font-size: 9px;
  font-weight: 600;
  margin-top: 4px;
  color: ${p => p.$active ? 'rgba(255,255,255,0.7)' : theme.colors.textLight};
`;

const EnvBadge = styled.span<{ $env: string; $active: boolean }>`
  display: inline-block;
  margin-top: 4px;
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${p =>
    p.$env === 'PROD' ? (p.$active ? 'rgba(255,255,255,0.25)' : theme.colors.success) :
    p.$env === 'TEST' ? (p.$active ? 'rgba(255,255,255,0.2)' : theme.colors.warning) :
    (p.$active ? 'rgba(255,255,255,0.15)' : '#e0e0e0')};
  color: ${p =>
    p.$env === 'PROD' ? (p.$active ? 'white' : 'white') :
    p.$env === 'TEST' ? (p.$active ? 'white' : '#333') :
    (p.$active ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary)};
`;

interface Step {
  label: string;
  desc: string;
  path: string | null;
  badge: string;
  badgeColor: string;
  active: boolean;
  deadline: string | null;
  env: 'DEV' | 'TEST' | 'PROD' | null;
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
  white-space: pre-line;
  text-align: center;
  margin-bottom: 2px;
  letter-spacing: 0.3px;
`;

const HOURS_SAVED_MAX = 60;

const hoursMilestones = [
  { label: '10h', pct: (10 / HOURS_SAVED_MAX) * 100, highlight: false },
  { label: '20h', pct: (20 / HOURS_SAVED_MAX) * 100, highlight: false },
  { label: '30h', pct: (30 / HOURS_SAVED_MAX) * 100, highlight: false },
  { label: '40h', pct: (40 / HOURS_SAVED_MAX) * 100, highlight: false },
  { label: '50h – Team Dinner 🎉', pct: (50 / HOURS_SAVED_MAX) * 100, highlight: true },
];

const LeaderboardSection = styled.div`
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 0 32px 64px;
`;

const LeaderboardTitle = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LeaderboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
`;

const PersonCard = styled.div<{ $rank: number }>`
  background: ${theme.colors.surface};
  border-radius: 10px;
  box-shadow: ${theme.shadow};
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  border-top: 3px solid ${p =>
    p.$rank === 1 ? '#FFD700' :
    p.$rank === 2 ? '#C0C0C0' :
    p.$rank === 3 ? '#CD7F32' :
    theme.colors.border};
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadowHover};
  }
`;

const RankBadge = styled.div<{ $rank: number }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 8px;
  background: ${p =>
    p.$rank === 1 ? '#FFD700' :
    p.$rank === 2 ? '#C0C0C0' :
    p.$rank === 3 ? '#CD7F32' :
    '#f0f0f0'};
  color: ${p => p.$rank <= 3 ? '#333' : theme.colors.textSecondary};
`;

const PersonAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, #ff8c40);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 8px;
`;

const PersonName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 2px;
`;

const PersonRole = styled.div`
  font-size: 10px;
  color: ${theme.colors.textLight};
  margin-bottom: 10px;
`;

const ScoreBar = styled.div`
  width: 100%;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
`;

const ScoreFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${p => p.$pct}%;
  background: linear-gradient(90deg, ${theme.colors.primary}, #ff8c40);
  border-radius: 4px;
  transition: width 0.6s ease;
`;

const ScoreLabel = styled.div`
  font-size: 12px;
  font-weight: 800;
  color: ${theme.colors.primary};
`;

const ScoreSubtext = styled.div`
  font-size: 9px;
  color: ${theme.colors.textLight};
  margin-top: 2px;
`;

interface LeaderboardEntry {
  name: string;
  initials: string;
  role: string;
  score: number;
}

const leaderboardData: LeaderboardEntry[] = [
  { name: 'Sarah M.', initials: 'SM', role: 'Franchise Controlling', score: 82 },
  { name: 'Thomas K.', initials: 'TK', role: 'FSM – Calculation', score: 74 },
  { name: 'Julia W.', initials: 'JW', role: 'Interfacing', score: 68 },
  { name: 'Michael R.', initials: 'MR', role: 'Parameter Maintenance', score: 55 },
  { name: 'Anna B.', initials: 'AB', role: 'Bookings & Invoicing', score: 43 },
  { name: 'David L.', initials: 'DL', role: 'B2P', score: 31 },
  { name: 'Lisa H.', initials: 'LH', role: 'Controlling', score: 22 },
  { name: 'Felix P.', initials: 'FP', role: 'Partner Requests', score: 15 },
].sort((a, b) => b.score - a.score);

const AddProcessBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 2px dashed ${theme.colors.border};
  border-radius: 12px;
  background: transparent;
  color: ${theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 36px;
  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
    background: rgba(255,95,0,0.03);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBox = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  padding: 28px 32px;
  max-width: 520px;
  width: 90%;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
  color: ${theme.colors.textPrimary};
`;

const FormLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  display: block;
  margin-bottom: 4px;
  margin-top: 14px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 24px;
  justify-content: flex-end;
`;

const ModalBtn = styled.button<{ $primary?: boolean }>`
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: ${p => p.$primary ? theme.colors.primary : theme.colors.border};
  color: ${p => p.$primary ? 'white' : theme.colors.textPrimary};
  &:hover { opacity: 0.9; }
`;

const KPIStrip = styled.div`
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 32px 0;
  display: flex;
  gap: 16px;
  animation: ${fadeIn} 0.35s ease;
`;

const KPICard = styled.div<{ $color: string; $glow?: boolean }>`
  flex: 1;
  background: ${theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${theme.shadow};
  padding: 18px 20px;
  text-align: center;
  border-top: 4px solid ${p => p.$color};
  position: relative;
  overflow: hidden;
  ${p => p.$glow ? `
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,95,0,0.04) 0%, transparent 60%);
      pointer-events: none;
    }
  ` : ''}
`;

const KPIValue = styled.div`
  font-size: 26px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  font-variant-numeric: tabular-nums;
`;

const KPILabel = styled.div`
  font-size: 11px;
  color: ${theme.colors.textSecondary};
  margin-top: 2px;
  font-weight: 600;
`;

const KPISub = styled.div`
  font-size: 9px;
  color: ${theme.colors.textLight};
  margin-top: 4px;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.danger};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  &:hover { background: rgba(220,53,69,0.08); }
`;

const AddStepBtn = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  &:hover { background: rgba(255,95,0,0.08); }
`;

const StepWrapper = styled.div`
  flex: 1;
  position: relative;
  &:hover > button { opacity: 1; }
`;

const RemoveStepBtn = styled.button`
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid ${theme.colors.danger};
  background: white;
  color: ${theme.colors.danger};
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  &:hover { background: ${theme.colors.danger}; color: white; }
`;

const StepEditInput = styled.input`
  background: white;
  border: 1px solid ${theme.colors.primary};
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  width: 100%;
  max-width: 120px;
  text-align: center;
  &:focus { outline: none; box-shadow: 0 0 0 2px rgba(255,95,0,0.2); }
`;

const GuidanceStrip = styled.div`
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 12px 32px 0;
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
  animation: ${fadeIn} 0.4s ease;
`;

const GuidanceItem = styled.span`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  font-weight: 500;
  font-style: italic;
`;

const GuidanceLink = styled(Link)`
  font-size: 12px;
  font-weight: 700;
  color: ${theme.colors.primary};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const initialProcesses: ProcessRow[] = [
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
        deadline: null,
        env: null,
      },
      {
        label: 'Parameter Maintenance',
        desc: 'Person 2',
        path: '/parameter-maintenance',
        badge: 'Live',
        badgeColor: theme.colors.success,
        active: true,
        deadline: null,
        env: 'DEV',
      },
      {
        label: 'FSM – Calculation',
        desc: 'Person 3',
        path: '/fsm',
        badge: 'Coming soon',
        badgeColor: '#999',
        active: true,
        deadline: 'KW12 2026',
        env: 'DEV',
      },
      {
        label: 'Bookings & Invoicing',
        desc: 'Person 4',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
        deadline: null,
        env: null,
      },
      {
        label: 'Interfacing',
        desc: 'Person 5',
        path: '/interfacing',
        badge: 'Live',
        badgeColor: theme.colors.success,
        active: true,
        deadline: null,
        env: 'TEST',
      },
      {
        label: 'Controlling',
        desc: 'Person 6',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
        deadline: null,
        env: null,
      },
    ],
  },
  {
    title: 'B2P Controlling',
    progress: 0,
    steps: [
      {
        label: 'Partner Requests & Reconciliation',
        desc: 'Person 1',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
        deadline: null,
        env: null,
      },
      {
        label: 'Parameter Maintenance',
        desc: 'Person 2',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
        deadline: null,
        env: null,
      },
      {
        label: 'VPF',
        desc: 'Person 3',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
        deadline: null,
        env: null,
      },
      {
        label: 'Bonus & Accruals',
        desc: 'Person 4',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
        deadline: null,
        env: null,
      },
      {
        label: 'Month End Processes',
        desc: 'Person 5',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
        deadline: null,
        env: null,
      },
      {
        label: 'Reporting & Controlling',
        desc: 'Person 6',
        path: null,
        badge: 'Planned',
        badgeColor: '#bbb',
        active: false,
        deadline: null,
        env: null,
      },
    ],
  },
];

function makeDefaultStep(idx: number): Step {
  return {
    label: `Step ${idx + 1}`,
    desc: `Person ${idx + 1}`,
    path: null,
    badge: 'Planned',
    badgeColor: '#bbb',
    active: false,
    deadline: null,
    env: null,
  };
}

export default function PortalHomePage() {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<ProcessRow[]>(initialProcesses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStepCount, setNewStepCount] = useState(6);
  const [newStepLabels, setNewStepLabels] = useState<string[]>([]);
  const [totalDoneHours, setTotalDoneHours] = useState(0);

  useEffect(() => {
    api.get('/feedback/automation-summary')
      .then((res) => {
        const apps = res.data.data || [];
        const doneHours = apps.reduce((s: number, a: any) => s + (a.doneFTE || 0), 0);
        setTotalDoneHours(doneHours);
      })
      .catch(() => {});
  }, []);

  const hoursSavedPerMonth = Math.round(totalDoneHours * 10) / 10;
  const peaktimeRatio = 0.45;
  const peaktimeHours = Math.round(hoursSavedPerMonth * peaktimeRatio * 10) / 10;

  const openAddModal = () => {
    setNewTitle('');
    setNewStepCount(6);
    setNewStepLabels(Array.from({ length: 6 }, (_, i) => `Step ${i + 1}`));
    setShowAddModal(true);
  };

  const handleStepCountChange = (count: number) => {
    const clamped = Math.max(2, Math.min(10, count));
    setNewStepCount(clamped);
    setNewStepLabels(prev => {
      const next = [...prev];
      while (next.length < clamped) next.push(`Step ${next.length + 1}`);
      return next.slice(0, clamped);
    });
  };

  const handleAddProcess = () => {
    if (!newTitle.trim()) return;
    const newProc: ProcessRow = {
      title: newTitle.trim(),
      progress: 0,
      steps: Array.from({ length: newStepCount }, (_, i) => ({
        ...makeDefaultStep(i),
        label: newStepLabels[i]?.trim() || `Step ${i + 1}`,
      })),
    };
    setProcesses(prev => [...prev, newProc]);
    setShowAddModal(false);
  };

  const removeProcess = (title: string) => {
    setProcesses(prev => prev.filter(p => p.title !== title));
  };

  const addStepToProcess = (title: string) => {
    setProcesses(prev => prev.map(p => {
      if (p.title !== title) return p;
      const idx = p.steps.length;
      return { ...p, steps: [...p.steps, makeDefaultStep(idx)] };
    }));
  };

  const removeStepFromProcess = (title: string, stepIdx: number) => {
    setProcesses(prev => prev.map(p => {
      if (p.title !== title || p.steps.length <= 1) return p;
      return { ...p, steps: p.steps.filter((_, i) => i !== stepIdx) };
    }));
  };

  const renameStepInProcess = (title: string, stepIdx: number, field: 'label' | 'desc', value: string) => {
    setProcesses(prev => prev.map(p => {
      if (p.title !== title) return p;
      const steps = p.steps.map((s, i) => i === stepIdx ? { ...s, [field]: value } : s);
      return { ...p, steps };
    }));
  };

  const [editingStep, setEditingStep] = useState<{ proc: string; idx: number; field: 'label' | 'desc' } | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const dragProcRef = useRef<string | null>(null);
  const dragIdxRef = useRef<number>(-1);
  const [dragOverTarget, setDragOverTarget] = useState<{ proc: string; idx: number } | null>(null);

  const handleDragStart = (procTitle: string, stepIdx: number) => {
    dragProcRef.current = procTitle;
    dragIdxRef.current = stepIdx;
  };

  const handleDragOver = (e: React.DragEvent, procTitle: string, stepIdx: number) => {
    e.preventDefault();
    if (dragProcRef.current === procTitle) {
      setDragOverTarget({ proc: procTitle, idx: stepIdx });
    }
  };

  const handleDrop = (procTitle: string, dropIdx: number) => {
    if (dragProcRef.current !== procTitle) return;
    const fromIdx = dragIdxRef.current;
    if (fromIdx === dropIdx) { setDragOverTarget(null); return; }
    setProcesses(prev => prev.map(p => {
      if (p.title !== procTitle) return p;
      const steps = [...p.steps];
      const [moved] = steps.splice(fromIdx, 1);
      steps.splice(dropIdx, 0, moved);
      return { ...p, steps };
    }));
    setDragOverTarget(null);
  };

  const handleDragEnd = () => {
    dragProcRef.current = null;
    dragIdxRef.current = -1;
    setDragOverTarget(null);
  };

  const startEdit = (proc: string, idx: number, field: 'label' | 'desc', current: string) => {
    setEditingStep({ proc, idx, field });
    setEditingValue(current);
  };

  const commitEdit = () => {
    if (editingStep && editingValue.trim()) {
      renameStepInProcess(editingStep.proc, editingStep.idx, editingStep.field, editingValue.trim());
    }
    setEditingStep(null);
  };

  return (
    <Page>
      <Header>
        <LogoImg src="/sixt-logo.png" alt="SIXT" />
        <HeaderRight>
          <FeedbackLink to="/automation-controlling">Automation Controlling</FeedbackLink>
          <FeedbackLink to="/api-management">API, App, DB Management</FeedbackLink>
          <FeedbackLink to="/collaboration-model">Collaboration Model</FeedbackLink>
          <FeedbackLink to="/feedback">App Requests &amp; Bugs</FeedbackLink>
          <HeaderText>You rock today!</HeaderText>
        </HeaderRight>
      </Header>

      <KPIStrip>
        <KPICard $color="#e05c00" $glow>
          <KPIValue>{hoursSavedPerMonth.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h</KPIValue>
          <KPILabel>Hours Saved / Month</KPILabel>
          <KPISub>from {totalDoneHours > 0 ? 'completed' : 'no'} tickets</KPISub>
        </KPICard>
        <KPICard $color="#c44500">
          <KPIValue>{peaktimeHours.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h</KPIValue>
          <KPILabel>hereof Peaktime Hours</KPILabel>
          <KPISub>~45% &middot; 5th–15th of month</KPISub>
        </KPICard>
        <KPICard $color="#8b5cf6">
          <KPIValue>&mdash;</KPIValue>
          <KPILabel>Token Costs</KPILabel>
          <KPISub>all users &middot; coming soon</KPISub>
        </KPICard>
        <KPICard $color={theme.colors.info}>
          <KPIValue>&mdash;</KPIValue>
          <KPILabel>Hours Spent Coding</KPILabel>
          <KPISub>all users &middot; coming soon</KPISub>
        </KPICard>
        <KPICard $color={theme.colors.primary} $glow>
          <KPIValue>10,738</KPIValue>
          <KPILabel>Lines of Code</KPILabel>
          <KPISub>Frontend + Backend + Shared</KPISub>
        </KPICard>
        <KPICard $color="#6f42c1">
          <KPIValue>25</KPIValue>
          <KPILabel>Pages</KPILabel>
          <KPISub>across 4 Sub-Apps</KPISub>
        </KPICard>
        <KPICard $color={theme.colors.success}>
          <KPIValue>26</KPIValue>
          <KPILabel>API Endpoints</KPILabel>
          <KPISub>REST &middot; Active</KPISub>
        </KPICard>
        <KPICard $color={theme.colors.warning}>
          <KPIValue>8</KPIValue>
          <KPILabel>Git Commits</KPILabel>
          <KPISub>on main branch</KPISub>
        </KPICard>
      </KPIStrip>

      <GuidanceStrip>
        <GuidanceItem>1. If you can explain it, you can vibe-code it.</GuidanceItem>
        <GuidanceItem>2. Focus on features with impact.</GuidanceItem>
        <GuidanceLink to="/collaboration-model">3. See Further Guidance &rarr;</GuidanceLink>
      </GuidanceStrip>

      <ProcessContainer style={{ paddingTop: 28 }}>
        {processes.map((proc) => (
          <div key={proc.title} style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ProcessTitle>{proc.title}</ProcessTitle>
              <AddStepBtn onClick={() => addStepToProcess(proc.title)}>+ Add Step</AddStepBtn>
              {!['Franchise Controlling'].includes(proc.title) && (
                <RemoveBtn onClick={() => removeProcess(proc.title)}>Remove</RemoveBtn>
              )}
            </div>
            <FlowRow>
              {proc.steps.map((step, i) => (
                <StepWrapper
                  key={`${proc.title}-${i}`}
                  draggable
                  onDragStart={() => handleDragStart(proc.title, i)}
                  onDragOver={e => handleDragOver(e, proc.title, i)}
                  onDrop={() => handleDrop(proc.title, i)}
                  onDragEnd={handleDragEnd}
                >
                  <StepCard
                    $active={step.active}
                    $clickable={!!step.path}
                    $idx={i}
                    $dragOver={dragOverTarget?.proc === proc.title && dragOverTarget.idx === i}
                    onClick={() => step.path && navigate(step.path)}
                  >
                    <StepNumber $active={step.active}>{i + 1}</StepNumber>
                    {editingStep?.proc === proc.title && editingStep.idx === i && editingStep.field === 'label' ? (
                      <StepEditInput
                        autoFocus
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingStep(null); }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <StepTitle $active={step.active} onDoubleClick={e => { e.stopPropagation(); startEdit(proc.title, i, 'label', step.label); }} style={{ cursor: 'text' }} title="Double-click to rename">{step.label}</StepTitle>
                    )}
                    {editingStep?.proc === proc.title && editingStep.idx === i && editingStep.field === 'desc' ? (
                      <StepEditInput
                        autoFocus
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingStep(null); }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <StepDesc $active={step.active} onDoubleClick={e => { e.stopPropagation(); startEdit(proc.title, i, 'desc', step.desc); }} style={{ cursor: 'text' }} title="Double-click to rename">{step.desc}</StepDesc>
                    )}
                    <StepBadge $color={step.badgeColor}>{step.badge}</StepBadge>
                    {step.env && <EnvBadge $env={step.env} $active={step.active}>{step.env}</EnvBadge>}
                    {step.deadline && <StepDeadline $active={step.active}>Deadline: {step.deadline}</StepDeadline>}
                  </StepCard>
                  {proc.steps.length > 1 && (
                    <RemoveStepBtn onClick={() => removeStepFromProcess(proc.title, i)} title="Delete step">−</RemoveStepBtn>
                  )}
                </StepWrapper>
              ))}
            </FlowRow>
            <ProgressWrapper>
              {hoursMilestones.map((m, mi) => (
                <TargetMarker key={`${m.label}-${mi}`} $pct={m.pct}>
                  <TargetLabel $highlight={m.highlight}>{m.label}</TargetLabel>
                  <TargetLine $highlight={m.highlight} />
                </TargetMarker>
              ))}
              <ProgressBarOuter>
                <ProgressBarInner $pct={Math.min((hoursSavedPerMonth / HOURS_SAVED_MAX) * 100, 100)} />
                <ProgressLabel>{hoursSavedPerMonth.toFixed(1)}h saved / month</ProgressLabel>
              </ProgressBarOuter>
            </ProgressWrapper>
          </div>
        ))}

        <AddProcessBtn onClick={openAddModal}>
          + Add Process &amp; Team
        </AddProcessBtn>
      </ProcessContainer>

      {showAddModal && (
        <ModalOverlay onClick={() => setShowAddModal(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Add New Process &amp; Team</ModalTitle>

            <FormLabel>Process Name</FormLabel>
            <FormInput
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Revenue Management"
              autoFocus
            />

            <FormLabel>Number of Steps</FormLabel>
            <FormSelect
              value={newStepCount}
              onChange={e => handleStepCountChange(parseInt(e.target.value))}
            >
              {[2,3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n} Steps</option>
              ))}
            </FormSelect>

            <FormLabel style={{ marginTop: 18, marginBottom: 8 }}>Step Labels</FormLabel>
            {newStepLabels.slice(0, newStepCount).map((lbl, i) => (
              <FormInput
                key={i}
                value={lbl}
                onChange={e => setNewStepLabels(prev => {
                  const next = [...prev];
                  next[i] = e.target.value;
                  return next;
                })}
                placeholder={`Step ${i + 1}`}
                style={{ marginBottom: 6, fontSize: 13 }}
              />
            ))}

            <ModalActions>
              <ModalBtn onClick={() => setShowAddModal(false)}>Cancel</ModalBtn>
              <ModalBtn $primary onClick={handleAddProcess} disabled={!newTitle.trim()}>
                Add Process
              </ModalBtn>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}

      <LeaderboardSection>
        <LeaderboardTitle>
          🏆 Automation Leaderboard
        </LeaderboardTitle>
        <LeaderboardGrid>
          {leaderboardData.map((person, idx) => (
            <PersonCard key={person.name} $rank={idx + 1}>
              <RankBadge $rank={idx + 1}>{idx + 1}</RankBadge>
              <PersonAvatar>{person.initials}</PersonAvatar>
              <PersonName>{person.name}</PersonName>
              <PersonRole>{person.role}</PersonRole>
              <ScoreBar>
                <ScoreFill $pct={person.score} />
              </ScoreBar>
              <ScoreLabel>{person.score} pts</ScoreLabel>
              <ScoreSubtext>Automation Score</ScoreSubtext>
            </PersonCard>
          ))}
        </LeaderboardGrid>
      </LeaderboardSection>
    </Page>
  );
}
