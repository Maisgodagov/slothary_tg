import { Icon } from '../../../../shared/ui/Icon';
import type { StreakModalProps } from './types';
import { CloseButton, Message, Modal, ModalHeader, ModalTitle, Overlay } from './styles';

export function StreakModal({ open, message, onClose }: StreakModalProps) {
  if (!open) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(event) => event.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Серия дней</ModalTitle>
          <CloseButton type="button" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" size={18} />
          </CloseButton>
        </ModalHeader>
        <Message>{message}</Message>
      </Modal>
    </Overlay>
  );
}
