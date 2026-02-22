import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import api from '../utils/api';
import { getSubAppRegistry } from './ApiManagementPage';
import { getTeamMemberNames } from './CodingTeamManagementPage';

interface FeedbackComment {
  id: number;
  text: string;
  author: string;
  createdAt: string;
}

interface FeedbackItem {
  id: number;
  app: string;
  author: string | null;
  type: string;
  title: string;
  description: string | null;
  notes: string | null;
  deadlineDate: string | null;
  assignee: string | null;
  automationFTE: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  comments: FeedbackComment[];
}

const STATUS_COLORS: Record<string, string> = {
  open: '#6c757d', in_progress: '#ff5f00', review: '#6f42c1', testing: '#0d6efd', done: '#28a745',
};

const Page = styled.div`padding: 8px 0;`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin-bottom: 20px;
`;

const Filters = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const Chip = styled.button<{ $active: boolean }>`
  padding: 5px 14px;
  border: 1px solid ${p => p.$active ? theme.colors.primary : theme.colors.border};
  background: ${p => p.$active ? theme.colors.primary : 'white'};
  color: ${p => p.$active ? 'white' : theme.colors.textSecondary};
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  &:hover { border-color: ${theme.colors.primary}; }
`;

const Card = styled.div<{ $status: string }>`
  background: white;
  border-radius: 10px;
  box-shadow: ${theme.shadow};
  padding: 18px 22px;
  margin-bottom: 14px;
  border-left: 4px solid ${p => STATUS_COLORS[p.$status] || '#ccc'};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

const Badge = styled.span<{ $color: string }>`
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 8px;
  color: white;
  background: ${p => p.$color};
  text-transform: uppercase;
`;

const CardTitle = styled.span<{ $done: boolean }>`
  font-size: 14px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  text-decoration: ${p => p.$done ? 'line-through' : 'none'};
  flex: 1;
`;

const Meta = styled.div`
  font-size: 11px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 6px;
`;

const Desc = styled.div`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 8px;
  line-height: 1.5;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
`;

const SmallBtn = styled.button<{ $variant?: string }>`
  padding: 4px 12px;
  border: 1px solid ${p => p.$variant === 'success' ? theme.colors.success : p.$variant === 'danger' ? theme.colors.danger : theme.colors.border};
  background: ${p => p.$variant === 'success' ? theme.colors.success : p.$variant === 'danger' ? theme.colors.danger : 'white'};
  color: ${p => p.$variant ? 'white' : theme.colors.textSecondary};
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  &:hover { filter: brightness(0.95); }
`;

const Input = styled.input`
  padding: 4px 8px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 12px;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const Select = styled.select`
  padding: 4px 8px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 12px;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const Label = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
`;

const EmptyMsg = styled.p`
  text-align: center;
  color: ${theme.colors.textSecondary};
  padding: 40px;
  font-size: 14px;
`;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE');
}

interface Props {
  appFilter: string;
}

export default function SubAppFeatureRequestsPage({ appFilter }: Props) {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const registry = useMemo(() => getSubAppRegistry(), []);
  const teamMembers = useMemo(() => getTeamMemberNames(), []);

  const defaultAssignee = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[-–—\s]+/g, '');
    const entry = registry.find(r => norm(r.app) === norm(appFilter));
    return entry?.owner || entry?.streamOwner || '';
  }, [registry, appFilter]);

  const loadItems = useCallback(async () => {
    try {
      const res = await api.get('/feedback');
      const all: FeedbackItem[] = res.data || [];
      const norm = (s: string) => s.toLowerCase().replace(/[-–—\s]+/g, '');
      const normFilter = norm(appFilter);
      const filtered = all.filter(t => {
        const tApp = norm(t.app || '');
        return tApp === normFilter || tApp.includes(normFilter) || normFilter.includes(tApp);
      });
      filtered.sort((a, b) => {
        const ap = (a as any).priority || 0;
        const bp = (b as any).priority || 0;
        if (ap > 0 && bp > 0) return ap - bp;
        if (ap > 0) return -1;
        if (bp > 0) return 1;
        return 0;
      });
      setItems(filtered);
    } catch {}
    setLoading(false);
  }, [appFilter]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleStatusChange = async (id: number, status: string) => {
    try { await api.patch(`/feedback/${id}/status`, { status }); await loadItems(); } catch {}
  };

  const handleAssigneeChange = async (item: FeedbackItem, assignee: string) => {
    try { await api.patch(`/feedback/${item.id}/assignee`, { assignee: assignee || null }); await loadItems(); } catch {}
  };

  const handleFteSave = async (item: FeedbackItem, val: number) => {
    try { await api.patch(`/feedback/${item.id}/automation-fte`, { automationFTE: val }); await loadItems(); } catch {}
  };

  const counts: Record<string, number> = {
    all: items.length,
    open: items.filter(i => i.status === 'open').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    review: items.filter(i => i.status === 'review').length,
    testing: items.filter(i => i.status === 'testing').length,
    done: items.filter(i => i.status === 'done').length,
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  if (loading) return <Page><EmptyMsg>Loading...</EmptyMsg></Page>;

  return (
    <Page>
      <Title>{appFilter} – Feature Requests ({items.length})</Title>

      <Filters>
        <Chip $active={filter === 'all'} onClick={() => setFilter('all')}>All ({counts.all})</Chip>
        <Chip $active={filter === 'open'} onClick={() => setFilter('open')}>Open ({counts.open})</Chip>
        <Chip $active={filter === 'in_progress'} onClick={() => setFilter('in_progress')}>In Progress ({counts.in_progress})</Chip>
        <Chip $active={filter === 'review'} onClick={() => setFilter('review')}>Review ({counts.review})</Chip>
        <Chip $active={filter === 'testing'} onClick={() => setFilter('testing')}>Testing ({counts.testing})</Chip>
        <Chip $active={filter === 'done'} onClick={() => setFilter('done')}>Done ({counts.done})</Chip>
      </Filters>

      {filtered.length === 0 && <EmptyMsg>No feature requests for {appFilter} yet. Create tickets in "Features &amp; Bugs" with app = "{appFilter}".</EmptyMsg>}

      {filtered.map(item => (
        <Card key={item.id} $status={item.status}>
          <CardHeader>
            <Badge $color={item.type === 'bug' ? theme.colors.danger : theme.colors.info}>{item.type}</Badge>
            <CardTitle $done={item.status === 'done'}>#{item.id} {item.title}</CardTitle>
            <Badge $color={STATUS_COLORS[item.status] || '#999'}>
              {item.status === 'in_progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Badge>
          </CardHeader>

          {item.description && <Desc>{item.description}</Desc>}
          <Meta>
            {item.author ? `By ${item.author} · ` : ''}Created: {formatDate(item.createdAt)}
            {item.deadlineDate && ` · Deadline: ${item.deadlineDate.split('T')[0].split('-').reverse().join('/')}`}
          </Meta>

          <Row>
            <Label>Hours Saved / Month:</Label>
            <Input
              type="number" step="0.5" min="0" style={{ width: 70 }}
              defaultValue={item.automationFTE}
              onBlur={e => handleFteSave(item, parseFloat(e.target.value) || 0)}
            />
            {item.automationFTE > 0 && (
              <span style={{ fontSize: 10, color: '#c44500' }}>Peak: {(item.automationFTE * 0.45).toFixed(1)} h</span>
            )}
          </Row>

          <Row>
            <Label>Assignee:</Label>
            <Select
              value={item.assignee || defaultAssignee}
              onChange={e => handleAssigneeChange(item, e.target.value)}
            >
              <option value="">– Unassigned –</option>
              {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            {!item.assignee && defaultAssignee && (
              <span style={{ fontSize: 9, color: theme.colors.textLight }}>default: {defaultAssignee}</span>
            )}
          </Row>

          <Row style={{ marginTop: 8 }}>
            {item.status === 'open' && <SmallBtn $variant="success" onClick={() => handleStatusChange(item.id, 'in_progress')}>Start</SmallBtn>}
            {item.status === 'in_progress' && (
              <>
                <SmallBtn $variant="success" onClick={() => handleStatusChange(item.id, 'review')}>To Review</SmallBtn>
                <SmallBtn $variant="success" onClick={() => handleStatusChange(item.id, 'done')}>Done</SmallBtn>
              </>
            )}
            {item.status === 'review' && (
              <>
                <SmallBtn $variant="success" onClick={() => handleStatusChange(item.id, 'testing')}>To Testing</SmallBtn>
                <SmallBtn onClick={() => handleStatusChange(item.id, 'in_progress')}>Back to WIP</SmallBtn>
              </>
            )}
            {item.status === 'testing' && (
              <>
                <SmallBtn $variant="success" onClick={() => handleStatusChange(item.id, 'done')}>Done</SmallBtn>
                <SmallBtn onClick={() => handleStatusChange(item.id, 'in_progress')}>Back to WIP</SmallBtn>
              </>
            )}
            {item.status === 'done' && <SmallBtn onClick={() => handleStatusChange(item.id, 'open')}>Reopen</SmallBtn>}
          </Row>
        </Card>
      ))}
    </Page>
  );
}
