import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '../../../../shared/ui/Button';
import { ActionsRow, MessageBox, MessageSubtitle, MessageTitle, PanelRoot } from './styles';
import type { BottomActionPanelProps } from './types';

export function BottomActionPanel({
  visible,
  isCorrect,
  title,
  subtitle,
  onNext,
  buttonLabel,
  nextDisabled,
  hideMessageBox,
  submitting,
  actions,
}: BottomActionPanelProps) {
  if (!visible) return null;
  if (typeof document === 'undefined') return null;

  const hasCustomActions = Boolean(actions?.length);
  const baseActionStyle = {
    minHeight: 50,
    fontSize: 20,
    fontWeight: 700,
    borderRadius: 14,
    borderStyle: 'solid' as const,
    borderWidth: '3px',
    color: 'var(--tg-text)',
  };

  return createPortal(
    <PanelRoot>
      {!hideMessageBox ? (
        <MessageBox $correct={isCorrect}>
          <MessageTitle>
            {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {title}
          </MessageTitle>
          {subtitle ? <MessageSubtitle>{subtitle}</MessageSubtitle> : null}
        </MessageBox>
      ) : null}

      {hasCustomActions ? (
        <ActionsRow $count={actions?.length ?? 1}>
          {actions?.map((action) => (
            <Button
              key={action.key}
              onClick={action.onClick}
              disabled={submitting}
              variant={action.variant ?? 'primary'}
              style={{
                ...baseActionStyle,
                ...action.style,
              }}
            >
              {action.label}
            </Button>
          ))}
        </ActionsRow>
      ) : (
        <Button
          onClick={onNext}
          disabled={submitting || nextDisabled}
          style={{
            ...baseActionStyle,
            fontSize: 22,
            borderColor: 'var(--tg-button-primary-border)',
            background: 'var(--tg-button-primary-bg)',
            color: 'var(--tg-button-primary-text)',
            boxShadow: '0 4px 0 var(--tg-button-primary-shadow), 0 8px 14px var(--tg-shadow-strong)',
          }}
        >
          {buttonLabel ?? "Далее"}
        </Button>
      )}
    </PanelRoot>,
    document.body,
  );
}

export default BottomActionPanel;

