import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { RoleType } from "../../types/sadoj";
import { roleLabel } from "../../utils/labels";

interface MentionCandidate {
  id: string;
  displayName: string;
  role: RoleType;
  avatar: string | null;
}

interface MentionTextareaProps {
  value: string;
  mentions: readonly string[];
  placeholder: string;
  rows?: number;
  className?: string;
  onChange: (value: string) => void;
  onMentionsChange: (mentions: string[]) => void;
  onBlur?: () => void;
}

export function MentionTextarea({
  value,
  mentions,
  placeholder,
  rows = 3,
  className,
  onChange,
  onMentionsChange,
  onBlur
}: MentionTextareaProps): JSX.Element {
  const { accessToken } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<MentionCandidate[]>([]);

  useEffect(() => {
    if (query === null) {
      setCandidates([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams({ limit: "8" });
      if (query.trim().length > 0) params.set("search", query.trim());
      void apiRequest<MentionCandidate[]>(`/api/users/mentions?${params.toString()}`, {}, accessToken).then((result) => {
        if (!result.error) setCandidates(result.data);
      });
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [accessToken, query]);

  const handleChange = (nextValue: string): void => {
    onChange(nextValue);
    const caret = textareaRef.current?.selectionStart ?? nextValue.length;
    const beforeCaret = nextValue.slice(0, caret);
    const match = /@([^\s@\[\]()]{0,40})$/.exec(beforeCaret);
    setQuery(match === null ? null : match[1] ?? "");
  };

  const selectCandidate = (candidate: MentionCandidate): void => {
    const textarea = textareaRef.current;
    const caret = textarea?.selectionStart ?? value.length;
    const beforeCaret = value.slice(0, caret);
    const afterCaret = value.slice(caret);
    const nextBeforeCaret = beforeCaret.replace(/@([^\s@\[\]()]{0,40})$/, `@[${candidate.displayName}](${candidate.id}) `);
    const nextValue = `${nextBeforeCaret}${afterCaret}`;

    onChange(nextValue);
    onMentionsChange(Array.from(new Set([...mentions, candidate.id])));
    setQuery(null);
    setCandidates([]);
    window.requestAnimationFrame(() => {
      textarea?.focus();
      const nextCaret = nextBeforeCaret.length;
      textarea?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  return (
    <div className="mention-field">
      <textarea
        ref={textareaRef}
        value={value}
        rows={rows}
        className={className}
        placeholder={placeholder}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={onBlur}
      />
      {query !== null && candidates.length > 0 ? (
        <div className="mention-popover">
          {candidates.map((candidate) => (
            <button key={candidate.id} type="button" onClick={() => selectCandidate(candidate)}>
              {candidate.avatar !== null ? <img src={candidate.avatar} alt="" /> : <span>{candidate.displayName.slice(0, 1)}</span>}
              <strong>{candidate.displayName}</strong>
              <small>{roleLabel(candidate.role)}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
