import { useState } from "react";
import { createPortal } from "react-dom";
import * as S from "./styles";

type UploadPayload = {
  file: File;
  title?: string;
  author?: string;
  description?: string;
  language?: string;
};

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: UploadPayload) => Promise<void> | void;
}

export function UploadModal({ open, onClose, onSubmit }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await onSubmit({
        file,
        title: title.trim() || undefined,
        author: author.trim() || undefined,
        description: description.trim() || undefined,
        language: language.trim() || "en",
      });
      setTitle("");
      setAuthor("");
      setDescription("");
      setFile(null);
      setLanguage("en");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <S.Backdrop onClick={onClose}>
      <S.Card onClick={(event) => event.stopPropagation()}>
        <S.Title>Добавить книгу</S.Title>
        <S.Label>
          EPUB файл
          <S.Input
            type="file"
            accept=".epub"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </S.Label>
        <S.Label>
          Название (опционально)
          <S.Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </S.Label>
        <S.Label>
          Автор
          <S.Input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </S.Label>
        <S.Label>
          Описание
          <S.Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </S.Label>
        <S.Label>
          Язык
          <S.Input value={language} onChange={(e) => setLanguage(e.target.value)} />
        </S.Label>
        <S.Actions>
          <S.Button onClick={onClose}>Отмена</S.Button>
          <S.Button $primary onClick={handleSubmit} disabled={loading}>
            {loading ? "Сохраняем..." : "Сохранить"}
          </S.Button>
        </S.Actions>
      </S.Card>
    </S.Backdrop>
  );

  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}
