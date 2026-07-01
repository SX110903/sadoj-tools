import { useUserAcademyRecord } from "../../hooks/useAcademy";
import { EmptyState, RetryButton, SkeletonBlock } from "../ui";
import { AcademyRecordPanel } from "./AcademyRecordPanel";

export function UserAcademyRecordSection({ userId }: { userId: string }): JSX.Element {
  const { record, errorMessage, isLoading, refresh } = useUserAcademyRecord(userId);
  if (isLoading) return <SkeletonBlock height={260} />;
  if (errorMessage !== null || record === null) return <EmptyState title={errorMessage ?? "No hay registro académico."} action={<RetryButton onRetry={() => void refresh()} />} />;
  return <AcademyRecordPanel record={record} heading="Registro académico" />;
}
