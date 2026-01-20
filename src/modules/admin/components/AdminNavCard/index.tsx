import type { AdminNavCardProps } from './types';
import { CardButton, CardDescription, CardTitle } from './styles';

export function AdminNavCard({ title, description, onClick }: AdminNavCardProps) {
  return (
    <CardButton type="button" onClick={onClick}>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardButton>
  );
}
