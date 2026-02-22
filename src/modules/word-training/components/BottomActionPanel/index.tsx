import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '../../../../shared/ui/Button';
import { MessageBox, MessageSubtitle, MessageTitle, PanelRoot } from './styles';
import type { BottomActionPanelProps } from './types';

export function BottomActionPanel({
  visible,
  isCorrect,
  title,
  subtitle,
  onNext,
  buttonLabel,
  hideMessageBox,
  submitting,
}: BottomActionPanelProps) {
  if (!visible) return null;
  if (typeof document === 'undefined') return null;

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

      <Button
        onClick={onNext}
        disabled={submitting}
        style={{
          minHeight: 50,
          fontSize: 22,
          fontWeight: 700,
          borderRadius: 14,
          background: '#2ea3ff',
          boxShadow: 'none',
        }}
      >
        {buttonLabel ?? 'Далее'}
      </Button>
    </PanelRoot>,
    document.body,
  );
}


export default BottomActionPanel;

