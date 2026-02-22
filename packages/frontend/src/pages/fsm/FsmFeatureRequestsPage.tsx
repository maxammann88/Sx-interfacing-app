import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { PageTitle } from '../../components/ui';
import { theme } from '../../styles/theme';
import api from '../../utils/api';

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
  deadlineWeek: string | null;
  deadlineDate: string | null;
  deadlineHistory: DeadlineHistoryEntry[] | null;
  automationFTE: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  comments: FeedbackComment[];
}

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  open: { next: 'in_progress', label: 'Start' },
  in_progress: { next: 'review', label: 'Send to Review' },
  review: { next: 'testing', label: 'Start Testing' },
  testing: { next: 'done', label: 'Mark Done' },
  done: { next: 'open', label: 'Reopen' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: theme.colors.textSecondary, bg: '#e9ecef' },
  in_progress: { label: 'In Progress', color: '#fff', bg: theme.colors.info },
  review: { label: 'Review', color: '#fff', bg: '#6f42c1' },
  testing: { label: 'Testing', color: '#333', bg: theme.colors.warning },
  done: { label: 'Done', color: '#fff', bg: theme.colors.success },
};

const Wrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const Stats = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const StatCard = styled.div<{ $bg: string }>`
  background: ${p => p.$bg};
  color: #fff;
  border-radius: 8px;
  padding: 14px 22px;
  min-width: 130px;
  text-align: center;
`;

const StatNum = styled.div`
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
`;

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
  opacity: 0.9;
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
  background: ${p => p.$active ? theme.colors.primary : '#fff'};
  color: ${p => p.$active ? '#fff' : theme.colors.textPrimary};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: ${theme.colors.primary}; }
`;

const EmptyState = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: 14px;
  text-align: center;
  padding: 60px 20px;
`;

const TicketCard = styled.div<{ $status: string }>`
  background: ${theme.colors.surface};
  border-radius: 10px;
  box-shadow: ${theme.shadow};
  margin-bottom: 14px;
  border-left: 5px solid ${p => STATUS_META[p.$status]?.bg || theme.colors.border};
  overflow: hidden;
`;

const TicketHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
  &:hover { background: rgba(0,0,0,0.02); }
`;

const Chevron = styled.span<{ $open: boolean }>`
  font-size: 12px;
  color: ${theme.colors.textLight};
  transition: transform 0.2s;
  transform: rotate(${p => p.$open ? '90deg' : '0deg'});
  flex-shrink: 0;
`;

const TicketTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  flex: 1;
  min-width: 0;
`;

const TypeBadge = styled.span<{ $type: string }>`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${p => p.$type === 'bug' ? theme.colors.danger : '#6f42c1'};
  color: #fff;
  flex-shrink: 0;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 10px;
  background: ${p => STATUS_META[p.$status]?.bg || '#e9ecef'};
  color: ${p => STATUS_META[p.$status]?.color || theme.colors.textSecondary};
  flex-shrink: 0;
`;

const PriorityBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: #f0f0f0;
  color: #666;
  flex-shrink: 0;
`;

const TicketBody = styled.div`
  padding: 0 20px 20px;
  border-top: 1px solid ${theme.colors.border};
`;

const Section = styled.div`
  margin-top: 16px;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
`;

const Description = styled.p`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  line-height: 1.6;
  white-space: pre-wrap;
`;

const NotesTextarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 10px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  &:focus { outline: none; border-color: ${theme.colors.primary}; box-shadow: 0 0 0 2px rgba(255,95,0,0.15); }
`;

const MetaRow = styled.div`
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: ${theme.colors.textLight};
  margin-top: 8px;
  flex-wrap: wrap;
`;

const ActionBar = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
`;

const Btn = styled.button<{ $color?: string }>`
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  background: ${p => p.$color || theme.colors.primary};
  color: #fff;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const SaveIndicator = styled.span`
  font-size: 11px;
  color: ${theme.colors.success};
  font-weight: 600;
  align-self: center;
`;

const CommentsSection = styled.div`
  border-top: 1px solid ${theme.colors.border};
  padding-top: 12px;
  margin-top: 16px;
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

const FTERow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
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

const DeadlineSection = styled.div`
  margin-top: 16px;
  padding: 14px 16px;
  background: #fafafa;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
`;

const DeadlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const DeadlineDateInput = styled.input`
  padding: 5px 10px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const DaysLeftBadge = styled.span<{ $color: string }>`
  font-size: 12px;
  font-weight: 800;
  padding: 3px 12px;
  border-radius: 12px;
  background: ${p => p.$color};
  color: white;
`;

const ChangedIndicator = styled.span`
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

const HistoryItem = styled.div`
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

const HistoryDate = styled.span`
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function FsmFeatureRequestsPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [notesEdits, setNotesEdits] = useState<Record<number, string>>({});
  const [notesSaving, setNotesSaving] = useState<Record<number, boolean>>({});
  const [notesSaved, setNotesSaved] = useState<Record<number, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [commentSaving, setCommentSaving] = useState<number | null>(null);
  const [deadlineDateEdits, setDeadlineDateEdits] = useState<Record<number, string>>({});
  const [deadlineSaving, setDeadlineSaving] = useState<Record<number, boolean>>({});
  const [historyModalItem, setHistoryModalItem] = useState<FeedbackItem | null>(null);
  const [fteEdits, setFteEdits] = useState<Record<number, string>>({});

  const loadItems = useCallback(async () => {
    try {
      const res = await api.get('/feedback', { params: { app: 'FSM' } });
      setItems(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const toggle = (id: number) => {
    setExpandedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.patch(`/feedback/${id}/status`, { status });
      await loadItems();
    } catch { /* ignore */ }
  };

  const handleSaveNotes = async (id: number) => {
    setNotesSaving(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/feedback/${id}/notes`, { notes: notesEdits[id] ?? '' });
      setNotesSaved(p => ({ ...p, [id]: true }));
      setTimeout(() => setNotesSaved(p => ({ ...p, [id]: false })), 2000);
      await loadItems();
    } catch { /* ignore */ }
    setNotesSaving(p => ({ ...p, [id]: false }));
  };

  const handleSaveDeadlineDate = async (item: FeedbackItem) => {
    const newDate = deadlineDateEdits[item.id];
    if (newDate === undefined) return;
    const oldDate = item.deadlineDate ? item.deadlineDate.split('T')[0] : null;
    if (newDate === (oldDate || '')) return;
    setDeadlineSaving(p => ({ ...p, [item.id]: true }));
    try {
      await api.patch(`/feedback/${item.id}/deadline`, { deadlineDate: newDate || null });
      await loadItems();
    } catch { /* ignore */ }
    setDeadlineSaving(p => ({ ...p, [item.id]: false }));
  };

  const handleSaveFTE = async (item: FeedbackItem) => {
    const val = parseFloat(fteEdits[item.id] ?? '') || 0;
    if (val === item.automationFTE) return;
    try {
      await api.patch(`/feedback/${item.id}/automation-fte`, { automationFTE: val });
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

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: 0, open: 0, in_progress: 0, review: 0, testing: 0, done: 0 };
    items.forEach(i => { c.all++; c[i.status] = (c[i.status] || 0) + 1; });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(i => i.status === filter);
  }, [items, filter]);

  if (loading) {
    return (
      <Wrapper>
        <PageTitle>Feature Request List</PageTitle>
        <EmptyState>Loading...</EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <PageTitle>Feature Request List</PageTitle>

      <Stats>
        <StatCard $bg={theme.colors.info}>
          <StatNum>{statusCounts.in_progress || 0}</StatNum>
          <StatLabel>In Progress</StatLabel>
        </StatCard>
        <StatCard $bg="#6f42c1">
          <StatNum>{statusCounts.review || 0}</StatNum>
          <StatLabel>In Review</StatLabel>
        </StatCard>
        <StatCard $bg={theme.colors.warning}>
          <StatNum>{statusCounts.testing || 0}</StatNum>
          <StatLabel>Testing</StatLabel>
        </StatCard>
        <StatCard $bg={theme.colors.success}>
          <StatNum>{statusCounts.done || 0}</StatNum>
          <StatLabel>Done</StatLabel>
        </StatCard>
      </Stats>

      <Filters>
        {(['all', 'open', 'in_progress', 'review', 'testing', 'done'] as const).map(s => (
          <FilterChip key={s} $active={filter === s} onClick={() => setFilter(s)}>
            {s === 'all' ? `All (${statusCounts.all})` :
              `${STATUS_META[s]?.label || s} (${statusCounts[s] || 0})`}
          </FilterChip>
        ))}
      </Filters>

      {filtered.length === 0 && (
        <EmptyState>
          No FSM tickets found. Create them on the{' '}
          <a href="/feedback" style={{ color: theme.colors.primary }}>App Requests &amp; Bug Reports</a>{' '}
          page with App = "FSM" and click "Start" to begin working on them.
        </EmptyState>
      )}

      {filtered.map((item, idx) => {
        const open = expandedIds.has(item.id);
        const currentNotes = notesEdits[item.id] ?? item.notes ?? '';
        const flow = STATUS_FLOW[item.status];

        return (
          <TicketCard key={item.id} $status={item.status}>
            <TicketHeader onClick={() => toggle(item.id)}>
              <Chevron $open={open}>▶</Chevron>
              <PriorityBadge>#{idx + 1}</PriorityBadge>
              <TypeBadge $type={item.type}>{item.type === 'bug' ? 'Bug' : 'Feature'}</TypeBadge>
              <TicketTitle>{item.title}</TicketTitle>
              <StatusBadge $status={item.status}>
                {STATUS_META[item.status]?.label || item.status}
              </StatusBadge>
            </TicketHeader>

            {open && (
              <TicketBody>
                {item.description && (
                  <Section>
                    <SectionLabel>Description</SectionLabel>
                    <Description>{item.description}</Description>
                  </Section>
                )}

                <MetaRow>
                  {item.author && <span>By: <strong>{item.author}</strong></span>}
                  <span>Created: {formatDate(item.createdAt)}</span>
                  <span>Updated: {formatDate(item.updatedAt)}</span>
                  {item.deadlineWeek && (
                    <span style={{ color: theme.colors.textLight }}>
                      KW: {item.deadlineWeek}
                    </span>
                  )}
                </MetaRow>

                <DeadlineSection>
                  <SectionLabel>Deadline</SectionLabel>
                  <DeadlineRow>
                    <DeadlineDateInput
                      type="date"
                      value={deadlineDateEdits[item.id] ?? (item.deadlineDate ? item.deadlineDate.split('T')[0] : '')}
                      onChange={e => setDeadlineDateEdits(p => ({ ...p, [item.id]: e.target.value }))}
                      onBlur={() => handleSaveDeadlineDate(item)}
                    />
                    {deadlineSaving[item.id] && <span style={{ fontSize: 11, color: theme.colors.textLight }}>Saving...</span>}
                    {(() => {
                      const dateVal = deadlineDateEdits[item.id] ?? (item.deadlineDate ? item.deadlineDate.split('T')[0] : null);
                      const dl = getDaysLeft(dateVal);
                      if (!dl) return <span style={{ fontSize: 12, color: theme.colors.textLight }}>No deadline set</span>;
                      return <DaysLeftBadge $color={dl.color}>{dl.label}</DaysLeftBadge>;
                    })()}
                    {item.deadlineHistory && (item.deadlineHistory as DeadlineHistoryEntry[]).length > 0 && (
                      <ChangedIndicator onClick={() => setHistoryModalItem(item)}>
                        ⚠ Changed {(item.deadlineHistory as DeadlineHistoryEntry[]).length}x — click for history
                      </ChangedIndicator>
                    )}
                  </DeadlineRow>
                </DeadlineSection>

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

                <Section>
                  <SectionLabel>Working Notes &amp; Implementation Plan</SectionLabel>
                  <NotesTextarea
                    value={currentNotes}
                    onChange={e => setNotesEdits(p => ({ ...p, [item.id]: e.target.value }))}
                    placeholder="Add implementation thoughts, steps, acceptance criteria..."
                  />
                  <ActionBar>
                    <Btn
                      onClick={() => handleSaveNotes(item.id)}
                      disabled={notesSaving[item.id]}
                    >
                      {notesSaving[item.id] ? 'Saving...' : 'Save Notes'}
                    </Btn>
                    {notesSaved[item.id] && <SaveIndicator>✓ Saved</SaveIndicator>}
                  </ActionBar>
                </Section>

                <ActionBar>
                  {flow && (
                    <Btn
                      $color={STATUS_META[flow.next]?.bg || theme.colors.primary}
                      onClick={() => handleStatusChange(item.id, flow.next)}
                    >
                      {flow.label}
                    </Btn>
                  )}
                  {item.status !== 'in_progress' && item.status !== 'open' && (
                    <Btn $color={theme.colors.textLight} onClick={() => handleStatusChange(item.id, 'in_progress')}>
                      Back to In Progress
                    </Btn>
                  )}
                </ActionBar>

                <CommentsSection>
                  <SectionLabel>Discussion</SectionLabel>
                  {item.comments.map(c => (
                    <CommentBubble key={c.id}>
                      <CommentMeta>{c.author} · {formatDate(c.createdAt)}</CommentMeta>
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
                    <Btn
                      onClick={() => handleAddComment(item.id)}
                      disabled={commentSaving === item.id || !commentTexts[item.id]?.trim()}
                    >
                      {commentSaving === item.id ? '...' : 'Comment'}
                    </Btn>
                  </CommentForm>
                </CommentsSection>
              </TicketBody>
            )}
          </TicketCard>
        );
      })}

      {historyModalItem && (
        <ModalOverlay onClick={() => setHistoryModalItem(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Deadline History — #{items.indexOf(historyModalItem) + 1} {historyModalItem.title}</ModalTitle>
            {(historyModalItem.deadlineHistory as DeadlineHistoryEntry[] || []).length === 0 ? (
              <span style={{ fontSize: 13, color: theme.colors.textLight }}>No changes recorded.</span>
            ) : (
              (historyModalItem.deadlineHistory as DeadlineHistoryEntry[]).map((h, i) => (
                <HistoryItem key={i}>
                  <span style={{ fontWeight: 600 }}>{formatDateShort(h.from) || 'none'}</span>
                  <HistoryArrow>→</HistoryArrow>
                  <span style={{ fontWeight: 600 }}>{formatDateShort(h.to) || 'none'}</span>
                  <HistoryDate>{formatDate(h.changedAt)}</HistoryDate>
                </HistoryItem>
              ))
            )}
            <CloseBtn onClick={() => setHistoryModalItem(null)}>Close</CloseBtn>
          </ModalBox>
        </ModalOverlay>
      )}
    </Wrapper>
  );
}
