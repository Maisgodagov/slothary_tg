import { useState } from "react";
import { createPortal } from "react-dom";
import * as S from "./styles";

type UploadPayload = {
  file: File;
  cefrLevel?: string | null;
};

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: UploadPayload) => Promise<void>;
}

export function UploadModal({ open, onClose, onSubmit }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [cefrLevel, setCefrLevel] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(0);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!files.length) return;
    setLoading(true);
    setUploaded(0);
    try {
      for (let i = 0; i < files.length; i += 1) {
        await onSubmit({ file: files[i], cefrLevel: cefrLevel || null });
        setUploaded((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
      onClose();
      setFiles([]);
      setUploaded(0);
      setCefrLevel("");
    }
  };

  const modal = (
    <S.Backdrop onClick={onClose}>
      <S.Card onClick={(event) => event.stopPropagation()}>
        <S.Title>Добавить книгу</S.Title>
        <S.Label>
          FB2 файл
          <S.Input
            type="file"
            accept=".fb2"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </S.Label>
        <S.Label>
          Уровень CEFR
          <S.Select value={cefrLevel} onChange={(e) => setCefrLevel(e.target.value)}>
            <option value="">Не указан</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </S.Select>
        </S.Label>
        {loading && (
          <S.Hint>
            Загружено {uploaded}/{files.length}
          </S.Hint>
        )}
        <S.Actions>
          <S.Button onClick={onClose}>Отмена</S.Button>
          <S.Button $primary onClick={handleSubmit} disabled={loading}>
            {loading ? "Загружаем..." : "Загрузить"}
          </S.Button>
        </S.Actions>
      </S.Card>
    </S.Backdrop>
  );

  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}
