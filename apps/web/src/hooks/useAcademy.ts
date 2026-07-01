import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/auth-context";
import { apiRequest } from "../services/api";
import type {
  AcademyClass,
  AcademyContent,
  AcademyContentType,
  AcademyRecord,
  ClassAttendanceRoster
} from "../types/sadoj";

export interface AcademyContentInput {
  type: AcademyContentType;
  title: string;
  body?: string;
  videoUrl?: string;
  classId?: string;
}

export interface AcademyClassInput {
  title: string;
  description?: string | null;
  scheduledAt?: string | null;
}

interface AcademyContentState {
  content: AcademyContent[];
  errorMessage: string | null;
  isLoading: boolean;
  publishContent: (input: AcademyContentInput, file: File | null) => Promise<string | null>;
  deleteContent: (id: string) => Promise<string | null>;
  refresh: () => Promise<void>;
}

export function useAcademyContent(): AcademyContentState {
  const { accessToken } = useAuth();
  const [content, setContent] = useState<AcademyContent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const result = await apiRequest<AcademyContent[]>("/api/academy/content", { suppressToast: true }, accessToken);
    setContent(result.error ? [] : result.data);
    setErrorMessage(result.error ? result.message : null);
    setIsLoading(false);
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const publishContent = async (input: AcademyContentInput, file: File | null): Promise<string | null> => {
    const result = await apiRequest<AcademyContent>("/api/academy/content", { method: "POST", body: JSON.stringify(input) }, accessToken);
    if (result.error) return result.message;
    if (input.type === "DOCUMENT" && file !== null) {
      const uploadError = await uploadAcademyFile(result.data.id, file, accessToken);
      if (uploadError !== null) return uploadError;
    }
    await refresh();
    return null;
  };

  const deleteContent = async (id: string): Promise<string | null> => {
    const result = await apiRequest<{ deleted: boolean }>(`/api/academy/content/${encodeURIComponent(id)}`, { method: "DELETE" }, accessToken);
    if (result.error) return result.message;
    await refresh();
    return null;
  };

  return { content, errorMessage, isLoading, publishContent, deleteContent, refresh };
}

interface AcademyClassesState {
  classes: AcademyClass[];
  errorMessage: string | null;
  isLoading: boolean;
  updateClass: (id: string, input: AcademyClassInput) => Promise<string | null>;
  refresh: () => Promise<void>;
}

export function useAcademyClasses(): AcademyClassesState {
  const { accessToken } = useAuth();
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const result = await apiRequest<AcademyClass[]>("/api/academy/classes", { suppressToast: true }, accessToken);
    setClasses(result.error ? [] : result.data);
    setErrorMessage(result.error ? result.message : null);
    setIsLoading(false);
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateClass = async (id: string, input: AcademyClassInput): Promise<string | null> => {
    const result = await apiRequest<AcademyClass>(`/api/academy/classes/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }, accessToken);
    if (result.error) return result.message;
    await refresh();
    return null;
  };

  return { classes, errorMessage, isLoading, updateClass, refresh };
}

interface AcademyRecordState {
  record: AcademyRecord | null;
  errorMessage: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useAcademyRecord(): AcademyRecordState {
  const { accessToken } = useAuth();
  const [record, setRecord] = useState<AcademyRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const result = await apiRequest<AcademyRecord>("/api/academy/record/mine", { suppressToast: true }, accessToken);
    setRecord(result.error ? null : result.data);
    setErrorMessage(result.error ? result.message : null);
    setIsLoading(false);
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { record, errorMessage, isLoading, refresh };
}

export function useUserAcademyRecord(userId: string): AcademyRecordState {
  const { accessToken } = useAuth();
  const [record, setRecord] = useState<AcademyRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const result = await apiRequest<AcademyRecord>(`/api/users/${encodeURIComponent(userId)}/academy-record`, { suppressToast: true }, accessToken);
    setRecord(result.error ? null : result.data);
    setErrorMessage(result.error ? result.message : null);
    setIsLoading(false);
  }, [accessToken, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { record, errorMessage, isLoading, refresh };
}

interface ClassAttendanceState {
  roster: ClassAttendanceRoster | null;
  errorMessage: string | null;
  isLoading: boolean;
  save: (entries: Array<{ userId: string; present: boolean }>) => Promise<string | null>;
}

export function useClassAttendance(classId: string | null): ClassAttendanceState {
  const { accessToken } = useAuth();
  const [roster, setRoster] = useState<ClassAttendanceRoster | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(classId !== null);

  const load = useCallback(async (): Promise<void> => {
    if (classId === null) {
      setRoster(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await apiRequest<ClassAttendanceRoster>(`/api/academy/classes/${encodeURIComponent(classId)}/attendance`, { suppressToast: true }, accessToken);
    setRoster(result.error ? null : result.data);
    setErrorMessage(result.error ? result.message : null);
    setIsLoading(false);
  }, [accessToken, classId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (entries: Array<{ userId: string; present: boolean }>): Promise<string | null> => {
    if (classId === null) return "No se ha seleccionado una clase.";
    const result = await apiRequest<ClassAttendanceRoster>(
      `/api/academy/classes/${encodeURIComponent(classId)}/attendance`,
      { method: "POST", body: JSON.stringify({ entries }) },
      accessToken
    );
    if (result.error) return result.message;
    setRoster(result.data);
    return null;
  };

  return { roster, errorMessage, isLoading, save };
}

async function uploadAcademyFile(contentId: string, file: File, accessToken: string | null): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("targetType", "academyContent");
  formData.append("targetId", contentId);
  const result = await apiRequest<{ file: { id: string } }>(
    `/api/files/upload?targetType=academyContent&targetId=${encodeURIComponent(contentId)}`,
    { method: "POST", body: formData },
    accessToken
  );
  return result.error ? result.message : null;
}
