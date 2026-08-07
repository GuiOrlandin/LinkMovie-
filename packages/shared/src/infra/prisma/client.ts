import { PrismaClient } from '@prisma/client';

export type { Prisma } from '@prisma/client';
export { PrismaClient };

export function createPrismaClient(
  options?: ConstructorParameters<typeof PrismaClient>[0],
): PrismaClient {
  return new PrismaClient(options);
}
