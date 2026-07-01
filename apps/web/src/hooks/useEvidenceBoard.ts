import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/auth-context";
import { apiRequest } from "../services/api";
import type { BoardCardType, BoardEntityType, BoardStep, BoardStepStatus, EvidenceBoard } from "../types/sadoj";

export type EvidenceBoardScopeParam = "subject" | "investigation" | "global";

export interface CreateBoardCardPayload {
  type: BoardCardType;
  title?: string;
  text?: string | null;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  fileId?: string | null;
  imageUrl?: string | null;
  eventDate?: string | null;
  entityType?: BoardEntityType | null;
  entityId?: string | null;
}

export type UpdateBoardCardPayload = Omit<Partial<CreateBoardCardPayload>, "type">;

export interface CreateBoardConnectionPayload {
  fromCardId: string;
  toCardId: string;
  label?: string | null;
  color?: string;
}

export interface UpdateBoardConnectionPayload {
  label?: string | null;
  color?: string;
}

export interface BoardPositionPayload {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
}

export interface CreateBoardStepPayload {
  title: string;
  description?: string | null;
  status?: BoardStepStatus;
  fileId?: string | null;
  imageUrl?: string | null;
}

export type UpdateBoardStepPayload = Partial<CreateBoardStepPayload>;

interface ScopedBoardOptions {
  scope: "subject" | "investigation";
  targetId: string;
}

interface GlobalBoardOptions {
  scope: "global";
  boardId: string | null;
}

export type UseEvidenceBoardOptions = ScopedBoardOptions | GlobalBoardOptions;

export function useEvidenceBoard(options: UseEvidenceBoardOptions) {
  const { accessToken } = useAuth();
  const [board, setBoard] = useState<EvidenceBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    if (options.scope === "global") {
      return options.boardId === null ? null : `/api/boards/global/${encodeURIComponent(options.boardId)}`;
    }

    return `/api/boards/${options.scope}/${encodeURIComponent(options.targetId)}`;
  }, [options]);

  const loadBoard = useCallback(async (): Promise<void> => {
    if (endpoint === null) {
      setBoard(null);
      setIsLoading(false);
      setLoadErrorMessage(null);
      setActionErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setLoadErrorMessage(null);
    setActionErrorMessage(null);
    const result = await apiRequest<EvidenceBoard>(endpoint, {}, accessToken);

    if (result.error) {
      setBoard(null);
      setLoadErrorMessage(result.message);
      setIsLoading(false);
      return;
    }

    setBoard(result.data);
    setIsLoading(false);
  }, [accessToken, endpoint]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const requestBoardMutation = useCallback(
    async (path: string, init: RequestInit, suppressToast = false): Promise<EvidenceBoard | null> => {
      setIsMutating(true);
      setActionErrorMessage(null);
      const result = await apiRequest<EvidenceBoard>(path, { ...init, suppressToast }, accessToken);
      setIsMutating(false);

      if (result.error) {
        setActionErrorMessage(result.message);
        return null;
      }

      setBoard(result.data);
      setActionErrorMessage(null);
      return result.data;
    },
    [accessToken]
  );

  const mutateBoard = useCallback(
    async (path: string, init: RequestInit, suppressToast = false): Promise<boolean> => {
      return (await requestBoardMutation(path, init, suppressToast)) !== null;
    },
    [requestBoardMutation]
  );

  const createCard = useCallback(
    async (payload: CreateBoardCardPayload): Promise<boolean> => {
      if (board === null) return false;
      return mutateBoard(`/api/boards/${board.id}/cards`, { method: "POST", body: JSON.stringify(payload) });
    },
    [board, mutateBoard]
  );

  const updateCard = useCallback(
    async (cardId: string, payload: UpdateBoardCardPayload): Promise<boolean> => {
      if (board === null) return false;
      return mutateBoard(`/api/boards/${board.id}/cards/${cardId}`, { method: "PATCH", body: JSON.stringify(payload) });
    },
    [board, mutateBoard]
  );

  const updatePositions = useCallback(
    async (cards: readonly BoardPositionPayload[]): Promise<boolean> => {
      if (board === null || cards.length === 0) return false;
      return mutateBoard(`/api/boards/${board.id}/cards/positions`, { method: "PATCH", body: JSON.stringify({ cards }) }, true);
    },
    [board, mutateBoard]
  );

  const deleteCard = useCallback(
    async (cardId: string): Promise<boolean> => {
      if (board === null) return false;
      return mutateBoard(`/api/boards/${board.id}/cards/${cardId}`, { method: "DELETE" });
    },
    [board, mutateBoard]
  );

  const createConnection = useCallback(
    async (payload: CreateBoardConnectionPayload): Promise<boolean> => {
      if (board === null) return false;
      return mutateBoard(`/api/boards/${board.id}/connections`, { method: "POST", body: JSON.stringify(payload) });
    },
    [board, mutateBoard]
  );

  const updateConnection = useCallback(
    async (connectionId: string, payload: UpdateBoardConnectionPayload): Promise<boolean> => {
      if (board === null) return false;
      return mutateBoard(`/api/boards/${board.id}/connections/${connectionId}`, { method: "PATCH", body: JSON.stringify(payload) });
    },
    [board, mutateBoard]
  );

  const deleteConnection = useCallback(
    async (connectionId: string): Promise<boolean> => {
      if (board === null) return false;
      return mutateBoard(`/api/boards/${board.id}/connections/${connectionId}`, { method: "DELETE" });
    },
    [board, mutateBoard]
  );

  const createStep = useCallback(
    async (payload: CreateBoardStepPayload): Promise<BoardStep | null> => {
      if (board === null) return null;
      const existingIds = new Set(board.steps.map((step) => step.id));
      const updatedBoard = await requestBoardMutation(
        `/api/boards/${board.id}/steps`,
        { method: "POST", body: JSON.stringify(payload) }
      );

      return updatedBoard?.steps.find((step) => !existingIds.has(step.id)) ?? null;
    },
    [board, requestBoardMutation]
  );

  const updateStep = useCallback(
    async (stepId: string, payload: UpdateBoardStepPayload): Promise<boolean> => {
      if (board === null) return false;
      return mutateBoard(`/api/boards/${board.id}/steps/${stepId}`, { method: "PATCH", body: JSON.stringify(payload) });
    },
    [board, mutateBoard]
  );

  const reorderSteps = useCallback(
    async (orderedStepIds: readonly string[]): Promise<boolean> => {
      if (board === null || orderedStepIds.length === 0) return false;
      return mutateBoard(
        `/api/boards/${board.id}/steps/reorder`,
        { method: "PATCH", body: JSON.stringify({ orderedStepIds }) }
      );
    },
    [board, mutateBoard]
  );

  const deleteStep = useCallback(
    async (stepId: string): Promise<boolean> => {
      if (board === null) return false;
      return mutateBoard(`/api/boards/${board.id}/steps/${stepId}`, { method: "DELETE" });
    },
    [board, mutateBoard]
  );

  const uploadStepImage = useCallback(
    async (stepId: string, file: File): Promise<boolean> => {
      if (board === null) return false;
      const formData = new FormData();
      formData.append("file", file);
      return mutateBoard(`/api/boards/${board.id}/steps/${stepId}/image`, { method: "POST", body: formData });
    },
    [board, mutateBoard]
  );

  return {
    board,
    isLoading,
    isMutating,
    loadErrorMessage,
    actionErrorMessage,
    refresh: loadBoard,
    createCard,
    updateCard,
    updatePositions,
    deleteCard,
    createConnection,
    updateConnection,
    deleteConnection,
    createStep,
    updateStep,
    reorderSteps,
    deleteStep,
    uploadStepImage
  };
}
