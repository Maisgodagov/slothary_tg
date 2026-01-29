import { useState } from "react";
import * as S from "./styles";

type UploadPayload = {
  title: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  fileUrl: string;
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
  const [coverUrl, setCoverUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !fileUrl.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        author: author.trim() || undefined,
        description: description.trim() || undefined,
        coverUrl: coverUrl.trim() || undefined,
        fileUrl: fileUrl.trim(),
        language: language.trim() || "en",
      });
      setTitle("");
      setAuthor("");
      setDescription("");
      setCoverUrl("");
      setFileUrl("");
      setLanguage("en");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <S.Backdrop onClick={onClose}>
      <S.Card onClick={(event) => event.stopPropagation()}>
        <S.Title>Добавить книгу</S.Title>
        <S.Label>
          Название
          <S.Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </S.Label>
        <S.Label>
          Автор
          <S.Input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </S.Label>
        <S.Label>
          Обложка (URL)
          <S.Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
        </S.Label>
        <S.Label>
          Файл книги (URL)
          <S.Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
        </S.Label>
        <S.Hint>
          Пока используем прямой URL на файл. Для S3 можно подключить presigned URL.
        </S.Hint>
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
}
