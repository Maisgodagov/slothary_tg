import type { AdminLinkProps } from './types';
import { AdminButton, AdminLinkWrapper } from './styles';

export function AdminLink({ onClick }: AdminLinkProps) {
  return (
    <AdminLinkWrapper>
      <AdminButton type="button" onClick={onClick}>
        Админка
      </AdminButton>
    </AdminLinkWrapper>
  );
}
