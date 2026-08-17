const MIN_PART_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PART_SIZE_BYTES = 5 * 1024 * 1024 * 1024;
const MAX_PARTS = 10_000;

export function partSize(fileSizeBytes: number): number {
  const requiredForPartCap = Math.ceil(fileSizeBytes / MAX_PARTS);
  return Math.min(
    MAX_PART_SIZE_BYTES,
    Math.max(MIN_PART_SIZE_BYTES, requiredForPartCap),
  );
}
