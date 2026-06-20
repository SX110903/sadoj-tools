import type { FastifyReply, FastifyRequest } from "fastify";
import { CreateVehicleSchema, UpdateVehicleSchema, VehicleParamsSchema, VehiclesQuerySchema } from "./vehicles.schema";
import { VehiclesService } from "./vehicles.service";

export async function listVehiclesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = VehiclesQuerySchema.parse(request.query);
  const service = new VehiclesService(request.server.prisma);
  const result = await service.findAll(query);
  reply.send({ error: false, data: result.data, meta: result.meta });
}

export async function createVehicleController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateVehicleSchema.parse(request.body);
  const service = new VehiclesService(request.server.prisma);
  const vehicle = await service.create(body);
  reply.status(201).send({ error: false, data: vehicle, message: "Vehículo registrado correctamente." });
}

export async function getVehicleController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = VehicleParamsSchema.parse(request.params);
  const service = new VehiclesService(request.server.prisma);
  const vehicle = await service.findById(params.id);
  reply.send({ error: false, data: vehicle });
}

export async function updateVehicleController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = VehicleParamsSchema.parse(request.params);
  const body = UpdateVehicleSchema.parse(request.body);
  const service = new VehiclesService(request.server.prisma);
  const vehicle = await service.update(params.id, body);
  reply.send({ error: false, data: vehicle, message: "Vehículo actualizado correctamente." });
}

export async function deleteVehicleController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = VehicleParamsSchema.parse(request.params);
  const service = new VehiclesService(request.server.prisma);
  await service.delete(params.id);
  reply.send({ error: false, data: { deleted: true }, message: "Vehículo eliminado correctamente." });
}

