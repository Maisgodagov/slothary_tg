import { useState, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { login, register, selectAuth } from '../slice';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';

interface LoginFormProps {
  mode?: 'login' | 'register';
}

export function LoginForm({ mode = 'login' }: LoginFormProps) {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'register') {
      dispatch(register({ email, password, fullName }));
    } else {
      dispatch(login({ email, password }));
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
      {mode === 'register' && (
        <Input label="Имя" placeholder="Имя" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      )}
      <Input label="Email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input
        label="Пароль"
        placeholder="••••••"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" loading={auth.status === 'loading'}>
        {mode === 'register' ? 'Регистрация' : 'Войти'}
      </Button>
      {auth.error && (
        <div style={{ color: 'var(--tg-danger)', fontSize: 13, fontWeight: 600 }}>
          {auth.error}
        </div>
      )}
    </form>
  );
}
