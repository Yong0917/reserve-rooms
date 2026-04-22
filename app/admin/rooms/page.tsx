import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { fetchAllRoomsAdmin } from '@/lib/supabase/queries';
import Icon from '@/components/Icon';
import RoomDeleteButton from './RoomDeleteButton';

export default async function AdminRoomsPage() {
  const supabase = await createClient();
  const rooms = await fetchAllRoomsAdmin(supabase);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>회의실 관리</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>총 {rooms.length}개 회의실</p>
        </div>
        <Link
          href="/admin/rooms/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 9,
            background: 'var(--accent)', color: 'white',
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}
        >
          <Icon name="plus" size={14} /> 회의실 추가
        </Link>
      </div>

      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['이름', '층', '수용인원', '특징', '상태', '액션'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.5px',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr
                key={room.id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  opacity: room.is_active ? 1 : 0.4,
                }}
              >
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {room.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={room.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--accent-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Icon name="building" size={14} />
                      </div>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{room.name}</span>
                  </div>
                </td>
                <td style={tdStyle}><span style={{ fontSize: 13, color: 'var(--text-2)' }}>{room.floor}</span></td>
                <td style={tdStyle}><span style={{ fontSize: 13, color: 'var(--text-2)' }}>{room.capacity}명</span></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(room.features ?? []).slice(0, 3).map((f) => (
                      <span key={f} style={{ padding: '2px 7px', borderRadius: 10, fontSize: 11, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                        {f}
                      </span>
                    ))}
                    {(room.features ?? []).length > 3 && (
                      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>+{room.features.length - 3}</span>
                    )}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: room.is_active ? 'var(--accent-soft)' : '#f1f5f9',
                      color: room.is_active ? 'var(--accent)' : 'var(--text-2)',
                    }}
                  >
                    {room.is_active ? '활성' : '비활성'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link
                      href={`/admin/rooms/${room.id}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '5px 10px', borderRadius: 7, fontSize: 12,
                        border: '1px solid var(--border)', color: 'var(--text-2)',
                        textDecoration: 'none',
                      }}
                    >
                      <Icon name="edit" size={12} /> 수정
                    </Link>
                    {room.is_active && <RoomDeleteButton roomId={room.id} roomName={room.name} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rooms.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-2)', fontSize: 13 }}>
            등록된 회의실이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px', verticalAlign: 'middle',
};
