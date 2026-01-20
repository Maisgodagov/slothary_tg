import { Button } from '../../../../shared/ui/Button';
import { LoginForm } from '../../../../features/auth/components/LoginForm';
import type { AuthCardProps } from './types';
import { AuthCardWrapper, HintText, ModeRow } from './styles';

export function AuthCard({ mode, onModeChange }: AuthCardProps) {
  return (
    <AuthCardWrapper>
      <ModeRow>
        <Button variant={mode === 'login' ? 'primary' : 'ghost'} onClick={() => onModeChange('login')}>
          Вход
        </Button>
        <Button
          variant={mode === 'register' ? 'primary' : 'ghost'}
          onClick={() => onModeChange('register')}
        >
          Регистрация
        </Button>
      </ModeRow>
      <LoginForm mode={mode} />
      <HintText>
        Если вы открыли приложение вне Telegram, используйте вход по логину и паролю. В Telegram авторизация происходит
        автоматически.
      </HintText>
    </AuthCardWrapper>
  );
}
