import { z } from "zod";

export const ExamQuestionSchema = z
  .object({
    q: z.string().trim().min(1).max(1000),
    o: z.array(z.string().trim().min(1).max(600)).min(2).max(6),
    a: z.number().int().min(0)
  })
  .refine((question) => question.a < question.o.length, {
    message: "El índice de la respuesta correcta está fuera de rango."
  });

export const ExamParamsSchema = z.object({ id: z.string().min(1) });
export const AssignmentIdParamsSchema = z.object({ aid: z.string().min(1) });
export const TakeParamsSchema = z.object({ assignmentId: z.string().min(1) });
export const UserExamResultsParamsSchema = z.object({ id: z.string().min(1) });

export const CreateExamSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional(),
  durationMin: z.number().int().min(1).max(180).optional(),
  passScore: z.number().int().min(1).max(100).optional(),
  questions: z.array(ExamQuestionSchema).min(1).max(200),
  isActive: z.boolean().optional()
});

export const UpdateExamSchema = CreateExamSchema.partial();

export const AssignExamSchema = z.object({ userId: z.string().min(1) });

export const UpdateAssignmentSchema = z.object({ status: z.enum(["OPEN", "CLOSED"]) });

export const SubmitExamSchema = z.object({
  startedAt: z.string().datetime().optional(),
  answers: z.array(
    z.object({
      q: z.string().min(1),
      selected: z.string().nullable()
    })
  )
});

export type ExamQuestionInput = z.infer<typeof ExamQuestionSchema>;
export type CreateExamInput = z.infer<typeof CreateExamSchema>;
export type UpdateExamInput = z.infer<typeof UpdateExamSchema>;
export type AssignExamInput = z.infer<typeof AssignExamSchema>;
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;
export type SubmitExamInput = z.infer<typeof SubmitExamSchema>;
