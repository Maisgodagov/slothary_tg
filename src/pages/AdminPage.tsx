import { useAppSelector } from '../app/hooks';
import { selectAuth } from '../features/auth/slice';
import { Button } from '../shared/ui/Button';

export default function AdminPage() {
  const auth = useAppSelector(selectAuth);
  const canModerate = auth.profile?.role === 'admin';

  return (
    <div className="section">
      <div className="section-header">
        <h3 style={{ margin: 0 }}>Админка</h3>
        <span className="badge">{canModerate ? 'Доступ открыт' : 'Только для админов'}</span>
      </div>
      {canModerate ? (
        <div style={{ color: 'var(--tg-subtle)', display: 'grid', gap: 8 }}>
          <div>Здесь можно будет перенести экраны модерации/словника из mobile app.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={() => window.open('/#/admin/dictionary', '_self')}>
              Словарь
            </Button>
            <Button variant="ghost" onClick={() => window.open('/#/admin/moderation', '_self')}>
              Модерация
            </Button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--tg-subtle)' }}>
            Добавьте здесь формы из `features/admin` и `features/video-learning` после переноса API-логики.
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--tg-subtle)' }}>Авторизуйтесь админским аккаунтом.</div>
      )}
    </div>
  );
}
