import { AppError } from "../../shared/errors/AppError";
import { Prisma, type PrismaClient } from "../../shared/prisma";
import { buildPaginationMeta, getPagination, type PaginationMeta } from "../../shared/utils/pagination";
import type { CreateVehicleInput, UpdateVehicleInput, VehiclesQueryInput } from "./vehicles.schema";

export interface PaginatedVehicles {
  data: unknown[];
  meta: PaginationMeta;
}

export class VehiclesService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAll(query: VehiclesQueryInput): Promise<PaginatedVehicles> {
    const pagination = getPagination(query);
    const where: Prisma.VehicleWhereInput = {};

    if (query.plate !== undefined) {
      where.plate = { contains: query.plate.trim().toUpperCase(), mode: "insensitive" };
    }
    const [total, vehicles] = await this.prisma.$transaction([
      this.prisma.vehicle.count({ where }),
      this.prisma.vehicle.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: { subjects: { include: { subject: true } } }
      })
    ]);

    return { data: vehicles, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  public async findById(id: string): Promise<unknown> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { subjects: { include: { subject: true } } }
    });

    if (vehicle === null) {
      throw new AppError(404, "VEHICLE_NOT_FOUND", "No se encontró el vehículo solicitado.");
    }

    return vehicle;
  }

  public async create(data: CreateVehicleInput): Promise<unknown> {
    return this.prisma.vehicle.create({
      data: {
        brand: data.brand,
        model: data.model,
        color: data.color,
        plate: data.plate.trim().toUpperCase(),
        year: data.year ?? null,
        notes: data.notes ?? null
      }
    });
  }

  public async update(id: string, data: UpdateVehicleInput): Promise<unknown> {
    await this.findById(id);

    const updateData: Prisma.VehicleUpdateInput = {};

    if (data.plate !== undefined) updateData.plate = data.plate.trim().toUpperCase();
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.vehicle.update({ where: { id }, data: updateData });
  }

  public async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.vehicle.delete({ where: { id } });
  }
}
