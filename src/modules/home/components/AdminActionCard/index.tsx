import type { AdminActionCardProps } from './types';
import { CardButton, CardDescription, CardTitle } from './styles';

export function AdminActionCard({ title, description, onClick, children }: AdminActionCardProps) {
  return (
    <CardButton type="button" onClick={onClick}>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
      {children}
    </CardButton>
  );
}
