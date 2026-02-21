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

interface FeedbackItem {
  id: number;
  app: string;
  author: string | null;
  type: string;
  title: string;
  description: string | null;
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
    '#e9ecef'};
  color: ${p =>
    p.$status === 'done' ? 'white' :
    p.$status === 'in_progress' ? '#333' :
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
`;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'done'>('all');
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
      await api.post('/feedback', { app: newApp, author: newAuthor.trim() || null, type: newType, title: newTitle.trim(), description: newDesc.trim() || null });
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

  const filtered = items.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false;
    if (typeFilter !== 'all' && i.type !== typeFilter) return false;
    if (appFilter !== 'all' && i.app !== appFilter) return false;
    return true;
  });

  const counts = {
    all: items.length,
    open: items.filter(i => i.status === 'open').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
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
                {item.status === 'open' ? 'Open' : item.status === 'in_progress' ? 'In Progress' : 'Done'}
              </StatusBadge>
            </ItemHeader>

            {item.description && <ItemDesc>{item.description}</ItemDesc>}
            <ItemMeta>{item.author ? `By ${item.author} \u00b7 ` : ''}Created: {formatDate(item.createdAt)}</ItemMeta>

            <ActionsRow>
              {item.status === 'open' && (
                <SmallButton $variant="success" onClick={() => handleStatusChange(item.id, 'in_progress')}>
                  Start
                </SmallButton>
              )}
              {item.status === 'in_progress' && (
                <SmallButton $variant="success" onClick={() => handleStatusChange(item.id, 'done')}>
                  Done
                </SmallButton>
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
    </Page>
  );
}
