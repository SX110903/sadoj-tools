import { z } from "zod";
import { isSafeImageUrl } from "../../shared/utils/url";

export const BoardScopeParamSchema = z.enum(["subject", "investigation"]);

export const ScopedBoardParamsSchema = z.object({
  scope: BoardScopeParamSchema,
  id: z.string().min(1)
});

export const BoardParamsSchema = z.object({
  boardId: z.string().min(1)
});

export const BoardCardParamsSchema = z.object({
  boardId: z.string().min(1),
  cardId: z.string().min(1)
});

export const BoardConnectionParamsSchema = z.object({
  boardId: z.string().min(1),
  connectionId: z.string().min(1)
});

export const BoardStepParamsSchema = z.object({
  boardId: z.string().min(1),
  stepId: z.string().min(1)
});

const BoardCoordinateSchema = z.number().finite().min(-100_000).max(100_000);
const BoardDimensionSchema = z.number().finite().min(120).max(2_000);
const BoardRotationSchema = z.number().finite().min(-15).max(15);
const BoardZIndexSchema = z.number().int().min(0).max(100_000);
const BoardColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "El color debe usar el formato hexadecimal #RRGGBB.");
const BoardImageUrlSchema = z.string().trim().max(2_048).refine(isSafeImageUrl, {
  message: "La imagen debe ser un enlace HTTP(S) directo a una imagen."
});

export const CreateGlobalBoardSchema = z.object({
  title: z.string().trim().min(1).max(120)
});

export const BoardCardTypeSchema = z.enum(["EVIDENCE", "NOTE", "ENTITY"]);
export const BoardEntityTypeSchema = z.enum(["subject", "investigation", "property", "organization", "document"]);

const OptionalNullableTextSchema = z.string().trim().max(4000).nullable().optional();

export const CreateBoardCardSchema = z.object({
  type: BoardCardTypeSchema,
  title: z.string().trim().min(1).max(160).optional(),
  text: OptionalNullableTextSchema,
  color: BoardColorSchema.optional(),
  x: BoardCoordinateSchema.optional(),
  y: BoardCoordinateSchema.optional(),
  width: BoardDimensionSchema.optional(),
  height: BoardDimensionSchema.optional(),
  rotation: BoardRotationSchema.optional(),
  zIndex: BoardZIndexSchema.optional(),
  fileId: z.string().min(1).nullable().optional(),
  imageUrl: BoardImageUrlSchema.nullable().optional(),
  eventDate: z.string().datetime().nullable().optional(),
  entityType: BoardEntityTypeSchema.nullable().optional(),
  entityId: z.string().min(1).nullable().optional()
});

export const UpdateBoardCardSchema = CreateBoardCardSchema.omit({ type: true }).partial();

export const BatchUpdateBoardCardsSchema = z.object({
  cards: z.array(
    z.object({
      id: z.string().min(1),
      x: BoardCoordinateSchema.optional(),
      y: BoardCoordinateSchema.optional(),
      width: BoardDimensionSchema.optional(),
      height: BoardDimensionSchema.optional(),
      rotation: BoardRotationSchema.optional(),
      zIndex: BoardZIndexSchema.optional()
    })
  ).min(1).refine(
    (cards) => new Set(cards.map((card) => card.id)).size === cards.length,
    "La lista de tarjetas no puede contener identificadores duplicados."
  )
});

export const CreateBoardConnectionSchema = z.object({
  fromCardId: z.string().min(1),
  toCardId: z.string().min(1),
  label: z.string().trim().max(80).nullable().optional(),
  color: BoardColorSchema.optional()
});

export const UpdateBoardConnectionSchema = z.object({
  label: z.string().trim().max(80).nullable().optional(),
  color: BoardColorSchema.optional()
});

export const BoardStepStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "DONE"]);

export const CreateBoardStepSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(8000).nullable().optional(),
  status: BoardStepStatusSchema.optional(),
  fileId: z.string().min(1).nullable().optional(),
  imageUrl: BoardImageUrlSchema.nullable().optional()
});

export const UpdateBoardStepSchema = CreateBoardStepSchema.partial();

export const ReorderBoardStepsSchema = z.object({
  orderedStepIds: z.array(z.string().min(1)).min(1).refine(
    (stepIds) => new Set(stepIds).size === stepIds.length,
    "La lista de pasos no puede contener identificadores duplicados."
  )
});

export type BoardScopeParam = z.infer<typeof BoardScopeParamSchema>;
export type CreateGlobalBoardInput = z.infer<typeof CreateGlobalBoardSchema>;
export type CreateBoardCardInput = z.infer<typeof CreateBoardCardSchema>;
export type UpdateBoardCardInput = z.infer<typeof UpdateBoardCardSchema>;
export type BatchUpdateBoardCardsInput = z.infer<typeof BatchUpdateBoardCardsSchema>;
export type CreateBoardConnectionInput = z.infer<typeof CreateBoardConnectionSchema>;
export type UpdateBoardConnectionInput = z.infer<typeof UpdateBoardConnectionSchema>;
export type CreateBoardStepInput = z.infer<typeof CreateBoardStepSchema>;
export type UpdateBoardStepInput = z.infer<typeof UpdateBoardStepSchema>;
export type ReorderBoardStepsInput = z.infer<typeof ReorderBoardStepsSchema>;
