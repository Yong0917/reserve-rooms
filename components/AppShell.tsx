'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import BookingModal from '@/components/BookingModal';
import BookingDetailModal from '@/components/BookingDetailModal';
import RecurringEditModal from '@/components/RecurringEditModal';
import Icon from '@/components/Icon';
import { useAppContext } from '@/lib/context/AppContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const {
    data, currentUserId,
    modalNew, modalDetail, modalEdit, modalEditRecurring,
    setModalNew, setModalDetail, setModalEdit, setModalEditRecurring,
    openNewBooking,
    toast,
    darkMode, setDarkMode,
    accentHue, setAccentHue, ACCENT_HUES,
    viewType, setViewType,
    selectedDate,
    handleCreate, handleUpdate, handleCancelBooking, handleUpdateRecurring,
  } = useAppContext();

  const [tweaksOpen, setTweaksOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
      <Sidebar onNewBooking={() => openNewBooking()} />

      <div style={{ minHeight: '100vh', overflow: 'auto', background: 'var(--bg)' }}>
        <Topbar me={data.ME} userId={currentUserId} />
        <div style={{ padding: '28px 40px 60px', maxWidth: 1600 }}>
          {children}
        </div>
      </div>

      {modalNew && (
        <BookingModal
          data={data}
          initial={modalNew}
          selectedDate={selectedDate}
          mode="create"
          onClose={() => setModalNew(null)}
          onCreate={handleCreate}
        />
      )}

      {modalEdit && (
        <BookingModal
          data={data}
          initial={{}}
          selectedDate={selectedDate}
          mode="edit"
          editTarget={modalEdit}
          onClose={() => setModalEdit(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}

      {modalDetail && (
        <BookingDetailModal
          booking={modalDetail}
          data={data}
          onClose={() => setModalDetail(null)}
          onEdit={(b) => { setModalEdit(b); setModalDetail(null); }}
          onCancel={handleCancelBooking}
        />
      )}

      {modalEditRecurring && (
        <RecurringEditModal
          recurring={modalEditRecurring}
          data={data}
          onClose={() => setModalEditRecurring(null)}
          onSave={handleUpdateRecurring}
        />
      )}

      {toast && (
        <div
          className="animate-toastIn"
          style={{
            position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--text)', color: 'var(--bg)',
            padding: '10px 18px', borderRadius: 999, fontSize: 13, fontWeight: 500,
            zIndex: 300, boxShadow: 'var(--shadow-lg)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{
            width: 18, height: 18, background: 'var(--mint)', color: 'var(--mint-ink)',
            borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11,
          }}>
            <Icon name="check" size={12} />
          </span>
          {toast}
        </div>
      )}

      <button
        onClick={() => setTweaksOpen(!tweaksOpen)}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 199,
          padding: 8, width: 34, height: 34, borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)',
          cursor: 'pointer', boxShadow: 'var(--shadow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name="settings" />
      </button>

      {tweaksOpen && (
        <div
          style={{
            position: 'fixed', bottom: 62, right: 20, width: 260,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, boxShadow: 'var(--shadow-lg)', padding: 16, zIndex: 200,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
            <span>⚙ Tweaks</span>
            <span style={{ cursor: 'pointer', color: 'var(--text-3)', fontWeight: 400 }} onClick={() => setTweaksOpen(false)}>✕</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13 }}>
            <span>다크 모드</span>
            <div
              onClick={() => setDarkMode(!darkMode)}
              style={{
                width: 32, height: 18, borderRadius: 999, cursor: 'pointer',
                background: darkMode ? 'var(--accent)' : 'var(--surface-2)',
                border: darkMode ? '1px solid var(--accent)' : '1px solid var(--border)',
                position: 'relative', transition: 'background 0.15s',
              }}
            >
              <div style={{
                position: 'absolute', top: 1, left: darkMode ? 15 : 1,
                width: 14, height: 14, borderRadius: '50%',
                background: darkMode ? 'white' : 'var(--text-3)',
                transition: 'left 0.15s, background 0.15s',
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13 }}>
            <span>포인트 컬러</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(Object.entries(ACCENT_HUES) as [keyof typeof ACCENT_HUES, { accent: string }][]).map(([v, h]) => (
                <div
                  key={v}
                  onClick={() => setAccentHue(v)}
                  style={{
                    width: 20, height: 20, borderRadius: '50%', background: h.accent, cursor: 'pointer',
                    boxShadow: accentHue === v ? `0 0 0 2px white, 0 0 0 4px ${h.accent}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13 }}>
            <span>뷰 타입</span>
            <div style={{ display: 'inline-flex', background: 'var(--surface-2)', borderRadius: 10, padding: 3, gap: 2, transform: 'scale(0.9)', transformOrigin: 'right' }}>
              {(['timeline', 'grid'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewType(v)}
                  style={{
                    border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                    background: viewType === v ? 'var(--surface)' : 'transparent',
                    color: viewType === v ? 'var(--text)' : 'var(--text-2)',
                    boxShadow: viewType === v ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {v === 'timeline' ? '타임라인' : '그리드'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 10, lineHeight: 1.4, fontFamily: 'JetBrains Mono, monospace' }}>
            Plateer Rooms · Next.js
          </div>
        </div>
      )}
    </div>
  );
}
