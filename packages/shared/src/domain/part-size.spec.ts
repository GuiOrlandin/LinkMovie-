import { partSize } from './part-size';

const MIB = 1024 * 1024;
const GIB = 1024 * 1024 * 1024;

describe('partSize', () => {
  it('uses the 5 MiB S3 minimum when the file is smaller than one part', () => {
    expect(partSize(1 * MIB)).toBe(5 * MIB);
  });

  it('keeps a typical file on the 5 MiB minimum while 10_000 parts are not needed', () => {
    expect(partSize(100 * MIB)).toBe(5 * MIB);
  });

  it('keeps a 2 GiB object within S3 part size and part count limits', () => {
    const size = partSize(2 * GIB);

    expect(size).toBe(5 * MIB);
    expect(Math.ceil((2 * GIB) / size)).toBeLessThanOrEqual(10_000);
  });
});
