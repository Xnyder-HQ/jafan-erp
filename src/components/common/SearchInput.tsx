import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Close } from '@carbon/icons-react';

interface SearchFormData {
  search: string;
}

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  minLength?: number;
  maxLength?: number;
  className?: string;
  width?: string;
}

const SearchInput = ({
  placeholder = 'Search...',
  value: externalValue,
  onChange,
  onSearch,
  debounceMs = 300,
  minLength = 2,
  maxLength = 500,
  className = '',
  width = '300px',
}: SearchInputProps) => {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const onChangeRef = useRef(onChange);
  const onSearchRef = useRef(onSearch);

  onChangeRef.current = onChange;
  onSearchRef.current = onSearch;

  const { register, watch, setValue, reset } = useForm<SearchFormData>({
    defaultValues: {
      search: externalValue || '',
    },
  });

  const searchValue = watch('search');

  useEffect(() => {
    if (externalValue !== undefined && externalValue !== searchValue) {
      setValue('search', externalValue);
    }
  }, [externalValue]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChangeRef.current(searchValue);

      if (onSearchRef.current && (searchValue.length >= minLength || searchValue.length === 0)) {
        onSearchRef.current(searchValue);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue, debounceMs, minLength]);

  const handleClear = () => {
    reset({ search: '' });
    onChangeRef.current('');
    if (onSearchRef.current) {
      onSearchRef.current('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchRef.current && searchValue.length >= minLength) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      onSearchRef.current(searchValue);
    }
  };

  return (
    <div className={`xui-pos-relative ${className}`} style={{ width }}>
      <span
        className="icon-container xui-pos-absolute"
        style={{
          color: 'var(--neutral-400)',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <Search size={18} />
      </span>
      <input
        type="text"
        placeholder={placeholder}
        {...register('search', {
          maxLength: maxLength,
        })}
        onKeyDown={handleKeyDown}
        className="xui-form-input"
        style={{ paddingLeft: '40px', paddingRight: searchValue ? '36px' : '12px' }}
      />
      {searchValue && (
        <button
          type="button"
          onClick={handleClear}
          className="xui-pos-absolute xui-d-flex xui-flex-ai-center xui-flex-jc-center xui-cursor-pointer"
          style={{
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--neutral-400)',
            padding: '4px',
          }}
        >
          <Close size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
