import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/auth-context";
import { apiRequest, type ApiResult, type PaginationMeta } from "../services/api";
import type { Candidate, CandidateInterview, CandidateStatus, InterviewResult } from "../types/sadoj";

export interface CandidateFilters {
  search: string;
  status: CandidateStatus | "";
  page: number;
}

export interface CandidateInput {
  fullName: string;
  contact?: string;
  notes?: string;
}

export interface InterviewInput {
  interviewerId?: string;
  scheduledAt?: string | null;
  conductedAt?: string | null;
  score?: number | null;
  result?: InterviewResult;
  feedback?: string | null;
}

export interface ApprovalInput {
  username: string;
  password: string;
  email?: string;
  badgeNumber?: string;
}

interface CandidatesState {
  candidates: Candidate[];
  errorMessage: string | null;
  isLoading: boolean;
  meta: PaginationMeta | null;
  createCandidate: (input: CandidateInput) => Promise<ApiResult<Candidate>>;
  deleteCandidate: (id: string) => Promise<ApiResult<{ deleted: boolean }>>;
  refresh: () => Promise<void>;
}

export function useCandidates(filters: CandidateFilters): CandidatesState {
  const { accessToken } = useAuth();
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search.trim());
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [filters.search]);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const query = new URLSearchParams({ page: String(filters.page), limit: "50" });
    if (debouncedSearch !== "") query.set("search", debouncedSearch);
    if (filters.status !== "") query.set("status", filters.status);

    const result = await apiRequest<Candidate[]>(`/api/candidates?${query.toString()}`, { suppressToast: true }, accessToken);
    if (result.error) {
      setCandidates([]);
      setMeta(null);
      setErrorMessage(result.message);
    } else {
      setCandidates(result.data);
      setMeta(result.meta ?? null);
      setErrorMessage(null);
    }
    setIsLoading(false);
  }, [accessToken, debouncedSearch, filters.page, filters.status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createCandidate = async (input: CandidateInput): Promise<ApiResult<Candidate>> => {
    const result = await apiRequest<Candidate>("/api/candidates", { method: "POST", body: JSON.stringify(input) }, accessToken);
    if (!result.error) await refresh();
    return result;
  };

  const deleteCandidate = async (id: string): Promise<ApiResult<{ deleted: boolean }>> => {
    const result = await apiRequest<{ deleted: boolean }>(`/api/candidates/${encodeURIComponent(id)}`, { method: "DELETE" }, accessToken);
    if (!result.error) await refresh();
    return result;
  };

  return { candidates, errorMessage, isLoading, meta, createCandidate, deleteCandidate, refresh };
}

interface CandidateState {
  candidate: Candidate | null;
  errorMessage: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  saveInterview: (input: InterviewInput) => Promise<ApiResult<CandidateInterview>>;
  approve: (input: ApprovalInput) => Promise<ApiResult<Candidate>>;
  reject: (reason?: string) => Promise<ApiResult<Candidate>>;
}

export function useCandidate(candidateId: string): CandidateState {
  const { accessToken } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const result = await apiRequest<Candidate>(`/api/candidates/${encodeURIComponent(candidateId)}`, { suppressToast: true }, accessToken);
    if (result.error) {
      setCandidate(null);
      setErrorMessage(result.message);
    } else {
      setCandidate(result.data);
      setErrorMessage(null);
    }
    setIsLoading(false);
  }, [accessToken, candidateId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveInterview = async (input: InterviewInput): Promise<ApiResult<CandidateInterview>> => {
    const method = candidate?.interview === null ? "POST" : "PATCH";
    const result = await apiRequest<CandidateInterview>(
      `/api/candidates/${encodeURIComponent(candidateId)}/interview`,
      { method, body: JSON.stringify(input) },
      accessToken
    );
    if (!result.error) await refresh();
    return result;
  };

  const approve = async (input: ApprovalInput): Promise<ApiResult<Candidate>> => {
    const result = await apiRequest<Candidate>(
      `/api/candidates/${encodeURIComponent(candidateId)}/approve`,
      { method: "POST", body: JSON.stringify(input) },
      accessToken
    );
    if (!result.error) await refresh();
    return result;
  };

  const reject = async (reason?: string): Promise<ApiResult<Candidate>> => {
    const result = await apiRequest<Candidate>(
      `/api/candidates/${encodeURIComponent(candidateId)}/reject`,
      { method: "POST", body: JSON.stringify(reason === undefined ? {} : { reason }) },
      accessToken
    );
    if (!result.error) await refresh();
    return result;
  };

  return { candidate, errorMessage, isLoading, refresh, saveInterview, approve, reject };
}
