'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Icon from '@/components/Icon';
import type { AdminRoom } from '@/lib/types';
import type { RoomColor } from '@/lib/types';

const COLORS: RoomColor[] = ['lavender', 'mint', 'peach', 'butter', 'sage', 'rose', 'sky', 'coral', 'lilac'];

const COLOR_HEX: Record<RoomColor, string> = {
  lavender: '#c4b5fd', mint: '#6ee7b7', peach: '#fca5a5', butter: '#fde68a',
  sage: '#a7f3d0', rose: '#fbcfe8', sky: '#bae6fd', coral: '#fbb882', lilac: '#ddd6fe',
};

const FEATURES = ['TV', '화이트보드', '창문', '화상회의', '프로젝터', '마이크', '소음차단'];
const ZONES = ['협업', '집중', '1on1', '대회의'];

interface RoomFormProps {
  initial?: AdminRoom;
}

export default function RoomForm({ initial }: RoomFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial?.name ?? '');
  const [floor, setFloor] = useState(initial?.floor ?? '');
  const [zone, setZone] = useState(initial?.zone ?? '');
  const [capacity, setCapacity] = useState(initial?.capacity ?? 4);
  const [color, setColor] = useState<RoomColor>(initial?.color ?? 'lavender');
  const [features, setFeatures] = useState<string[]>(initial?.features ?? []);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleFeature = (f: string) => {
    setFeatures((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `rooms/tmp/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('room-images').upload(path, file, { upsert: true });
      if (uploadErr) { setError('이미지 업로드 실패: ' + uploadErr.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('room-images').getPublicUrl(path);
      setImageUrl(publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !floor.trim()) { setError('이름과 층은 필수입니다.'); return; }
    setSaving(true);
    setError('');
    try {
      const body = { name: name.trim(), floor: floor.trim(), zone: zone.trim(), capacity, features, color, is_active: isActive, image_url: imageUrl };

      if (initial) {
        const res = await fetch(`/api/admin/rooms/${initial.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error ?? '수정 실패'); return; }
      } else {
        const res = await fetch('/api/admin/rooms', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error ?? '생성 실패'); return; }
        const { id } = await res.json() as { id: string };
        // 이미지 경로에 실제 roomId 반영
        if (imageUrl && imageUrl.includes('/tmp/')) {
          const ext = imageUrl.split('.').pop() ?? 'jpg';
          const newPath = `rooms/${id}/${Date.now()}.${ext}`;
          const fileInput = fileRef.current?.files?.[0];
          if (fileInput) {
            await supabase.storage.from('room-images').upload(newPath, fileInput, { upsert: true });
            const { data: { publicUrl } } = supabase.storage.from('room-images').getPublicUrl(newPath);
            await fetch(`/api/admin/rooms/${id}`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_url: publicUrl }),
            });
          }
        }
      }
      router.push('/admin/rooms');
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>회의실 이름 *</label>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: P&I Room" required />
        </div>
        <div>
          <label style={labelStyle}>층 *</label>
          <input style={inputStyle} value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="예: 5F" required />
        </div>
        <div>
          <label style={labelStyle}>구역</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          >
            <option value="">선택...</option>
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>수용 인원 *</label>
          <input
            style={inputStyle} type="number" min={1} max={100}
            value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value) || 1)} required
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>컬러</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <button
              key={c} type="button" onClick={() => setColor(c)}
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: COLOR_HEX[c],
                border: color === c ? '2.5px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer', outline: 'none',
                boxShadow: color === c ? '0 0 0 2px var(--accent-soft)' : 'none',
              }}
              title={c}
            />
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>설비 및 특징</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FEATURES.map((f) => {
            const on = features.includes(f);
            return (
              <button
                key={f} type="button" onClick={() => toggleFeature(f)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                  background: on ? 'var(--accent-soft)' : 'transparent',
                  color: on ? 'var(--accent)' : 'var(--text-2)',
                  fontWeight: on ? 600 : 400,
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={labelStyle}>이미지</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '1.5px dashed var(--border)', borderRadius: 10,
            padding: '20px', textAlign: 'center', cursor: 'pointer',
            background: 'var(--surface)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}
          onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="미리보기" style={{ maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} />
          ) : (
            <>
              <Icon name="upload" size={24} />
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {uploading ? '업로드 중...' : '클릭하여 이미지 선택'}
              </span>
            </>
          )}
        </div>
        <input
          ref={fileRef} type="file" accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
        />
        {imageUrl && (
          <button type="button" onClick={() => setImageUrl(null)} style={{ marginTop: 6, fontSize: 12, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            이미지 제거
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>활성 상태</label>
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          style={{
            width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
            background: isActive ? 'var(--accent)' : 'var(--border)',
            position: 'relative', transition: 'background 0.2s',
          }}
        >
          <span
            style={{
              position: 'absolute', top: 3,
              left: isActive ? 20 : 3,
              width: 16, height: 16, borderRadius: '50%',
              background: 'white', transition: 'left 0.2s',
            }}
          />
        </button>
        <span style={{ fontSize: 13, color: isActive ? 'var(--accent)' : 'var(--text-2)' }}>
          {isActive ? '활성' : '비활성'}
        </span>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button
          type="submit" disabled={saving || uploading}
          style={{
            padding: '10px 24px', borderRadius: 9, border: 'none',
            background: 'var(--accent)', color: 'white',
            fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? '저장 중...' : initial ? '수정 완료' : '회의실 추가'}
        </button>
        <button
          type="button" onClick={() => router.back()}
          style={{
            padding: '10px 24px', borderRadius: 9,
            border: '1px solid var(--border)', background: 'transparent',
            fontSize: 13, color: 'var(--text-2)', cursor: 'pointer',
          }}
        >
          취소
        </button>
      </div>
    </form>
  );
}
