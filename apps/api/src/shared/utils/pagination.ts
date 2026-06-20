export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getPagination(params: PaginationParams): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, params.page);
  const limit = Math.min(100, Math.max(1, params.limit));

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit
  };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

