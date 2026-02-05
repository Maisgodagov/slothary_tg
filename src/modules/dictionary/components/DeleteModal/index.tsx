import type { DeleteModalProps } from "./types";
import { createPortal } from "react-dom";
import {
  Actions,
  CancelButton,
  ConfirmButton,
  Description,
  Modal,
  Overlay,
  Title,
} from "./styles";

export function DeleteModal({
  open,
  word,
  translation,
  onCancel,
  onConfirm,
}: DeleteModalProps) {
  if (!open) return null;

  return createPortal(
    <Overlay onClick={onCancel}>
      <Modal onClick={(event) => event.stopPropagation()}>
        <Title>Удалить из словаря?</Title>
        <Description>
          {word} - {translation}
        </Description>
        <Actions>
          <CancelButton type="button" onClick={onCancel}>
            Нет
          </CancelButton>
          <ConfirmButton type="button" onClick={onConfirm}>
            Удалить
          </ConfirmButton>
        </Actions>
      </Modal>
    </Overlay>,
    document.body,
  );
}
