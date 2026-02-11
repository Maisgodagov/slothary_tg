import { Icon } from '../../../../shared/ui/Icon';
import type { SearchBarProps } from './types';
import {
  ClearButton,
  HistoryButton,
  HistoryDropdown,
  SearchButton,
  SearchFieldWrapper,
  SearchInput,
  SearchRow,
} from './styles';

export function SearchBar({
  query,
  onQueryChange,
  onSubmit,
  onClear,
  historyItems,
  historyOpen,
  onOpenHistory,
  onCloseHistory,
  onSelectHistory,
  loading,
}: SearchBarProps) {
  return (
    <SearchRow>
      <SearchFieldWrapper>
        <SearchInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Введите слово или фразу"
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit();
          }}
          onFocus={() => {
            if (historyItems.length > 0) onOpenHistory();
          }}
          onBlur={onCloseHistory}
          $historyOpen={historyOpen}
        />
        {query.trim().length > 0 && (
          <ClearButton type="button" onClick={onClear} aria-label="Очистить">
            <Icon name="close" size={16} />
          </ClearButton>
        )}
        {historyOpen && historyItems.length > 0 && (
          <HistoryDropdown onMouseDown={(event) => event.preventDefault()}>
            {historyItems.map((item) => (
              <HistoryButton
                key={item}
                type="button"
                onClick={() => onSelectHistory(item)}
              >
                <Icon name="history" size={14} color="var(--tg-subtle)" />
                {item}
              </HistoryButton>
            ))}
          </HistoryDropdown>
        )}
      </SearchFieldWrapper>
      <SearchButton
        type="button"
        onClick={onSubmit}
        disabled={loading}
        aria-label="Найти фрагменты"
        $loading={loading}
      >
        <Icon name="search" size={20} color="var(--tg-text)" />
      </SearchButton>
    </SearchRow>
  );
}
