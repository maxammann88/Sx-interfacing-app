import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { getSubAppPath, getSubAppRegistry, getStreamOrder, saveStreamOrder, getSortedStreams, saveRegistry } from './ApiManagementPage';
import { getTeamMemberNames } from './CodingTeamManagementPage';

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
  hoursSaved: number;
}

function makeInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(p => p[0].toUpperCase()).join('').slice(0, 2);
}

const TEAM_MEMBERS_KEY = 'teamMembers_v2';

function loadTeamMembers(): { name: string; role: string; stream?: string }[] {
  try {
    const raw = localStorage.getItem(TEAM_MEMBERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

const NAME_ALIASES: Record<string, string> = {
  'Max A.': 'Max Ammann',
  'Max': 'Max Ammann',
  'Thorsten': 'Torsten Hinz',
  'Henning': 'Henning Seidel',
  'Herbert': 'Herbert Krenn',
  'Matthias': 'Matthias Dietrich',
  'Matthias Berger': 'Matthias Dietrich',
  'Inês': 'Inês Boavida Couto',
  'Ines': 'Inês Boavida Couto',
};
function resolveAlias(name: string): string { return NAME_ALIASES[name] || name; }

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

const SectionToggle = styled.div`
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 8px 32px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  &:hover { opacity: 0.85; }
`;

const SectionToggleTitle = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const SectionToggleArrow = styled.span<{ $open: boolean }>`
  font-size: 11px;
  color: ${theme.colors.textSecondary};
  transition: transform 0.2s;
  transform: rotate(${p => p.$open ? '90deg' : '0deg'});
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

const KPICard = styled.div`
  flex: 1;
  background: ${theme.colors.surface};
  border-radius: 12px;
  box-shadow: ${theme.shadow};
  padding: 14px 16px;
  text-align: center;
  border-top: 4px solid #3a3a3a;
`;

const KPIValue = styled.div`
  font-size: 22px;
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
  padding: 8px 32px 0;
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: center;
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

const BUILTIN_PATHS: Record<string, string> = {
  'interfacing': '/interfacing',
  'parameter maintenance': '/parameter-maintenance',
  'fsm-calculation': '/fsm',
  'fsm – calculation': '/fsm',
  'fsm calculation': '/fsm',
};

const STATUS_BADGE_MAP: Record<string, { badge: string; badgeColor: string; active: boolean }> = {
  'Live & IT Approved': { badge: 'IT Approved', badgeColor: '#1a7f37', active: true },
  Live: { badge: 'Live', badgeColor: '#28a745', active: true },
  Dev: { badge: 'Dev', badgeColor: '#ff5f00', active: true },
  Testing: { badge: 'Testing', badgeColor: '#fd7e14', active: true },
  Planning: { badge: 'Planning', badgeColor: '#999', active: false },
  Planned: { badge: 'Planning', badgeColor: '#999', active: false },
  Backlog: { badge: 'Backlog', badgeColor: '#6c757d', active: false },
  Blocked: { badge: 'Blocked', badgeColor: '#dc3545', active: false },
};

function buildProcessesFromRegistry(): ProcessRow[] {
  const registry = getSubAppRegistry();
  const streamMap: Record<string, typeof registry> = {};

  registry.forEach(entry => {
    if (!streamMap[entry.stream]) {
      streamMap[entry.stream] = [];
    }
    streamMap[entry.stream].push(entry);
  });

  const orderedStreams = getSortedStreams();

  return orderedStreams.filter(s => !!streamMap[s]).map(stream => {
    const entries = streamMap[stream];
    const steps: Step[] = entries.map((e, i) => {
      const statusInfo = STATUS_BADGE_MAP[e.status] || STATUS_BADGE_MAP.Planned;
      const normLabel = e.app.toLowerCase().replace(/[-–—]/g, ' ').replace(/\s+/g, ' ');
      const path = BUILTIN_PATHS[normLabel] || BUILTIN_PATHS[e.app.toLowerCase()] || null;
      return {
        label: e.app,
        desc: e.owner || `Person ${i + 1}`,
        path,
        badge: statusInfo.badge,
        badgeColor: statusInfo.badgeColor,
        active: statusInfo.active,
        deadline: e.deadlineTarget || null,
        env: null,
      };
    });
    return { title: stream, progress: 0, steps };
  });
}

function syncProcessToRegistry(streamTitle: string, steps: Step[]) {
  try {
    const registry = getSubAppRegistry();
    const existing = registry.filter((r: any) => r.stream === streamTitle);
    const streamOwner = existing.length > 0 ? existing[0].streamOwner || '' : '';

    const otherEntries = registry.filter((r: any) => r.stream !== streamTitle);
    const newEntries = steps.map(s => {
      const prev = existing.find((e: any) => e.app === s.label);
      const status = prev?.status === 'Planned' ? 'Planning' : (prev?.status || 'Planning');
      return {
        stream: streamTitle,
        streamOwner: prev?.streamOwner || streamOwner,
        app: s.label,
        owner: prev?.owner || '',
        status,
        description: prev?.description || '',
        deadlineTarget: prev?.deadlineTarget || '',
        budgetHours: prev?.budgetHours,
        isStarted: prev?.isStarted ?? false,
      };
    });

    saveRegistry([...otherEntries, ...newEntries]);
  } catch { /* ignore */ }
}

function makeDefaultStep(idx: number): Step {
  return {
    label: `Step ${idx + 1}`,
    desc: `Person ${idx + 1}`,
    path: null,
    badge: 'Planning',
    badgeColor: '#bbb',
    active: false,
    deadline: null,
    env: null,
  };
}

export default function PortalHomePage() {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<ProcessRow[]>(() => buildProcessesFromRegistry());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStepCount, setNewStepCount] = useState(6);
  const [newStepLabels, setNewStepLabels] = useState<string[]>([]);
  const [totalDoneHours, setTotalDoneHours] = useState(0);
  const [streamOwners, setStreamOwners] = useState<Record<string, string>>({});
  const [subAppOwners, setSubAppOwners] = useState<Record<string, string>>({});
  const [subAppDeadlines, setSubAppDeadlines] = useState<Record<string, string>>({});
  const [codeKpis, setCodeKpis] = useState({ linesOfCode: 0, pages: 0, endpoints: 0, commits: 0 });
  const [ticketStats, setTicketStats] = useState({ total: 0, open: 0, in_progress: 0, review: 0, testing: 0, done: 0 });
  const [allTickets, setAllTickets] = useState<{ app: string; automationFTE: number; peakPercent: number; status: string; assignee: string }[]>([]);
  const [kpiOpen, setKpiOpen] = useState(true);
  const [streamsOpen, setStreamsOpen] = useState(true);
  const [leaderboardOpen, setLeaderboardOpen] = useState(true);
  const [collapsedStreams, setCollapsedStreams] = useState<Set<string>>(new Set());
  const [codingHoursFromGit, setCodingHoursFromGit] = useState(0);
  const teamNames = useMemo(() => getTeamMemberNames(), []);

  useEffect(() => {
    api.get('/feedback')
      .then((res) => {
        const items: any[] = res.data || [];
        const stats = { total: items.length, open: 0, in_progress: 0, review: 0, testing: 0, done: 0 };
        items.forEach(t => { if (stats.hasOwnProperty(t.status)) (stats as any)[t.status]++; });
        setTicketStats(stats);
        setAllTickets(items.map(t => ({ app: t.app || '', automationFTE: t.automationFTE || 0, peakPercent: t.peakPercent || 0, status: t.status || 'open', assignee: t.assignee || '' })));
        const doneHours = items
          .filter(t => t.status === 'done' && t.automationFTE > 0)
          .reduce((s: number, t: any) => s + (t.automationFTE || 0), 0);
        setTotalDoneHours(doneHours);
      })
      .catch(() => {});

    api.get('/kpis')
      .then((res) => {
        const d = res.data;
        setCodeKpis({
          linesOfCode: d.linesOfCode || 0,
          pages: d.pages || 0,
          endpoints: d.endpoints || 0,
          commits: d.commits || 0,
        });
        if (d.codingHours) setCodingHoursFromGit(d.codingHours);
      })
      .catch(() => {});

    refreshRegistryMaps();
  }, []);

  const refreshRegistryMaps = () => {
    try {
      const list = getSubAppRegistry();
      const sMap: Record<string, string> = {};
      const aMap: Record<string, string> = {};
      const dMap: Record<string, string> = {};
      list.forEach(e => {
        if (e.stream && e.streamOwner) sMap[e.stream] = e.streamOwner;
        if (e.app && e.owner) {
          aMap[e.app] = e.owner;
          const variants = [
            e.app.replace(/-/g, ' – '),
            e.app.replace(/–/g, '-'),
            e.app.replace(/[-–]/g, ' '),
          ];
          variants.forEach(v => { aMap[v] = e.owner; });
        }
        if (e.app && e.deadlineTarget) {
          dMap[e.app] = e.deadlineTarget;
          const variants = [
            e.app.replace(/-/g, ' – '),
            e.app.replace(/–/g, '-'),
            e.app.replace(/[-–]/g, ' '),
          ];
          variants.forEach(v => { dMap[v] = e.deadlineTarget!; });
        }
      });
      setStreamOwners(sMap);
      setSubAppOwners(aMap);
      setSubAppDeadlines(dMap);
    } catch {}
  };


  const findOwner = (label: string): string => {
    if (subAppOwners[label]) return subAppOwners[label];
    const norm = (s: string) => s.toLowerCase().replace(/[-–—\s]+/g, '');
    const normLabel = norm(label);
    for (const [key, val] of Object.entries(subAppOwners)) {
      if (norm(key) === normLabel) return val;
    }
    return '';
  };

  const findDeadline = (label: string): string => {
    if (subAppDeadlines[label]) return subAppDeadlines[label];
    const norm = (s: string) => s.toLowerCase().replace(/[-–—\s]+/g, '');
    const normLabel = norm(label);
    for (const [key, val] of Object.entries(subAppDeadlines)) {
      if (norm(key) === normLabel) return val;
    }
    return '';
  };

  const formatDeadlineDate = (isoDate: string): string => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const hoursSavedPerMonth = Math.round(totalDoneHours * 10) / 10;

  const normKey = (s: string) => s.toLowerCase().replace(/[-–—\s]+/g, '');
  const getStreamHours = (proc: ProcessRow) => {
    const stepLabels = proc.steps.map(s => normKey(s.label));
    const matched = allTickets.filter(t => {
      const tApp = normKey(t.app);
      return stepLabels.some(sl => sl === tApp || sl.includes(tApp) || tApp.includes(sl));
    });
    const done = matched.filter(t => t.status === 'done').reduce((s, t) => s + t.automationFTE, 0);
    const total = matched.reduce((s, t) => s + t.automationFTE, 0);
    return { done: Math.round(done * 10) / 10, total: Math.round(total * 10) / 10 };
  };
  const peaktimeHours = useMemo(() => {
    const doneTickets = allTickets.filter(t => t.status === 'done' && t.automationFTE > 0);
    const total = doneTickets.reduce((s, t) => {
      const pct = t.peakPercent > 0 ? t.peakPercent / 100 : 0;
      return s + (t.automationFTE * pct);
    }, 0);
    return Math.round(total * 10) / 10;
  }, [allTickets]);

  const leaderboardData: LeaderboardEntry[] = useMemo(() => {
    const reg = getSubAppRegistry();
    const members = loadTeamMembers();
    const nameSet = new Set<string>();
    reg.forEach(r => { if (r.owner) nameSet.add(resolveAlias(r.owner)); if (r.streamOwner) nameSet.add(resolveAlias(r.streamOwner)); });
    members.forEach(m => nameSet.add(resolveAlias(m.name)));
    allTickets.forEach(t => { if (t.assignee) nameSet.add(resolveAlias(t.assignee)); });

    const nameRoleMap: Record<string, string> = {};
    members.forEach(m => { nameRoleMap[m.name] = m.role; });
    reg.forEach(r => {
      if (r.owner && !nameRoleMap[r.owner]) nameRoleMap[r.owner] = r.app;
      if (r.streamOwner && !nameRoleMap[r.streamOwner]) nameRoleMap[r.streamOwner] = r.stream + ' (Stream)';
    });

    const hoursByPerson: Record<string, number> = {};
    allTickets.forEach(t => {
      if (t.assignee && t.status === 'done' && t.automationFTE > 0) {
        const resolved = resolveAlias(t.assignee);
        hoursByPerson[resolved] = (hoursByPerson[resolved] || 0) + t.automationFTE;
      }
    });

    return Array.from(nameSet)
      .map(name => ({
        name,
        initials: makeInitials(name),
        role: nameRoleMap[name] || '',
        hoursSaved: Math.round((hoursByPerson[name] || 0) * 10) / 10,
      }))
      .sort((a, b) => b.hoursSaved - a.hoursSaved);
  }, [allTickets]);

  const maxLeaderboardHours = useMemo(() => {
    if (leaderboardData.length === 0) return 1;
    return Math.max(1, ...leaderboardData.map(e => e.hoursSaved));
  }, [leaderboardData]);

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
    const streamTitle = newTitle.trim();
    const stepDefs = Array.from({ length: newStepCount }, (_, i) => ({
      ...makeDefaultStep(i),
      label: newStepLabels[i]?.trim() || `Step ${i + 1}`,
    }));
    const newProc: ProcessRow = { title: streamTitle, progress: 0, steps: stepDefs };
    setProcesses(prev => [...prev, newProc]);
    syncProcessToRegistry(streamTitle, stepDefs);
    refreshRegistryMaps();
    setShowAddModal(false);
  };

  const removeProcess = (title: string) => {
    setProcesses(prev => prev.filter(p => p.title !== title));
    try {
      const registry = getSubAppRegistry();
      saveRegistry(registry.filter((r: any) => r.stream !== title));
    } catch { /* ignore */ }
    refreshRegistryMaps();
  };

  const addStepToProcess = (title: string) => {
    setProcesses(prev => prev.map(p => {
      if (p.title !== title) return p;
      const newStep = makeDefaultStep(p.steps.length);
      const updatedSteps = [...p.steps, newStep];
      syncProcessToRegistry(title, updatedSteps);
      return { ...p, steps: updatedSteps };
    }));
    refreshRegistryMaps();
  };

  const removeStepFromProcess = (title: string, stepIdx: number) => {
    setProcesses(prev => prev.map(p => {
      if (p.title !== title || p.steps.length <= 1) return p;
      const removedLabel = p.steps[stepIdx].label;
      const updatedSteps = p.steps.filter((_, i) => i !== stepIdx);
      try {
        const registry = getSubAppRegistry();
        saveRegistry(registry.filter((r: any) => !(r.stream === title && r.app === removedLabel)));
      } catch { /* ignore */ }
      return { ...p, steps: updatedSteps };
    }));
    refreshRegistryMaps();
  };

  const renameStepInProcess = (title: string, stepIdx: number, field: 'label' | 'desc', value: string) => {
    setProcesses(prev => prev.map(p => {
      if (p.title !== title) return p;
      const oldLabel = p.steps[stepIdx].label;
      const steps = p.steps.map((s, i) => i === stepIdx ? { ...s, [field]: value } : s);

      if (field === 'label' && value !== oldLabel) {
        try {
          const registry = getSubAppRegistry();
          const updated = registry.map((r: any) =>
            r.stream === title && r.app === oldLabel ? { ...r, app: value } : r
          );
          saveRegistry(updated);
        } catch { /* ignore */ }
        refreshRegistryMaps();
      }

      if (field === 'desc') {
        try {
          const registry = getSubAppRegistry();
          const stepLabel = p.steps[stepIdx].label;
          const updated = registry.map((r: any) =>
            r.stream === title && r.app === stepLabel ? { ...r, owner: value } : r
          );
          saveRegistry(updated);
        } catch { /* ignore */ }
        refreshRegistryMaps();
      }

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
      syncProcessToRegistry(procTitle, steps);
      return { ...p, steps };
    }));
    setDragOverTarget(null);
  };

  const handleDragEnd = () => {
    dragProcRef.current = null;
    dragIdxRef.current = -1;
    setDragOverTarget(null);
  };

  const streamDragIdx = useRef<number>(-1);
  const [streamDragOver, setStreamDragOver] = useState<number>(-1);

  const handleStreamDragStart = (idx: number) => {
    streamDragIdx.current = idx;
  };

  const handleStreamDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (streamDragIdx.current >= 0 && streamDragIdx.current !== idx) {
      setStreamDragOver(idx);
    }
  };

  const handleStreamDrop = (dropIdx: number) => {
    const fromIdx = streamDragIdx.current;
    if (fromIdx < 0 || fromIdx === dropIdx) { setStreamDragOver(-1); return; }
    setProcesses(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(dropIdx, 0, moved);
      saveStreamOrder(next.map(p => p.title));
      return next;
    });
    setStreamDragOver(-1);
  };

  const handleStreamDragEnd = () => {
    streamDragIdx.current = -1;
    setStreamDragOver(-1);
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
          <FeedbackLink to="/coding-team">Coding Team</FeedbackLink>
          <FeedbackLink to="/api-management">API, App, DB Management</FeedbackLink>
          <FeedbackLink to="/collaboration-model">Collaboration Model</FeedbackLink>
          <FeedbackLink to="/feedback">Features &amp; Bugs</FeedbackLink>
          <HeaderText>You rock today!</HeaderText>
        </HeaderRight>
      </Header>

      <GuidanceStrip>
        <GuidanceItem>1. If you can explain it, you can vibe-code it.</GuidanceItem>
        <GuidanceItem>2. Focus on features with impact.</GuidanceItem>
        <GuidanceItem>3. Plan before build.</GuidanceItem>
        <GuidanceLink to="/collaboration-model">4. See Further Guidance &rarr;</GuidanceLink>
      </GuidanceStrip>

      <SectionToggle onClick={() => setKpiOpen(p => !p)}>
        <SectionToggleArrow $open={kpiOpen}>▶</SectionToggleArrow>
        <SectionToggleTitle>KPIs &amp; Metrics</SectionToggleTitle>
      </SectionToggle>
      {kpiOpen && (
        <KPIStrip>
          <KPICard>
            <KPIValue>{hoursSavedPerMonth.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h</KPIValue>
            <KPILabel>Hours Saved / Month</KPILabel>
            <KPISub>from {ticketStats.done} completed ticket{ticketStats.done !== 1 ? 's' : ''}</KPISub>
          </KPICard>
          <KPICard>
            <KPIValue>{peaktimeHours.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h</KPIValue>
            <KPILabel>hereof Acc. Peaktime Hours (5th-15th)</KPILabel>
          </KPICard>
          <KPICard>
            <KPIValue>&mdash;</KPIValue>
            <KPILabel>Token Costs</KPILabel>
            <KPISub>all users &middot; coming soon</KPISub>
          </KPICard>
          <KPICard>
            <KPIValue>{codingHoursFromGit > 0 ? Math.round(codingHoursFromGit).toLocaleString('de-DE') + ' h' : '—'}</KPIValue>
            <KPILabel>Hours Spent Coding</KPILabel>
            <KPISub>{codingHoursFromGit > 0 ? `from ${codeKpis.commits} git commits` : 'based on git activity'}</KPISub>
          </KPICard>
          <KPICard>
            <KPIValue>{ticketStats.total}</KPIValue>
            <KPILabel>Features</KPILabel>
            <KPISub style={{ fontSize: 9, lineHeight: 1.5 }}>
              {ticketStats.done > 0 && <span style={{ color: theme.colors.success }}>✓ {ticketStats.done} Done</span>}
              {ticketStats.in_progress > 0 && <span> · {ticketStats.in_progress} WIP</span>}
              {ticketStats.open > 0 && <span> · {ticketStats.open} Open</span>}
              {ticketStats.review > 0 && <span> · {ticketStats.review} Review</span>}
              {ticketStats.testing > 0 && <span> · {ticketStats.testing} Test</span>}
            </KPISub>
          </KPICard>
          <KPICard>
            <KPIValue>{codeKpis.linesOfCode.toLocaleString('de-DE')}</KPIValue>
            <KPILabel>Lines of Code</KPILabel>
            <KPISub>Front/Backend, {Math.round(codeKpis.linesOfCode / 30 / 8).toLocaleString('de-DE')} Dev Mandays</KPISub>
          </KPICard>
          <KPICard>
            <KPIValue>{codeKpis.pages}</KPIValue>
            <KPILabel>Pages</KPILabel>
            <KPISub>across all Sub-Apps</KPISub>
          </KPICard>
          <KPICard>
            <KPIValue>{codeKpis.endpoints}</KPIValue>
            <KPILabel>API Endpoints</KPILabel>
            <KPISub>REST &middot; Active</KPISub>
          </KPICard>
          <KPICard>
            <KPIValue>{codeKpis.commits}</KPIValue>
            <KPILabel>Git Commits</KPILabel>
            <KPISub>on main branch</KPISub>
          </KPICard>
        </KPIStrip>
      )}

      <SectionToggle onClick={() => setStreamsOpen(p => !p)} style={{ paddingTop: 12 }}>
        <SectionToggleArrow $open={streamsOpen}>▶</SectionToggleArrow>
        <SectionToggleTitle>Streams &amp; Sub-Apps</SectionToggleTitle>
      </SectionToggle>
      {streamsOpen && <ProcessContainer style={{ paddingTop: 12 }}>
        {processes.map((proc, procIdx) => (
          <div
            key={proc.title}
            style={{
              marginBottom: 20,
              borderLeft: streamDragOver === procIdx ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
              paddingLeft: 8,
              transition: 'border-color 0.15s',
            }}
            draggable
            onDragStart={e => {
              if ((e.target as HTMLElement).closest('[data-step-drag]')) { e.preventDefault(); return; }
              handleStreamDragStart(procIdx);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={e => handleStreamDragOver(e, procIdx)}
            onDrop={() => handleStreamDrop(procIdx)}
            onDragEnd={handleStreamDragEnd}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ cursor: 'grab', fontSize: 16, opacity: 0.4, userSelect: 'none' }} title="Drag to reorder stream">☰</span>
              <span
                onClick={() => setCollapsedStreams(prev => { const n = new Set(prev); if (n.has(proc.title)) n.delete(proc.title); else n.add(proc.title); return n; })}
                style={{ cursor: 'pointer', fontSize: 11, opacity: 0.5, userSelect: 'none', transition: 'transform 0.2s', display: 'inline-block', transform: collapsedStreams.has(proc.title) ? 'rotate(0deg)' : 'rotate(90deg)' }}
              >▶</span>
              <ProcessTitle
                onClick={() => setCollapsedStreams(prev => { const n = new Set(prev); if (n.has(proc.title)) n.delete(proc.title); else n.add(proc.title); return n; })}
                style={{ cursor: 'pointer' }}
              >{proc.title}</ProcessTitle>
              {streamOwners[proc.title] && (
                <span style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: 600, background: '#f0f0f0', padding: '2px 10px', borderRadius: 10 }}>
                  Stream Owner: {streamOwners[proc.title]}
                </span>
              )}
              {!collapsedStreams.has(proc.title) && (
                <AddStepBtn onClick={() => addStepToProcess(proc.title)}>+ Add Step</AddStepBtn>
              )}
              {!collapsedStreams.has(proc.title) && !['Franchise Controlling'].includes(proc.title) && (
                <RemoveBtn onClick={() => removeProcess(proc.title)}>Remove</RemoveBtn>
              )}
            </div>
            {!collapsedStreams.has(proc.title) && <FlowRow>
              {proc.steps.map((step, i) => (
                <StepWrapper
                  key={`${proc.title}-${i}`}
                  data-step-drag="true"
                  draggable
                  onDragStart={e => { e.stopPropagation(); handleDragStart(proc.title, i); }}
                  onDragOver={e => handleDragOver(e, proc.title, i)}
                  onDrop={() => handleDrop(proc.title, i)}
                  onDragEnd={handleDragEnd}
                >
                  <StepCard
                    $active={step.active}
                    $clickable={!!(step.path || getSubAppPath(step.label))}
                    $idx={i}
                    $dragOver={dragOverTarget?.proc === proc.title && dragOverTarget.idx === i}
                    onClick={() => { const p = step.path || getSubAppPath(step.label); if (p) navigate(p.includes('/sub-app/') ? p + '/feature-requests' : p); }}
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
                      <select
                        autoFocus
                        value={editingValue}
                        onChange={e => { setEditingValue(e.target.value); }}
                        onBlur={commitEdit}
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 10, padding: '2px 4px', borderRadius: 4, border: `1px solid ${theme.colors.primary}`, maxWidth: 120 }}
                      >
                        <option value="">– Select –</option>
                        {teamNames.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : (
                      <StepDesc $active={step.active} onDoubleClick={e => { e.stopPropagation(); startEdit(proc.title, i, 'desc', findOwner(step.label) || step.desc); }} style={{ cursor: 'text' }} title="Double-click to change owner">{findOwner(step.label) || step.desc}</StepDesc>
                    )}
                    <StepBadge $color={step.badgeColor}>{step.badge}</StepBadge>
                    {(findDeadline(step.label) || step.deadline) && (
                      <StepDeadline $active={step.active}>
                        Deadline: {findDeadline(step.label) ? formatDeadlineDate(findDeadline(step.label)) : step.deadline}
                      </StepDeadline>
                    )}
                  </StepCard>
                  {proc.steps.length > 1 && (
                    <RemoveStepBtn onClick={() => removeStepFromProcess(proc.title, i)} title="Delete step">−</RemoveStepBtn>
                  )}
                </StepWrapper>
              ))}
            </FlowRow>}
            {!collapsedStreams.has(proc.title) && (() => {
              const sh = getStreamHours(proc);
              const pct = HOURS_SAVED_MAX > 0 ? Math.min((sh.done / HOURS_SAVED_MAX) * 100, 100) : 0;
              return (
                <ProgressWrapper>
                  {hoursMilestones.map((m, mi) => (
                    <TargetMarker key={`${m.label}-${mi}`} $pct={m.pct}>
                      <TargetLabel $highlight={m.highlight}>{m.label}</TargetLabel>
                      <TargetLine $highlight={m.highlight} />
                    </TargetMarker>
                  ))}
                  <ProgressBarOuter>
                    <ProgressBarInner $pct={pct} />
                    <ProgressLabel>{sh.done.toFixed(1)}h saved{sh.total > sh.done ? ` (${sh.total.toFixed(1)}h planned)` : ''}</ProgressLabel>
                  </ProgressBarOuter>
                </ProgressWrapper>
              );
            })()}
          </div>
        ))}

        <AddProcessBtn onClick={openAddModal}>
          + Add Stream
        </AddProcessBtn>
      </ProcessContainer>}

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
                Add Stream
              </ModalBtn>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}

      <SectionToggle onClick={() => setLeaderboardOpen(p => !p)}>
        <SectionToggleArrow $open={leaderboardOpen}>▶</SectionToggleArrow>
        <SectionToggleTitle>🏆 Automation Leaderboard</SectionToggleTitle>
      </SectionToggle>
      {leaderboardOpen && (
        <LeaderboardSection>
          <LeaderboardGrid>
            {leaderboardData.map((person, idx) => (
              <PersonCard key={person.name} $rank={idx + 1}>
                <RankBadge $rank={idx + 1}>{idx + 1}</RankBadge>
                <PersonAvatar>{person.initials}</PersonAvatar>
                <PersonName>{person.name}</PersonName>
                <PersonRole>{person.role}</PersonRole>
                <ScoreBar>
                  <ScoreFill $pct={maxLeaderboardHours > 0 ? (person.hoursSaved / maxLeaderboardHours) * 100 : 0} />
                </ScoreBar>
                <ScoreLabel>{person.hoursSaved.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h</ScoreLabel>
                <ScoreSubtext>Hours Saved</ScoreSubtext>
              </PersonCard>
            ))}
          </LeaderboardGrid>
        </LeaderboardSection>
      )}
    </Page>
  );
}
