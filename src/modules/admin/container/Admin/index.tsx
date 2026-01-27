import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../../../app/hooks';
import { selectAuth } from '../../../../features/auth/slice';
import { Button } from '../../../../shared/ui/Button';
import { PageShell } from '../../../../shared/ui/PageShell';
import { AdminNavCard } from '../../components/AdminNavCard';
import { setLastVisitedAt } from '../../store/slice';
import { AdminWrapper, HeaderRow, SubtleText, Title } from './styles';

export function AdminContainer() {
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAdmin = auth.profile?.role === 'admin';

  useEffect(() => {
    dispatch(setLastVisitedAt(new Date().toISOString()));
  }, [dispatch]);

  if (!isAdmin) {
    return (
      <PageShell>
        <AdminWrapper>
          <HeaderRow>
            <Title>{'Админка'}</Title>
          </HeaderRow>
          <SubtleText>{'Доступно только для администратора.'}</SubtleText>
          <Button variant="ghost" onClick={() => navigate('/')}>
            {'На главную'}
          </Button>
        </AdminWrapper>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <AdminWrapper>
        <HeaderRow className="page-header">
          <Title>{'Админка'}</Title>
        </HeaderRow>

        <AdminNavCard
          title="Модерация сниппетов"
          description="Редактируйте и подтверждайте игровые сниппеты."
          onClick={() => navigate('/admin/game-snippets')}
        />
        <AdminNavCard
          title="Learning Path"
          description="Модули и уроки для нового пути обучения."
          onClick={() => navigate('/admin/learning-path')}
        />
        <AdminNavCard
          title="Пользователи"
          description="Просматривайте активность и меняйте роли пользователей."
          onClick={() => navigate('/admin/users')}
        />
      </AdminWrapper>
    </PageShell>
  );
}
