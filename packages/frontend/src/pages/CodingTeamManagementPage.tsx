import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { getSubAppRegistry, getSortedStreams, SubAppOwnersTab } from './ApiManagementPage';

const KNOWN_MEMBERS = [
  'Henning Seidel', 'Inês Boavida Couto', 'Herbert Krenn',
  'Max Ammann', 'Torsten Hinz', 'Matthias Dietrich',
];

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
const TEAM_MEMBERS_KEY = 'teamMembers_v2';

interface TeamMember { name: string; role: string; stream: string; }

let teamMembersCache: TeamMember[] | null = null;

export async function fetchTeamMembers(): Promise<void> {
  try {
    const res = await api.get<TeamMember[]>('/team-members');
    const apiList = Array.isArray(res.data) ? res.data.map((m: any) => ({ name: (m.name || '').trim(), role: m.role || '', stream: m.stream || '' })).filter((m) => m.name) : [];
    const apiNames = new Set(apiList.map((m) => m.name));

    // Lokale Einträge (localStorage), die in der API fehlen, in die DB übernehmen
    try {
      const raw = localStorage.getItem(TEAM_MEMBERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const localList = parsed.map((m: any) => ({ name: (m.name || '').trim(), role: m.role || '', stream: m.stream || '' })).filter((m) => m.name);
          let merged = [...apiList];
          let added = false;
          localList.forEach((m) => {
            if (!apiNames.has(m.name)) {
              merged.push(m);
              apiNames.add(m.name);
              added = true;
            }
          });
          if (added) {
            merged = dedupeMembers(merged);
            await api.put('/team-members', merged);
            const r2 = await api.get<TeamMember[]>('/team-members');
            teamMembersCache = Array.isArray(r2.data) ? r2.data.map((x: any) => ({ name: x.name || '', role: x.role || '', stream: x.stream || '' })) : merged;
            localStorage.removeItem(TEAM_MEMBERS_KEY);
            return;
          }
        }
      }
    } catch (_) { /* ignore */ }

    if (apiList.length > 0) {
      teamMembersCache = dedupeMembers(apiList);
    }
  } catch (_) { /* ignore */ }
  // Wenn API leer war: Migration nur aus localStorage
  try {
    const raw = localStorage.getItem(TEAM_MEMBERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const mapped = parsed.map((m: any) => ({ name: m.name || '', role: m.role || '', stream: m.stream || '' }));
        const list = dedupeMembers(mapped);
        await api.put('/team-members', list);
        teamMembersCache = list;
      }
    }
  } catch (_) { /* ignore */ }
}

function resolveAlias(name: string): string { return NAME_ALIASES[name] || name; }

function dedupeMembers(members: TeamMember[]): TeamMember[] {
  const seen = new Map<string, TeamMember>();
  members.forEach(m => {
    const canonical = resolveAlias(m.name);
    if (!seen.has(canonical)) {
      seen.set(canonical, { ...m, name: canonical });
    } else {
      const existing = seen.get(canonical)!;
      if (!existing.role && m.role) existing.role = m.role;
      if (!existing.stream && m.stream) existing.stream = m.stream;
    }
  });
  return Array.from(seen.values());
}

function loadTeamMembers(): TeamMember[] {
  if (teamMembersCache && teamMembersCache.length > 0) return teamMembersCache;
  try {
    const raw = localStorage.getItem(TEAM_MEMBERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const mapped = parsed.map((m: any) => ({ name: m.name || '', role: m.role || '', stream: m.stream || '' }));
        return dedupeMembers(mapped);
      }
    }
  } catch {}
  const reg = getSubAppRegistry();
  const roleMap: Record<string, string> = {};
  const streamMap: Record<string, string> = {};
  reg.forEach(r => {
    if (r.owner && !roleMap[r.owner]) { roleMap[r.owner] = r.app; streamMap[r.owner] = r.stream; }
    if (r.streamOwner && !roleMap[r.streamOwner]) { roleMap[r.streamOwner] = r.stream + ' (Stream Owner)'; streamMap[r.streamOwner] = r.stream; }
  });
  return KNOWN_MEMBERS.map(n => ({ name: n, role: roleMap[n] || '', stream: streamMap[n] || '' }));
}

function saveTeamMembers(m: TeamMember[]) {
  api
    .put('/team-members', m)
    .then((res) => { teamMembersCache = res.data; })
    .catch((err) => {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg = typeof data === 'object' && data?.error ? data.error : (data || err.message || String(err));
      console.error('Team-Mitglieder speichern fehlgeschlagen:', status, data || err);
      alert(`Speichern fehlgeschlagen (${status || 'Netzwerk?'}): ${msg}`);
    });
}

export function getTeamMemberNames(): string[] {
  const members = loadTeamMembers();
  const reg = getSubAppRegistry();
  const names = new Set<string>();
  members.forEach(m => names.add(resolveAlias(m.name)));
  KNOWN_MEMBERS.forEach(n => names.add(n));
  reg.forEach(r => {
    if (r.owner) names.add(resolveAlias(r.owner));
    if (r.streamOwner) names.add(resolveAlias(r.streamOwner));
  });
  return Array.from(names).sort();
}

export { NAME_ALIASES, resolveAlias };

const Page = styled.div`min-height:100vh;background:${theme.colors.background};`;
const Header = styled.header`background:${theme.colors.secondary};color:white;padding:0 32px;height:64px;display:flex;align-items:center;gap:16px;`;
const LogoImg = styled.img`height:36px;border-radius:6px;`;
const BackLink = styled(Link)`color:white;font-size:15px;padding:6px 10px;border-radius:${theme.borderRadius};&:hover{color:${theme.colors.primary};background:rgba(255,95,0,0.08);}`;
const HeaderTitle = styled.span`font-size:15px;font-weight:700;color:white;`;
const Content = styled.div`max-width:1400px;margin:0 auto;padding:32px;`;
const PageTitle = styled.h1`font-size:24px;font-weight:800;color:${theme.colors.textPrimary};margin-bottom:8px;`;
const PageSub = styled.p`font-size:13px;color:${theme.colors.textSecondary};margin-bottom:24px;`;

const TabRow = styled.div`display:flex;gap:0;margin-bottom:24px;border-bottom:2px solid ${theme.colors.border};`;
const Tab = styled.button<{ $active: boolean }>`
  padding:10px 20px;font-size:13px;font-weight:700;border:none;cursor:pointer;
  background:${p => p.$active ? theme.colors.surface : 'transparent'};
  color:${p => p.$active ? theme.colors.primary : theme.colors.textSecondary};
  border-bottom:${p => p.$active ? `3px solid ${theme.colors.primary}` : '3px solid transparent'};
  margin-bottom:-2px;transition:all 0.15s;&:hover{color:${theme.colors.primary};}
`;

const Card = styled.div`background:${theme.colors.surface};border-radius:12px;box-shadow:${theme.shadow};padding:20px 24px;margin-bottom:20px;`;

const Badge = styled.span<{ $color: string }>`
  font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;
  background:${p => p.$color};color:white;text-transform:uppercase;letter-spacing:0.3px;white-space:nowrap;
`;

const TicketRow = styled.div<{ $dragging?: boolean }>`
  display:flex;align-items:center;gap:12px;padding:10px 14px;
  border:1px solid ${theme.colors.border};border-radius:8px;margin-bottom:6px;
  background:${p => p.$dragging ? '#fff3e8' : theme.colors.surface};
  transition:all 0.15s;cursor:grab;
  &:hover{border-color:${theme.colors.primary};box-shadow:0 2px 8px rgba(0,0,0,0.06);}
`;

const PrioNum = styled.div<{ $top: boolean }>`
  width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:800;flex-shrink:0;
  background:${p => p.$top ? theme.colors.primary : '#eee'};
  color:${p => p.$top ? 'white' : theme.colors.textSecondary};
`;

const TicketTitle = styled.div`flex:1;font-size:13px;font-weight:600;color:${theme.colors.textPrimary};`;
const TicketApp = styled.span`font-size:11px;color:${theme.colors.textSecondary};font-weight:500;`;
const TicketHours = styled.span`font-size:12px;font-weight:700;color:${theme.colors.primary};min-width:50px;text-align:right;`;

const StatusSelect = styled.select`
  font-size:11px;font-weight:600;padding:3px 6px;border-radius:6px;
  border:1px solid ${theme.colors.border};cursor:pointer;
  &:focus{outline:none;border-color:${theme.colors.primary};}
`;

const PersonCard = styled.div`
  background:${theme.colors.surface};border-radius:12px;box-shadow:${theme.shadow};
  padding:20px 24px;margin-bottom:20px;border-left:4px solid ${theme.colors.primary};
`;
const PersonName = styled.div`font-size:16px;font-weight:800;color:${theme.colors.textPrimary};margin-bottom:4px;`;
const PersonStats = styled.div`font-size:11px;color:${theme.colors.textSecondary};margin-bottom:12px;display:flex;gap:16px;`;

const SummaryRow = styled.div`display:flex;gap:16px;margin-bottom:24px;`;
const SummaryCard = styled.div<{ $color: string }>`
  flex:1;background:${theme.colors.surface};border-radius:12px;box-shadow:${theme.shadow};
  padding:16px 20px;border-top:4px solid ${p => p.$color};text-align:center;
`;
const SummaryValue = styled.div`font-size:24px;font-weight:800;color:${theme.colors.textPrimary};`;
const SummaryLabel = styled.div`font-size:11px;color:${theme.colors.textSecondary};margin-top:4px;`;

const EmptyState = styled.div`text-align:center;padding:40px;color:${theme.colors.textLight};font-size:14px;`;

const DetailOverlay = styled.div`
  position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);
  z-index:10000;display:flex;align-items:center;justify-content:center;
`;
const DetailPanel = styled.div`
  background:${theme.colors.surface};border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.2);
  padding:28px 32px;width:600px;max-width:92vw;max-height:85vh;overflow-y:auto;position:relative;
`;
const DetailClose = styled.button`
  position:absolute;top:14px;right:18px;background:none;border:none;font-size:22px;
  cursor:pointer;color:${theme.colors.textSecondary};&:hover{color:${theme.colors.textPrimary};}
`;
const DetailTitle = styled.h2`font-size:18px;font-weight:800;color:${theme.colors.textPrimary};margin:0 0 16px 0;padding-right:30px;`;
const DetailGrid = styled.div`display:grid;grid-template-columns:140px 1fr;gap:8px 16px;font-size:13px;`;
const DetailLabel = styled.div`font-weight:700;color:${theme.colors.textSecondary};`;
const DetailValue = styled.div`color:${theme.colors.textPrimary};`;
const DetailDesc = styled.div`
  margin-top:16px;padding:14px 16px;background:${theme.colors.background};border-radius:8px;
  font-size:13px;color:${theme.colors.textPrimary};line-height:1.6;white-space:pre-wrap;
`;

const STATUSES = ['open', 'in_progress', 'review', 'testing', 'done'] as const;
const STATUS_LABELS: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', review: 'Review', testing: 'Testing', done: 'Done',
};
const STATUS_COLORS: Record<string, string> = {
  open: '#6c757d', in_progress: '#ff5f00', review: '#6f42c1', testing: '#0d6efd', done: '#28a745',
};

interface Ticket {
  id: number; app: string; title: string; description: string | null;
  automationFTE: number; status: string; assignee: string | null;
  deadlineDate: string | null; deadlineWeek: string | null; type: string;
  codingEffort: number; peakPercent: number; author: string | null;
  priority: number;
}

function normStr(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, '');
}

function TicketDetail({ ticket, onClose, onStatusChange }: {
  ticket: Ticket; onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
}) {
  return (
    <DetailOverlay onClick={onClose}>
      <DetailPanel onClick={e => e.stopPropagation()}>
        <DetailClose onClick={onClose}>&times;</DetailClose>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Badge $color={ticket.type === 'bug' ? theme.colors.danger : '#6f42c1'}>
            {ticket.type === 'bug' ? 'Bug' : 'Feature'}
          </Badge>
          <Badge $color={STATUS_COLORS[ticket.status] || '#999'}>
            {STATUS_LABELS[ticket.status] || ticket.status}
          </Badge>
          {ticket.priority > 0 && (
            <Badge $color={theme.colors.primary}>Priority #{ticket.priority}</Badge>
          )}
        </div>
        <DetailTitle>{ticket.title}</DetailTitle>
        <DetailGrid>
          <DetailLabel>ID</DetailLabel>
          <DetailValue>#{ticket.id}</DetailValue>

          <DetailLabel>Sub-App</DetailLabel>
          <DetailValue>{ticket.app || '–'}</DetailValue>

          <DetailLabel>Assignee</DetailLabel>
          <DetailValue>{ticket.assignee || 'Unassigned'}</DetailValue>

          <DetailLabel>Author</DetailLabel>
          <DetailValue>{ticket.author || '–'}</DetailValue>

          <DetailLabel>Priority</DetailLabel>
          <DetailValue style={{ fontWeight: 700 }}>
            {ticket.priority > 0 ? `#${ticket.priority}` : 'Not set'}
          </DetailValue>

          <DetailLabel>Status</DetailLabel>
          <DetailValue>
            <StatusSelect
              value={ticket.status}
              onChange={e => onStatusChange(ticket.id, e.target.value)}
              style={{ color: STATUS_COLORS[ticket.status], fontSize: 13 }}
            >
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </StatusSelect>
          </DetailValue>

          <DetailLabel>Hours Saved / Month</DetailLabel>
          <DetailValue style={{ fontWeight: 700, color: theme.colors.primary }}>
            {ticket.automationFTE > 0 ? `${ticket.automationFTE.toFixed(1)} h` : '–'}
          </DetailValue>

          <DetailLabel>Coding Effort</DetailLabel>
          <DetailValue>{ticket.codingEffort > 0 ? `${ticket.codingEffort.toFixed(1)} h` : '–'}</DetailValue>

          <DetailLabel>Peak %</DetailLabel>
          <DetailValue>{ticket.peakPercent > 0 ? `${ticket.peakPercent.toFixed(0)} %` : '–'}</DetailValue>

          <DetailLabel>Deadline</DetailLabel>
          <DetailValue>
            {ticket.deadlineDate ? new Date(ticket.deadlineDate).toLocaleDateString('de-DE') : '–'}
          </DetailValue>

          <DetailLabel>Start Week</DetailLabel>
          <DetailValue>{ticket.deadlineWeek || '–'}</DetailValue>
        </DetailGrid>

        {ticket.description && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.colors.textSecondary, marginTop: 18, marginBottom: 4 }}>
              Description
            </div>
            <DetailDesc>{ticket.description}</DetailDesc>
          </>
        )}
      </DetailPanel>
    </DetailOverlay>
  );
}

export default function CodingTeamManagementPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'priority' | 'team' | 'manage' | 'owners'>('priority');
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const assigneeFixRan = useRef(false);
  const [managedMembers, setManagedMembers] = useState<TeamMember[]>(loadTeamMembers);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStream, setEditStream] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newStream, setNewStream] = useState('');

  const fetchManagedMembers = useCallback(() => {
    api.get<TeamMember[]>('/team-members').then((res) => {
      setManagedMembers(Array.isArray(res.data) ? res.data.map((m: any) => ({ name: m.name || '', role: m.role || '', stream: m.stream || '' })) : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'manage') fetchManagedMembers();
  }, [tab, fetchManagedMembers]);

  // Beim Zurückwechseln ins Fenster: Team-Liste neu laden, damit Änderungen aus anderem Browser sichtbar werden
  useEffect(() => {
    const onFocus = () => { if (tab === 'manage') fetchManagedMembers(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [tab, fetchManagedMembers]);

  const registry = useMemo(() => getSubAppRegistry(), []);

  const streamNames = useMemo(() => {
    return getSortedStreams();
  }, [registry]);

  const appOwnerMap = useMemo(() => {
    const map: Record<string, string> = {};
    registry.forEach(r => {
      if (r.owner) {
        map[normStr(r.app)] = r.owner;
      }
    });
    return map;
  }, [registry]);

  const appStreamOwnerMap = useMemo(() => {
    const map: Record<string, string> = {};
    registry.forEach(r => {
      if (r.streamOwner) {
        map[normStr(r.app)] = r.streamOwner;
      }
    });
    return map;
  }, [registry]);

  function getDefaultAssignee(appName: string): string | null {
    const norm = normStr(appName);
    if (appOwnerMap[norm]) return appOwnerMap[norm];
    for (const [key, owner] of Object.entries(appOwnerMap)) {
      if (norm.includes(key) || key.includes(norm)) return owner;
    }
    if (appStreamOwnerMap[norm]) return appStreamOwnerMap[norm];
    for (const [key, owner] of Object.entries(appStreamOwnerMap)) {
      if (norm.includes(key) || key.includes(norm)) return owner;
    }
    return null;
  }

  const loadTickets = useCallback(async () => {
    try {
      const res = await api.get('/feedback');
      const loaded: Ticket[] = res.data.map((t: any) => ({
        id: t.id, app: t.app || '', title: t.title,
        description: t.description || null,
        automationFTE: t.automationFTE || 0, status: t.status || 'open',
        assignee: t.assignee ? resolveAlias(t.assignee) : null,
        _rawAssignee: t.assignee || null,
        deadlineDate: t.deadlineDate || null,
        deadlineWeek: t.deadlineWeek || null, type: t.type || 'feature',
        codingEffort: t.codingEffort || 0, peakPercent: t.peakPercent || 0,
        author: t.author || null, priority: t.priority || 0,
      }));
      setTickets(loaded);
      return loaded;
    } catch {}
    setLoading(false);
    return [];
  }, []);

  useEffect(() => {
    (async () => {
      const loaded = await loadTickets();
      setLoading(false);

      if (assigneeFixRan.current) return;
      assigneeFixRan.current = true;

      const bulkItems: { id: number; assignee: string }[] = [];

      loaded.forEach(t => {
        const rawAssignee = (t as any)._rawAssignee;
        if (rawAssignee && NAME_ALIASES[rawAssignee]) {
          bulkItems.push({ id: t.id, assignee: NAME_ALIASES[rawAssignee] });
        }
      });

      const toFix = loaded.filter(t => !t.assignee && t.app);
      toFix.forEach(t => {
        const defaultOwner = getDefaultAssignee(t.app);
        if (defaultOwner && !bulkItems.some(b => b.id === t.id)) {
          bulkItems.push({ id: t.id, assignee: defaultOwner });
        }
      });

      if (bulkItems.length > 0) {
        try {
          await api.patch('/feedback/bulk/assignee', { items: bulkItems });
          await loadTickets();
        } catch {}
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedByPriority = useMemo(() => {
    return [...tickets].sort((a, b) => {
      if (a.priority > 0 && b.priority > 0) return a.priority - b.priority;
      if (a.priority > 0) return -1;
      if (b.priority > 0) return 1;
      return 0;
    });
  }, [tickets]);

  const activeTickets = useMemo(() => sortedByPriority.filter(t => t.status !== 'done'), [sortedByPriority]);
  const doneTickets = useMemo(() => sortedByPriority.filter(t => t.status === 'done'), [sortedByPriority]);

  const handleDragStart = (id: number) => setDragId(id);
  const handleDragOver = (e: React.DragEvent, id: number) => { e.preventDefault(); setDragOverId(id); };

  const persistPriorities = useCallback(async (orderedTickets: Ticket[]) => {
    const items = orderedTickets.map((t, i) => ({ id: t.id, priority: i + 1 }));
    try {
      await api.patch('/feedback/bulk/priority', { items });
      setTickets(prev => {
        const map = new Map(items.map(it => [it.id, it.priority]));
        return prev.map(t => map.has(t.id) ? { ...t, priority: map.get(t.id)! } : t);
      });
    } catch {}
  }, []);

  const handleDrop = (targetId: number) => {
    if (dragId == null || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const ids = activeTickets.map(t => t.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const reordered = [...activeTickets];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    persistPriorities(reordered);
    setDragId(null);
    setDragOverId(null);
  };

  const handleDropTeam = (person: string, targetId: number) => {
    if (dragId == null || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const personActive = activeTickets.filter(t => (t.assignee || 'Unassigned') === person);
    const ids = personActive.map(t => t.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) { setDragId(null); setDragOverId(null); return; }

    const reorderedPerson = [...personActive];
    const [moved] = reorderedPerson.splice(fromIdx, 1);
    reorderedPerson.splice(toIdx, 0, moved);

    const otherActive = activeTickets.filter(t => (t.assignee || 'Unassigned') !== person);
    const allReordered = [...otherActive, ...reorderedPerson].sort((a, b) => {
      const aPrio = reorderedPerson.findIndex(x => x.id === a.id);
      const bPrio = reorderedPerson.findIndex(x => x.id === b.id);
      if (aPrio >= 0 && bPrio >= 0) return aPrio - bPrio;
      return 0;
    });

    persistPriorities(allReordered);
    setDragId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => { setDragId(null); setDragOverId(null); };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.patch(`/feedback/${id}/status`, { status });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      if (detailTicket && detailTicket.id === id) {
        setDetailTicket(prev => prev ? { ...prev, status } : null);
      }
    } catch {}
  };

  const teamMembers = useMemo(() => {
    const names = new Set<string>(KNOWN_MEMBERS);
    managedMembers.forEach(m => names.add(m.name));
    registry.forEach(r => { if (r.owner) names.add(r.owner); if (r.streamOwner) names.add(r.streamOwner); });
    tickets.forEach(t => { if (t.assignee) names.add(t.assignee); });
    return Array.from(names).sort();
  }, [registry, tickets, managedMembers]);

  const ticketsByPerson = useMemo(() => {
    const map: Record<string, Ticket[]> = {};
    teamMembers.forEach(m => { map[m] = []; });
    map['Unassigned'] = [];
    tickets.forEach(t => {
      const key = t.assignee || 'Unassigned';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    Object.keys(map).forEach(person => {
      map[person].sort((a, b) => {
        if (a.priority > 0 && b.priority > 0) return a.priority - b.priority;
        if (a.priority > 0) return -1;
        if (b.priority > 0) return 1;
        return 0;
      });
    });
    return map;
  }, [tickets, teamMembers]);

  const stats = useMemo(() => ({
    total: tickets.length,
    active: activeTickets.length,
    done: doneTickets.length,
    totalHours: tickets.reduce((s, t) => s + t.automationFTE, 0),
    members: teamMembers.length,
  }), [tickets, activeTickets, doneTickets, teamMembers]);

  const renderTicketRow = (
    t: Ticket, idx: number,
    opts: { showPrio?: boolean; draggable?: boolean; done?: boolean;
            onDrop?: (id: number) => void; }
  ) => (
    <TicketRow
      key={t.id}
      draggable={opts.draggable}
      $dragging={dragOverId === t.id}
      onDragStart={opts.draggable ? () => handleDragStart(t.id) : undefined}
      onDragOver={opts.draggable ? e => handleDragOver(e, t.id) : undefined}
      onDrop={opts.draggable && opts.onDrop ? () => opts.onDrop!(t.id) : undefined}
      onDragEnd={opts.draggable ? handleDragEnd : undefined}
      onClick={() => setDetailTicket(t)}
      style={opts.done ? { opacity: 0.55, cursor: 'pointer' } : { cursor: 'pointer' }}
    >
      {opts.showPrio && <PrioNum $top={idx < 3}>#{idx + 1}</PrioNum>}
      {opts.done && <Badge $color={theme.colors.success}>Done</Badge>}
      {!opts.done && !opts.showPrio && (
        <Badge $color={STATUS_COLORS[t.status] || '#999'}>
          {STATUS_LABELS[t.status] || t.status}
        </Badge>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <TicketTitle style={opts.done ? { textDecoration: 'line-through' } : {}}>
          {t.title}
        </TicketTitle>
        <div style={{ display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
          <TicketApp>{t.app}</TicketApp>
          {t.assignee && <span style={{ fontSize: 10, color: theme.colors.textLight }}>→ {t.assignee}</span>}
          {t.deadlineDate && (
            <span style={{ fontSize: 10, color: theme.colors.textLight }}>
              due {new Date(t.deadlineDate).toLocaleDateString('de-DE')}
            </span>
          )}
          {t.priority > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: theme.colors.primary }}>
              Prio #{t.priority}
            </span>
          )}
        </div>
      </div>
      <StatusSelect
        value={t.status}
        onChange={e => { e.stopPropagation(); handleStatusChange(t.id, e.target.value); }}
        onClick={e => e.stopPropagation()}
        style={{ color: STATUS_COLORS[t.status] || '#666' }}
      >
        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </StatusSelect>
      <TicketHours>{t.automationFTE > 0 ? `${t.automationFTE.toFixed(1)} h` : '–'}</TicketHours>
      <Badge $color={t.type === 'bug' ? theme.colors.danger : '#6f42c1'}>
        {t.type === 'bug' ? 'Bug' : 'Feature'}
      </Badge>
    </TicketRow>
  );

  return (
    <Page>
      <Header>
        <Link to="/"><LogoImg src="/sixt-logo.png" alt="SIXT" /></Link>
        <BackLink to="/">&larr;</BackLink>
        <HeaderTitle>Coding Team Management</HeaderTitle>
      </Header>

      <Content>
        <PageTitle>Coding Team Management</PageTitle>
        <PageSub>Prioritize tickets together and track individual workloads. Priority numbers are shared across both views.</PageSub>

        {loading && <p style={{ color: theme.colors.textLight }}>Loading...</p>}

        <SummaryRow>
          <SummaryCard $color={theme.colors.primary}>
            <SummaryValue>{stats.active}</SummaryValue>
            <SummaryLabel>Active Tickets</SummaryLabel>
          </SummaryCard>
          <SummaryCard $color={theme.colors.success}>
            <SummaryValue>{stats.done}</SummaryValue>
            <SummaryLabel>Done</SummaryLabel>
          </SummaryCard>
          <SummaryCard $color={theme.colors.warning}>
            <SummaryValue>{stats.totalHours.toFixed(1)} h</SummaryValue>
            <SummaryLabel>Total Hours Saved</SummaryLabel>
          </SummaryCard>
          <SummaryCard $color={theme.colors.info}>
            <SummaryValue>{stats.members}</SummaryValue>
            <SummaryLabel>Team Members</SummaryLabel>
          </SummaryCard>
        </SummaryRow>

        <TabRow>
          <Tab $active={tab === 'priority'} onClick={() => setTab('priority')}>Priority Board</Tab>
          <Tab $active={tab === 'team'} onClick={() => setTab('team')}>Team View</Tab>
          <Tab $active={tab === 'manage'} onClick={() => setTab('manage')}>Team Management</Tab>
          <Tab $active={tab === 'owners'} onClick={() => setTab('owners')}>Sub-App Owners</Tab>
        </TabRow>

        {tab === 'priority' && (
          <>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary }}>
                  Active Tickets – Drag to Prioritize
                </div>
                <div style={{ fontSize: 11, color: theme.colors.textLight }}>
                  {activeTickets.length} tickets &middot; drag &amp; drop to reorder &middot; priority saved to DB
                </div>
              </div>
              {activeTickets.length === 0 && <EmptyState>No active tickets</EmptyState>}
              {activeTickets.map((t, i) =>
                renderTicketRow(t, i, { showPrio: true, draggable: true, onDrop: handleDrop })
              )}
            </Card>

            {doneTickets.length > 0 && (
              <Card>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 12 }}>
                  Completed ({doneTickets.length})
                </div>
                {doneTickets.map((t, i) => renderTicketRow(t, i, { done: true }))}
              </Card>
            )}
          </>
        )}

        {tab === 'team' && (
          <>
            {[...teamMembers, 'Unassigned'].map(person => {
              const personTickets = ticketsByPerson[person] || [];
              if (personTickets.length === 0) return null;
              const active = personTickets.filter(t => t.status !== 'done');
              const done = personTickets.filter(t => t.status === 'done');
              const totalH = personTickets.reduce((s, t) => s + t.automationFTE, 0);
              return (
                <PersonCard key={person}>
                  <PersonName>{person}</PersonName>
                  <PersonStats>
                    <span>{personTickets.length} ticket{personTickets.length !== 1 ? 's' : ''}</span>
                    <span>{active.length} active</span>
                    <span style={{ color: theme.colors.success }}>{done.length} done</span>
                    <span style={{ color: theme.colors.primary }}>{totalH.toFixed(1)} h saved</span>
                  </PersonStats>
                  {active.length > 0 && (
                    <div style={{ fontSize: 10, color: theme.colors.textLight, marginBottom: 6 }}>
                      drag &amp; drop to prioritize
                    </div>
                  )}
                  {active.map((t, i) =>
                    renderTicketRow(t, i, {
                      showPrio: true,
                      draggable: true,
                      onDrop: (targetId) => handleDropTeam(person, targetId),
                    })
                  )}
                  {done.length > 0 && (
                    <details style={{ marginTop: 8 }}>
                      <summary style={{ fontSize: 11, color: theme.colors.textLight, cursor: 'pointer' }}>
                        {done.length} completed ticket{done.length !== 1 ? 's' : ''}
                      </summary>
                      <div style={{ marginTop: 4 }}>
                        {done.map((t, i) => renderTicketRow(t, i, { done: true }))}
                      </div>
                    </details>
                  )}
                </PersonCard>
              );
            })}
          </>
        )}

        {tab === 'manage' && (
          <Card>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 16 }}>
              Team Members
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 160px', gap: '8px 12px', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.textSecondary }}>Name</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.textSecondary }}>Role / Sub-App</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.textSecondary }}>Stream</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.textSecondary }}>Actions</div>

              {managedMembers.map((m, idx) => (
                <React.Fragment key={idx}>
                  {editIdx === idx ? (
                    <>
                      <input
                        value={editName} onChange={e => setEditName(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${theme.colors.border}`, fontSize: 13 }}
                      />
                      <input
                        value={editRole} onChange={e => setEditRole(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${theme.colors.border}`, fontSize: 13 }}
                      />
                      <select
                        value={editStream} onChange={e => setEditStream(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${theme.colors.border}`, fontSize: 13 }}
                      >
                        <option value="">– No Stream –</option>
                        {streamNames.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            if (!editName.trim()) return;
                            const updated = [...managedMembers];
                            updated[idx] = { name: editName.trim(), role: editRole.trim(), stream: editStream };
                            setManagedMembers(updated);
                            saveTeamMembers(updated);
                            setEditIdx(null);
                          }}
                          style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: theme.colors.success, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >Save</button>
                        <button
                          onClick={() => setEditIdx(null)}
                          style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${theme.colors.border}`, background: 'transparent', fontSize: 12, cursor: 'pointer' }}
                        >Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textPrimary }}>{m.name}</div>
                      <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{m.role || '–'}</div>
                      <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{m.stream || '–'}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => { setEditIdx(idx); setEditName(m.name); setEditRole(m.role); setEditStream(m.stream || ''); }}
                          style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${theme.colors.border}`, background: 'transparent', fontSize: 12, cursor: 'pointer', color: theme.colors.textPrimary }}
                        >Edit</button>
                        <button
                          onClick={() => {
                            const updated = managedMembers.filter((_, i) => i !== idx);
                            setManagedMembers(updated);
                            saveTeamMembers(updated);
                          }}
                          style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: theme.colors.danger, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >Delete</button>
                      </div>
                    </>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${theme.colors.border}`, paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 160px', gap: '8px 12px', alignItems: 'center' }}>
              <input
                value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Name"
                style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${theme.colors.border}`, fontSize: 13 }}
              />
              <input
                value={newRole} onChange={e => setNewRole(e.target.value)}
                placeholder="Role / Sub-App"
                style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${theme.colors.border}`, fontSize: 13 }}
              />
              <select
                value={newStream} onChange={e => setNewStream(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${theme.colors.border}`, fontSize: 13 }}
              >
                <option value="">– No Stream –</option>
                {streamNames.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={() => {
                  if (!newName.trim()) return;
                  const updated = [...managedMembers, { name: newName.trim(), role: newRole.trim(), stream: newStream }];
                  setManagedMembers(updated);
                  saveTeamMembers(updated);
                  setNewName('');
                  setNewRole('');
                  setNewStream('');
                }}
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: theme.colors.primary, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >+ Add Member</button>
            </div>
          </Card>
        )}

        {tab === 'owners' && <SubAppOwnersTab />}
      </Content>

      {detailTicket && (
        <TicketDetail
          ticket={detailTicket}
          onClose={() => setDetailTicket(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </Page>
  );
}
