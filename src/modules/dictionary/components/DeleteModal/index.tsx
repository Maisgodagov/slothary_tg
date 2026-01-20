import type { DeleteModalProps } from './types';
import { Actions, CancelButton, ConfirmButton, Description, Modal, Overlay, Title } from './styles';

export function DeleteModal({ open, word, translation, onCancel, onConfirm }: DeleteModalProps) {
  if (!open) return null;

  return (
    <Overlay onClick={onCancel}>
      <Modal onClick={(event) => event.stopPropagation()}>
        <Title>Удалить слово?</Title>
        <Description>
          {word} - {translation}
        </Description>
        <Actions>
          <CancelButton type="button" onClick={onCancel}>
            Отмена
          </CancelButton>
          <ConfirmButton type="button" onClick={onConfirm}>
            Удалить
          </ConfirmButton>
        </Actions>
      </Modal>
    </Overlay>
  );
}
