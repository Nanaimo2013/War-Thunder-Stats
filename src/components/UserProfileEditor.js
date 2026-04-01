/**
 * UserProfileEditor.js  v3.0
 * Full WTTheme overhaul — inline editing, full-width table,
 * animated rows, vehicle icon, search with highlight.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Edit, Plus, Search, Trash2, Check, X,
  Shield, Star, ChevronRight, AlertCircle,
  User, Hash, Award, Plane, Crosshair, Radio,
} from 'lucide-react';
import { notify } from '../utils/notifications';
import { WTSpinner } from '../styles/wtTheme';
import { createId } from '../utils/battleParser.js';

// ─── Field config ──────────────────────────────────────────────────────────

const PROFILE_FIELDS = [
  { key: 'name',            label: 'Callsign',         icon: User,      placeholder: 'e.g., Panzer_Ace', required: true },
  { key: 'title',           label: 'Title',            icon: Award,     placeholder: 'e.g., Ace User, Tank Commander' },
  { key: 'level',           label: 'Level',            icon: Star,      placeholder: 'e.g., 100', type: 'number' },
  { key: 'gaijinId',        label: 'Gaijin ID',        icon: Hash,      placeholder: 'e.g., #123456789' },
  { key: 'rank',            label: 'Rank',             icon: Shield,    placeholder: 'e.g., Major, Wing Commander' },
  { key: 'favoriteVehicle', label: 'Favorite Vehicle', icon: Crosshair, placeholder: 'e.g., M1A1 Abrams, Bf 109 G-6' },
  { key: 'squadron',        label: 'Squadron',         icon: Radio,     placeholder: 'e.g., [SQUAD]' },
];

const EMPTY_FORM = PROFILE_FIELDS.reduce((o, f) => ({ ...o, [f.key]: '' }), {});

// ─── Highlight search term in text ─────────────────────────────────────────

const HighlightText = ({ text, query }) => {
  if (!query || !text) return <>{text || ''}</>;
  const idx = String(text).toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(245,158,11,0.35)', color: '#f59e0b', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
};

// ─── Single form field ─────────────────────────────────────────────────────

const FormField = ({ field, value, onChange, autoFocus }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{
      fontSize: 10, fontFamily: "'Rajdhani'", fontWeight: 700,
      color: field.required ? '#f59e0b' : '#64748b',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      {field.icon && <field.icon size={11} />}
      {field.label}
      {field.required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <input
      type={field.type || 'text'}
      className="wt-input"
      value={value}
      onChange={e => onChange(field.key, e.target.value)}
      placeholder={field.placeholder}
      autoFocus={autoFocus}
      style={{ fontSize: 13 }}
    />
  </div>
);

// ─── User row in table ────────────────────────────────────────────────────

const UserRow = ({ user, searchTerm, onEdit, onDelete, isSelected, onSelect, battleCount, index }) => {
  const [delConfirm, setDelConfirm] = useState(false);
  const [ref, setRef] = useState(null);

  // Cancel delete confirm on outside click
  useEffect(() => {
    if (!delConfirm) return;
    const h = (e) => { if (ref && !ref.contains(e.target)) setDelConfirm(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [delConfirm, ref]);

  const resultColor = (user.battles || []).length > 0 ? '#f59e0b' : '#475569';

  return (
    <tr
      style={{
        animation: `wt-fade-in 0.35s ease ${Math.min(index * 0.04, 0.4)}s both`,
        background: isSelected ? 'rgba(245,158,11,0.06)' : 'transparent',
        borderLeft: isSelected ? '3px solid #f59e0b' : '3px solid transparent',
        transition: 'background 0.18s ease, border-color 0.18s ease',
        cursor: 'pointer',
      }}
      onClick={() => onSelect(user.id)}
    >
      {/* Avatar / initial */}
      <td style={{ padding: '10px 14px', width: 44 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: isSelected ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${isSelected ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 14,
          color: isSelected ? '#f59e0b' : '#475569',
          flexShrink: 0,
        }}>
          {(user.name || '?')[0].toUpperCase()}
        </div>
      </td>

      {/* Name + title */}
      <td style={{ padding: '10px 14px' }}>
        <div style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 14, color: '#e2e8f0', marginBottom: 1 }}>
          <HighlightText text={user.name} query={searchTerm} />
          {isSelected && (
            <span style={{ marginLeft: 6, fontSize: 9, color: '#f59e0b', fontFamily: "'Share Tech Mono'", background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 3, padding: '1px 5px', verticalAlign: 'middle' }}>
              ACTIVE
            </span>
          )}
        </div>
        {user.title && (
          <div style={{ fontSize: 11, color: '#475569', fontFamily: "'Exo 2'" }}>
            <HighlightText text={user.title} query={searchTerm} />
          </div>
        )}
      </td>

      {/* Level */}
      <td style={{ padding: '10px 14px' }}>
        {user.level ? (
          <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 13, color: '#f59e0b' }}>
            Lv. {user.level}
          </span>
        ) : (
          <span style={{ color: '#334155', fontSize: 11 }}>—</span>
        )}
      </td>

      {/* Gaijin ID */}
      <td style={{ padding: '10px 14px' }}>
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 11, color: '#64748b' }}>
          <HighlightText text={user.gaijinId || '—'} query={searchTerm} />
        </span>
      </td>

      {/* Squadron */}
      <td style={{ padding: '10px 14px' }}>
        <span style={{ fontFamily: "'Share Tech Mono'", fontSize: 12, color: '#3b82f6' }}>
          {user.squadron || '—'}
        </span>
      </td>

      {/* Battle count */}
      <td style={{ padding: '10px 14px' }}>
        <span style={{
          fontFamily: "'Share Tech Mono'", fontSize: 13, color: resultColor,
          fontWeight: battleCount > 0 ? 700 : 400,
        }}>
          {battleCount}
        </span>
      </td>

      {/* Actions */}
      <td
        style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}
        onClick={e => e.stopPropagation()}
        ref={setRef}
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            className="wt-btn-icon info"
            onClick={() => onEdit(user.id)}
            title="Edit profile"
            style={{ width: 30, height: 30 }}
          >
            <Edit size={13} />
          </button>

          {delConfirm ? (
            <>
              <button
                className="wt-btn-icon danger"
                onClick={() => { onDelete(user.id); setDelConfirm(false); }}
                title="Confirm delete"
                style={{ width: 30, height: 30 }}
              >
                <Check size={13} />
              </button>
              <button
                className="wt-btn-icon"
                onClick={() => setDelConfirm(false)}
                title="Cancel"
                style={{ width: 30, height: 30 }}
              >
                <X size={13} />
              </button>
            </>
          ) : (
            <button
              className="wt-btn-icon"
              onClick={() => setDelConfirm(true)}
              title="Delete user"
              style={{ width: 30, height: 30, color: '#475569' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

const UserProfileEditor = ({ users, setUsers, selectedUserId, setSelectedUserId }) => {
  const [editingId, setEditingId]   = useState('');
  const [form, setForm]             = useState(EMPTY_FORM);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen]     = useState(false);
  const formRef = useRef(null);

  // Load user into form when editing
  useEffect(() => {
    if (!editingId) {
      setForm(EMPTY_FORM);
      return;
    }
    const u = users.find(u => u.id === editingId);
    if (u) {
      setForm({
        name:            u.name            || '',
        title:           u.title           || '',
        level:           u.level           || '',
        gaijinId:        u.gaijinId        || '',
        rank:            u.rank            || '',
        favoriteVehicle: u.favoriteVehicle || '',
        squadron:        u.squadron        || '',
      });
      setFormOpen(true);
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  }, [editingId, users]);

  const handleFieldChange = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      notify('Callsign (name) cannot be empty.', 'error');
      return;
    }

    if (editingId) {
      setUsers(prev => prev.map(u =>
        u.id === editingId
          ? { ...u, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) }
          : u
      ));
      notify(`User "${form.name.trim()}" updated.`, 'success');
    } else {
      const newUser = {
        id: createId()
        battles: [],
        ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])),
      };
      setUsers(prev => [...prev, newUser]);
      setSelectedUserId(newUser.id);
      notify(`User "${newUser.name}" created.`, 'success');
    }

    setEditingId('');
    setForm(EMPTY_FORM);
    setFormOpen(false);
  }, [form, editingId, setUsers, setSelectedUserId]);

  const handleEdit = useCallback((id) => {
    setEditingId(id);
  }, []);

  const handleDelete = useCallback((id) => {
    const user = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selectedUserId === id) setSelectedUserId('');
    notify(`User "${user?.name}" removed.`, 'info');
  }, [users, selectedUserId, setUsers, setSelectedUserId]);

  const handleCancel = () => {
    setEditingId('');
    setForm(EMPTY_FORM);
    setFormOpen(false);
  };

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.gaijinId?.toLowerCase().includes(q) ||
      u.title?.toLowerCase().includes(q) ||
      u.squadron?.toLowerCase().includes(q)
    );
  });

  const isEditing = !!editingId;

  return (
    <div style={{ padding: '4px 24px 24px' }}>

      {/* ── Action bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
          <input
            type="text"
            className="wt-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            style={{ paddingLeft: 34, fontSize: 13 }}
          />
        </div>

        <button
          className={`wt-btn ${formOpen && !isEditing ? 'wt-btn-ghost' : 'wt-btn-primary'}`}
          onClick={() => {
            if (formOpen && !isEditing) { handleCancel(); }
            else { setEditingId(''); setForm(EMPTY_FORM); setFormOpen(true); }
          }}
          style={{ gap: 7, height: 38 }}
        >
          {formOpen && !isEditing ? <X size={15} /> : <Plus size={15} />}
          {formOpen && !isEditing ? 'Cancel' : 'New User'}
        </button>
      </div>

      {/* ── Create / Edit Form ── */}
      {formOpen && (
        <div
          ref={formRef}
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: `1px solid ${isEditing ? 'rgba(59,130,246,0.35)' : 'rgba(245,158,11,0.25)'}`,
            borderRadius: 10, padding: 20, marginBottom: 18,
            animation: 'wt-fade-in 0.3s ease both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 3, height: 20, background: isEditing ? '#3b82f6' : '#f59e0b', borderRadius: 2 }} />
            <span style={{ fontFamily: "'Rajdhani'", fontWeight: 800, fontSize: 14, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {isEditing ? `Edit: ${users.find(u => u.id === editingId)?.name || 'User'}` : 'Create New User'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
            {PROFILE_FIELDS.map((field, i) => (
              <FormField
                key={field.key}
                field={field}
                value={form[field.key]}
                onChange={handleFieldChange}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="wt-btn wt-btn-ghost" onClick={handleCancel} style={{ height: 38 }}>
              <X size={15} /> Cancel
            </button>
            <button
              className="wt-btn wt-btn-primary"
              onClick={handleSubmit}
              disabled={!form.name.trim()}
              style={{ height: 38, background: isEditing ? '#3b82f6' : undefined }}
            >
              {isEditing ? <><Check size={15} /> Save Changes</> : <><Plus size={15} /> Create User</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Users Table ── */}
      {users.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          border: '1px dashed rgba(245,158,11,0.15)', borderRadius: 10,
          color: '#334155',
        }}>
          <Users size={40} style={{ marginBottom: 12, opacity: 0.25 }} />
          <p style={{ fontFamily: "'Rajdhani'", fontSize: 16, margin: 0, letterSpacing: '0.05em' }}>NO USERS REGISTERED</p>
          <p style={{ fontSize: 12, marginTop: 6, fontFamily: "'Exo 2'" }}>Create a user profile to start tracking battles.</p>
        </div>
      ) : (
        <div style={{ borderRadius: 10, border: '1px solid rgba(245,158,11,0.1)', overflow: 'hidden' }}>
          {/* Search result count */}
          {searchTerm && (
            <div style={{ padding: '8px 14px', background: 'rgba(245,158,11,0.04)', borderBottom: '1px solid rgba(245,158,11,0.08)', fontSize: 11, color: '#64748b', fontFamily: "'Exo 2'" }}>
              {filteredUsers.length} of {users.length} users
            </div>
          )}

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table className="wt-table" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: 44, padding: '10px 14px' }}></th>
                  <th>Callsign</th>
                  <th style={{ width: 90 }}>Level</th>
                  <th style={{ width: 140 }}>Gaijin ID</th>
                  <th style={{ width: 100 }}>Squadron</th>
                  <th style={{ width: 80 }}>Battles</th>
                  <th style={{ width: 110 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, i) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      index={i}
                      searchTerm={searchTerm}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isSelected={selectedUserId === user.id}
                      onSelect={setSelectedUserId}
                      battleCount={user.battles?.length || 0}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#334155', fontFamily: "'Exo 2'", fontSize: 13 }}>
                      No users match "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(245,158,11,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#334155', fontFamily: "'Share Tech Mono'", letterSpacing: '0.06em' }}>
              {users.length} USER{users.length !== 1 ? 'S' : ''} REGISTERED
            </span>
            {selectedUserId && (
              <span style={{ fontSize: 11, color: '#f59e0b', fontFamily: "'Share Tech Mono'", display: 'flex', alignItems: 'center', gap: 4 }}>
                <ChevronRight size={12} />
                ACTIVE: {users.find(u => u.id === selectedUserId)?.name || 'Unknown'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileEditor;