import type { ReactNode } from 'react';

export type AdminActionCardProps = {
  title: string;
  description?: string;
  onClick: () => void;
  children?: ReactNode;
};
