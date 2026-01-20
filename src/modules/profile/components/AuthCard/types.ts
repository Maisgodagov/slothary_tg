export type AuthCardProps = {
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
};
