import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import api from '../utils/api';

interface FeedbackComment {
  id: number;
  text: string;
  author: string;
  createdAt: string;
}

interface DeadlineHistoryEntry {
  from: string | null;
  to: string | null;
  changedAt: string;
}

interface FeedbackItem {
  id: number;
  app: string;
  author: string | null;
  type: string;
  title: string;
  description: string | null;
  notes: string | null;
  jiraUrl: string | null;
  confluenceUrl: string | null;
  deadlineWeek: string | null;
  deadlineDate: string | null;
  deadlineHistory: DeadlineHistoryEntry[] | null;
  automationFTE: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  comments: FeedbackComment[];
}

const APP_OPTIONS = ['Interfacing', 'FSM', 'New App'] as const;

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

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  img { height: 36px; border-radius: 6px; }
`;

const BackLink = styled(Link)`
  font-size: 13px;
  color: ${theme.colors.primary};
  font-weight: 500;
  margin-left: 16px;
  &:hover { text-decoration: underline; }
`;

const Content = styled.div`
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 48px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: ${theme.colors.textPrimary};
  margin-bottom: 24px;
`;

const NewItemCard = styled.div`
  background: ${theme.colors.surface};
  border-radius: 10px;
  box-shadow: ${theme.shadow};
  padding: 20px 24px;
  margin-bottom: 32px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const TextArea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  min-width: 300px;
  min-height: 60px;
  resize: vertical;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  background: white;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const Button = styled.button<{ $variant?: string }>`
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  background: ${p => p.$variant === 'success' ? theme.colors.success : p.$variant === 'danger' ? theme.colors.danger : theme.colors.primary};
  color: white;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const SmallButton = styled(Button)`
  padding: 4px 12px;
  font-size: 11px;
`;

const Filters = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterChip = styled.button<{ $active?: boolean }>`
  padding: 6px 14px;
  border: 1px solid ${p => p.$active ? theme.colors.primary : theme.colors.border};
  background: ${p => p.$active ? theme.colors.primary : 'white'};
  color: ${p => p.$active ? 'white' : theme.colors.textPrimary};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: ${theme.colors.primary}; }
`;

const ItemCard = styled.div<{ $status: string }>`
  background: ${theme.colors.surface};
  border-radius: 10px;
  box-shadow: ${theme.shadow};
  padding: 20px 24px;
  margin-bottom: 16px;
  border-left: 4px solid ${p =>
    p.$status === 'done' ? theme.colors.success :
    p.$status === 'in_progress' ? theme.colors.warning :
    p.$status === 'review' ? '#6f42c1' :
    p.$status === 'testing' ? theme.colors.info :
    theme.colors.info};
  opacity: ${p => p.$status === 'done' ? 0.7 : 1};
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const ItemTitle = styled.h3<{ $done?: boolean }>`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  text-decoration: ${p => p.$done ? 'line-through' : 'none'};
`;

const TypeBadge = styled.span<{ $type: string }>`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${p => p.$type === 'bug' ? theme.colors.danger : p.$type === 'feature' ? '#6f42c1' : theme.colors.info};
  color: white;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${p =>
    p.$status === 'done' ? theme.colors.success :
    p.$status === 'in_progress' ? theme.colors.warning :
    p.$status === 'review' ? '#6f42c1' :
    p.$status === 'testing' ? theme.colors.info :
    '#e9ecef'};
  color: ${p =>
    p.$status === 'done' ? 'white' :
    p.$status === 'in_progress' ? '#333' :
    p.$status === 'review' ? 'white' :
    p.$status === 'testing' ? 'white' :
    theme.colors.textSecondary};
`;

const ItemDesc = styled.p`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  line-height: 1.5;
  margin-bottom: 8px;
`;

const ItemMeta = styled.div`
  font-size: 11px;
  color: ${theme.colors.textLight};
  margin-bottom: 12px;
`;

const CommentsSection = styled.div`
  border-top: 1px solid ${theme.colors.border};
  padding-top: 12px;
  margin-top: 8px;
`;

const CommentBubble = styled.div`
  background: ${theme.colors.background};
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 13px;
  color: ${theme.colors.textPrimary};
  line-height: 1.4;
`;

const CommentMeta = styled.span`
  font-size: 11px;
  color: ${theme.colors.textLight};
  font-weight: 600;
  margin-right: 6px;
`;

const CommentForm = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const CommentInput = styled.input`
  flex: 1;
  padding: 6px 10px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 13px;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const AppBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #e0e0e0;
  color: #333;
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
`;

const LinksRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
  flex-wrap: wrap;
`;

const LinkInputGroup = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const LinkInputSmall = styled.input`
  padding: 4px 8px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 12px;
  width: 260px;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const LinkLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  white-space: nowrap;
`;

const ExternalLink = styled.a`
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.info};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  &:hover { text-decoration: underline; }
`;

const JiraButton = styled.button`
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  background: #0052CC;
  color: white;
  transition: all 0.15s;
  &:hover { background: #0747a6; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const SaveLinkBtn = styled.button`
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  background: ${theme.colors.success};
  color: white;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDefaultDeadline(): string {
  const now = new Date();
  const cw = getISOWeek(now) + 1;
  return `KW${String(cw).padStart(2, '0')} ${now.getFullYear()}`;
}

const DeadlineBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: ${theme.colors.primary};
`;

const DeadlineInput = styled.input`
  padding: 3px 8px;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  width: 110px;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const DeadlineDateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const DeadlineDateInput = styled.input`
  padding: 4px 8px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const DaysLeftBadge = styled.span<{ $color: string }>`
  font-size: 11px;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 12px;
  background: ${p => p.$color};
  color: white;
`;

const DeadlineChanged = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: ${theme.colors.warning};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  &:hover { text-decoration: underline; }
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
  padding: 24px 28px;
  max-width: 480px;
  width: 90%;
  max-height: 70vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
  color: ${theme.colors.textPrimary};
`;

const HistoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid ${theme.colors.border};
  font-size: 12px;
  &:last-child { border-bottom: none; }
`;

const HistoryArrow = styled.span`
  color: ${theme.colors.primary};
  font-weight: 700;
`;

const HistoryTimestamp = styled.span`
  color: ${theme.colors.textLight};
  font-size: 11px;
  margin-left: auto;
`;

const CloseBtn = styled.button`
  margin-top: 16px;
  padding: 6px 20px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  background: ${theme.colors.border};
  color: ${theme.colors.textPrimary};
  &:hover { background: #d0d0d0; }
`;

const FTERow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
`;

const FTEInput = styled.input`
  width: 70px;
  padding: 4px 8px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const FTELabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
`;

function getDaysLeft(dateStr: string | null): { days: number; label: string; color: string } | null {
  if (!dateStr) return null;
  const deadline = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { days, label: 'OVERDUE', color: theme.colors.danger };
  if (days === 0) return { days: 0, label: 'Due today', color: theme.colors.danger };
  if (days <= 3) return { days, label: `${days}d left`, color: theme.colors.danger };
  if (days <= 7) return { days, label: `${days}d left`, color: '#e05c00' };
  if (days <= 14) return { days, label: `${days}d left`, color: theme.colors.warning };
  return { days, label: `${days}d left`, color: theme.colors.success };
}

function formatDateShort(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'feature' | 'bug'>('all');
  const [appFilter, setAppFilter] = useState<string>('all');

  const [newApp, setNewApp] = useState('Interfacing');
  const [newAuthor, setNewAuthor] = useState('');
  const [newType, setNewType] = useState('feature');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [commentSaving, setCommentSaving] = useState<number | null>(null);

  const [linkEdits, setLinkEdits] = useState<Record<number, { jira: string; confluence: string }>>({});
  const [linkSaving, setLinkSaving] = useState<Record<number, boolean>>({});
  const [linkSaved, setLinkSaved] = useState<Record<number, boolean>>({});

  const [deadlineEdits, setDeadlineEdits] = useState<Record<number, string>>({});
  const [deadlineDateEdits, setDeadlineDateEdits] = useState<Record<number, string>>({});
  const [deadlineDateSaving, setDeadlineDateSaving] = useState<Record<number, boolean>>({});
  const [historyModalItem, setHistoryModalItem] = useState<FeedbackItem | null>(null);
  const [fteEdits, setFteEdits] = useState<Record<number, string>>({});

  const loadItems = useCallback(async () => {
    try {
      const res = await api.get('/feedback');
      setItems(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await api.post('/feedback', { app: newApp, author: newAuthor.trim() || null, type: newType, title: newTitle.trim(), description: newDesc.trim() || null, deadlineWeek: getDefaultDeadline() });
      setNewTitle('');
      setNewDesc('');
      await loadItems();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.patch(`/feedback/${id}/status`, { status });
      await loadItems();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/feedback/${id}`);
      await loadItems();
    } catch { /* ignore */ }
  };

  const handleAddComment = async (id: number) => {
    const text = commentTexts[id]?.trim();
    if (!text) return;
    setCommentSaving(id);
    try {
      await api.post(`/feedback/${id}/comments`, { text });
      setCommentTexts(prev => ({ ...prev, [id]: '' }));
      await loadItems();
    } catch { /* ignore */ }
    setCommentSaving(null);
  };

  const handleSaveDeadline = async (item: FeedbackItem) => {
    const val = deadlineEdits[item.id] ?? item.deadlineWeek ?? '';
    try {
      await api.patch(`/feedback/${item.id}/deadline`, { deadlineWeek: val.trim() || null });
      await loadItems();
    } catch { /* ignore */ }
  };

  const handleSaveDeadlineDate = async (item: FeedbackItem) => {
    const newDate = deadlineDateEdits[item.id];
    if (newDate === undefined) return;
    const oldDate = item.deadlineDate ? item.deadlineDate.split('T')[0] : null;
    if (newDate === (oldDate || '')) return;
    setDeadlineDateSaving(p => ({ ...p, [item.id]: true }));
    try {
      await api.patch(`/feedback/${item.id}/deadline`, { deadlineDate: newDate || null });
      await loadItems();
    } catch { /* ignore */ }
    setDeadlineDateSaving(p => ({ ...p, [item.id]: false }));
  };

  const handleSaveFTE = async (item: FeedbackItem) => {
    const val = parseFloat(fteEdits[item.id] ?? '') || 0;
    if (val === item.automationFTE) return;
    try {
      await api.patch(`/feedback/${item.id}/automation-fte`, { automationFTE: val });
      await loadItems();
    } catch { /* ignore */ }
  };

  const getLinkEdits = (item: FeedbackItem) => linkEdits[item.id] ?? {
    jira: item.jiraUrl || '',
    confluence: item.confluenceUrl || '',
  };

  const setLinkField = (id: number, field: 'jira' | 'confluence', value: string) => {
    setLinkEdits(prev => {
      const cur = prev[id] ?? { jira: '', confluence: '' };
      return { ...prev, [id]: { ...cur, [field]: value } };
    });
  };

  const handleSaveLinks = async (item: FeedbackItem) => {
    const edits = getLinkEdits(item);
    setLinkSaving(p => ({ ...p, [item.id]: true }));
    try {
      await api.patch(`/feedback/${item.id}/links`, {
        jiraUrl: edits.jira.trim() || null,
        confluenceUrl: edits.confluence.trim() || null,
      });
      setLinkSaved(p => ({ ...p, [item.id]: true }));
      setTimeout(() => setLinkSaved(p => ({ ...p, [item.id]: false })), 2000);
      await loadItems();
    } catch { /* ignore */ }
    setLinkSaving(p => ({ ...p, [item.id]: false }));
  };

  const filtered = items.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false;
    if (typeFilter !== 'all' && i.type !== typeFilter) return false;
    if (appFilter !== 'all' && i.app !== appFilter) return false;
    return true;
  });

  const counts: Record<string, number> = {
    all: items.length,
    open: items.filter(i => i.status === 'open').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    review: items.filter(i => i.status === 'review').length,
    testing: items.filter(i => i.status === 'testing').length,
    done: items.filter(i => i.status === 'done').length,
  };

  return (
    <Page>
      <Header>
        <LogoLink to="/"><img src="/sixt-logo.png" alt="SIXT" /></LogoLink>
        <BackLink to="/">&larr; Back to Home</BackLink>
      </Header>

      <Content>
        <Title>App Requests &amp; Bug Reports</Title>

        <NewItemCard>
          <Label style={{ marginBottom: 8, display: 'block' }}>New Request</Label>
          <FormRow>
            <FormGroup>
              <Label>App</Label>
              <Select value={newApp} onChange={e => setNewApp(e.target.value)}>
                {APP_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Name</Label>
              <Input
                value={newAuthor}
                onChange={e => setNewAuthor(e.target.value)}
                placeholder="Your name..."
                style={{ minWidth: 140 }}
              />
            </FormGroup>
            <FormGroup>
              <Label>Type</Label>
              <Select value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
              </Select>
            </FormGroup>
            <FormGroup style={{ flex: 1 }}>
              <Label>Title</Label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Short summary..."
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </FormGroup>
          </FormRow>
          <FormGroup style={{ marginTop: 12 }}>
            <Label>Description (optional)</Label>
            <TextArea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Detailed description..."
            />
          </FormGroup>
          <div style={{ marginTop: 12 }}>
            <Button onClick={handleCreate} disabled={saving || !newTitle.trim()}>
              {saving ? 'Saving...' : 'Submit'}
            </Button>
          </div>
        </NewItemCard>

        <Filters>
          <FilterChip $active={filter === 'all'} onClick={() => setFilter('all')}>All ({counts.all})</FilterChip>
          <FilterChip $active={filter === 'open'} onClick={() => setFilter('open')}>Open ({counts.open})</FilterChip>
          <FilterChip $active={filter === 'in_progress'} onClick={() => setFilter('in_progress')}>In Progress ({counts.in_progress})</FilterChip>
          <FilterChip $active={filter === 'review'} onClick={() => setFilter('review')}>Review ({counts.review})</FilterChip>
          <FilterChip $active={filter === 'testing'} onClick={() => setFilter('testing')}>Testing ({counts.testing})</FilterChip>
          <FilterChip $active={filter === 'done'} onClick={() => setFilter('done')}>Done ({counts.done})</FilterChip>
          <span style={{ borderLeft: `1px solid ${theme.colors.border}`, margin: '0 4px' }} />
          <FilterChip $active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>All Types</FilterChip>
          <FilterChip $active={typeFilter === 'feature'} onClick={() => setTypeFilter('feature')}>Features</FilterChip>
          <FilterChip $active={typeFilter === 'bug'} onClick={() => setTypeFilter('bug')}>Bugs</FilterChip>
          <span style={{ borderLeft: `1px solid ${theme.colors.border}`, margin: '0 4px' }} />
          <FilterChip $active={appFilter === 'all'} onClick={() => setAppFilter('all')}>All Apps</FilterChip>
          {APP_OPTIONS.map(a => (
            <FilterChip key={a} $active={appFilter === a} onClick={() => setAppFilter(a)}>{a}</FilterChip>
          ))}
        </Filters>

        {filtered.length === 0 && (
          <p style={{ color: theme.colors.textSecondary, fontSize: 14, textAlign: 'center', padding: 40 }}>
            No items yet. Create the first one above!
          </p>
        )}

        {filtered.map(item => (
          <ItemCard key={item.id} $status={item.status}>
            <ItemHeader>
              <AppBadge>{item.app || 'Interfacing'}</AppBadge>
              <TypeBadge $type={item.type}>{item.type === 'feature' ? 'Feature' : 'Bug'}</TypeBadge>
              <ItemTitle $done={item.status === 'done'}>{item.title}</ItemTitle>
              <StatusBadge $status={item.status}>
                {item.status === 'open' ? 'Open' : item.status === 'in_progress' ? 'In Progress' : item.status === 'review' ? 'Review' : item.status === 'testing' ? 'Testing' : 'Done'}
              </StatusBadge>
            </ItemHeader>

            {item.description && <ItemDesc>{item.description}</ItemDesc>}
            <ItemMeta>
              {item.author ? `By ${item.author} · ` : ''}Created: {formatDate(item.createdAt)}
              {' · '}
              <DeadlineBadge>
                Deadline Start:
                <DeadlineInput
                  value={deadlineEdits[item.id] ?? item.deadlineWeek ?? getDefaultDeadline()}
                  onChange={e => setDeadlineEdits(p => ({ ...p, [item.id]: e.target.value }))}
                  onBlur={() => handleSaveDeadline(item)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveDeadline(item)}
                />
              </DeadlineBadge>
            </ItemMeta>

            <DeadlineDateRow>
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textSecondary }}>Deadline:</span>
              <DeadlineDateInput
                type="date"
                value={deadlineDateEdits[item.id] ?? (item.deadlineDate ? item.deadlineDate.split('T')[0] : '')}
                onChange={e => setDeadlineDateEdits(p => ({ ...p, [item.id]: e.target.value }))}
                onBlur={() => handleSaveDeadlineDate(item)}
              />
              {deadlineDateSaving[item.id] && <span style={{ fontSize: 11, color: theme.colors.textLight }}>Saving...</span>}
              {(() => {
                const dateVal = deadlineDateEdits[item.id] ?? (item.deadlineDate ? item.deadlineDate.split('T')[0] : null);
                const dl = getDaysLeft(dateVal);
                if (!dl) return <span style={{ fontSize: 11, color: theme.colors.textLight }}>No deadline set</span>;
                return <DaysLeftBadge $color={dl.color}>{dl.label}</DaysLeftBadge>;
              })()}
              {item.deadlineHistory && (item.deadlineHistory as DeadlineHistoryEntry[]).length > 0 && (
                <DeadlineChanged onClick={() => setHistoryModalItem(item)}>
                  ⚠ Changed {(item.deadlineHistory as DeadlineHistoryEntry[]).length}x — click for history
                </DeadlineChanged>
              )}
            </DeadlineDateRow>

            <FTERow>
              <FTELabel>Hours Saved / Month:</FTELabel>
              <FTEInput
                type="number"
                step="0.5"
                min="0"
                value={fteEdits[item.id] ?? item.automationFTE}
                onChange={e => setFteEdits(p => ({ ...p, [item.id]: e.target.value }))}
                onBlur={() => handleSaveFTE(item)}
              />
              <span style={{ fontSize: 10, color: theme.colors.textLight }}>hours saved by this feature per month</span>
            </FTERow>
            {(fteEdits[item.id] ?? item.automationFTE) > 0 && (
              <FTERow>
                <FTELabel style={{ color: '#c44500' }}>of which peak time hours saved:</FTELabel>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#c44500' }}>
                  {(Number(fteEdits[item.id] ?? item.automationFTE) * 0.45).toFixed(1)} h
                </span>
                <span style={{ fontSize: 10, color: theme.colors.textLight }}>~45% &middot; 5th–15th of month</span>
              </FTERow>
            )}

            <ActionsRow>
              {item.status === 'open' && (
                <SmallButton $variant="success" onClick={() => handleStatusChange(item.id, 'in_progress')}>
                  Start
                </SmallButton>
              )}
              {item.status === 'in_progress' && (
                <>
                  <SmallButton $variant="success" onClick={() => handleStatusChange(item.id, 'review')}>
                    Send to Review
                  </SmallButton>
                  <SmallButton $variant="success" onClick={() => handleStatusChange(item.id, 'done')}>
                    Done
                  </SmallButton>
                </>
              )}
              {item.status === 'review' && (
                <>
                  <SmallButton $variant="success" onClick={() => handleStatusChange(item.id, 'testing')}>
                    Start Testing
                  </SmallButton>
                  <SmallButton onClick={() => handleStatusChange(item.id, 'in_progress')}>
                    Back to In Progress
                  </SmallButton>
                </>
              )}
              {item.status === 'testing' && (
                <>
                  <SmallButton $variant="success" onClick={() => handleStatusChange(item.id, 'done')}>
                    Mark Done
                  </SmallButton>
                  <SmallButton onClick={() => handleStatusChange(item.id, 'in_progress')}>
                    Back to In Progress
                  </SmallButton>
                </>
              )}
              {item.status === 'done' && (
                <SmallButton onClick={() => handleStatusChange(item.id, 'open')}>
                  Reopen
                </SmallButton>
              )}
              <SmallButton $variant="danger" onClick={() => handleDelete(item.id)}>
                Delete
              </SmallButton>
            </ActionsRow>

            <LinksRow>
              <LinkInputGroup>
                <LinkLabel>Jira:</LinkLabel>
                {item.jiraUrl ? (
                  <ExternalLink href={item.jiraUrl} target="_blank" rel="noopener noreferrer">
                    Open Jira ↗
                  </ExternalLink>
                ) : (
                  <LinkInputSmall
                    value={getLinkEdits(item).jira}
                    onChange={e => setLinkField(item.id, 'jira', e.target.value)}
                    placeholder="Paste Jira ticket URL..."
                  />
                )}
              </LinkInputGroup>
              <LinkInputGroup>
                <LinkLabel>Confluence:</LinkLabel>
                {item.confluenceUrl ? (
                  <ExternalLink href={item.confluenceUrl} target="_blank" rel="noopener noreferrer">
                    Open Confluence ↗
                  </ExternalLink>
                ) : (
                  <LinkInputSmall
                    value={getLinkEdits(item).confluence}
                    onChange={e => setLinkField(item.id, 'confluence', e.target.value)}
                    placeholder="Paste Confluence page URL..."
                  />
                )}
              </LinkInputGroup>
              {(!item.jiraUrl || !item.confluenceUrl) && (
                <SaveLinkBtn
                  onClick={() => handleSaveLinks(item)}
                  disabled={linkSaving[item.id]}
                >
                  {linkSaving[item.id] ? '...' : linkSaved[item.id] ? '✓ Saved' : 'Save Links'}
                </SaveLinkBtn>
              )}
              {!item.jiraUrl && (
                <JiraButton
                  onClick={() => {
                    const url = getLinkEdits(item).jira.trim();
                    if (url) {
                      window.open(url, '_blank');
                    } else {
                      window.open('https://sixt.atlassian.net/jira/software/projects/', '_blank');
                    }
                  }}
                >
                  Send to Jira
                </JiraButton>
              )}
            </LinksRow>

            <CommentsSection>
              {item.comments.map(c => (
                <CommentBubble key={c.id}>
                  <CommentMeta>{c.author} &middot; {formatDate(c.createdAt)}</CommentMeta>
                  {c.text}
                </CommentBubble>
              ))}
              <CommentForm>
                <CommentInput
                  value={commentTexts[item.id] || ''}
                  onChange={e => setCommentTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Add comment..."
                  onKeyDown={e => e.key === 'Enter' && handleAddComment(item.id)}
                />
                <SmallButton
                  onClick={() => handleAddComment(item.id)}
                  disabled={commentSaving === item.id || !commentTexts[item.id]?.trim()}
                >
                  {commentSaving === item.id ? '...' : 'Comment'}
                </SmallButton>
              </CommentForm>
            </CommentsSection>
          </ItemCard>
        ))}
      </Content>

      {historyModalItem && (
        <ModalOverlay onClick={() => setHistoryModalItem(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Deadline History — {historyModalItem.title}</ModalTitle>
            {(historyModalItem.deadlineHistory as DeadlineHistoryEntry[] || []).length === 0 ? (
              <span style={{ fontSize: 13, color: theme.colors.textLight }}>No changes recorded.</span>
            ) : (
              (historyModalItem.deadlineHistory as DeadlineHistoryEntry[]).map((h, i) => (
                <HistoryRow key={i}>
                  <span style={{ fontWeight: 600 }}>{formatDateShort(h.from) || 'none'}</span>
                  <HistoryArrow>→</HistoryArrow>
                  <span style={{ fontWeight: 600 }}>{formatDateShort(h.to) || 'none'}</span>
                  <HistoryTimestamp>{formatDate(h.changedAt)}</HistoryTimestamp>
                </HistoryRow>
              ))
            )}
            <CloseBtn onClick={() => setHistoryModalItem(null)}>Close</CloseBtn>
          </ModalBox>
        </ModalOverlay>
      )}
    </Page>
  );
}
