import { MediaJobStatus, UploadSessionStatus, VideoStatus } from './statuses';

describe('domain status enums (ADR 0006)', () => {
  it('defines Video statuses exactly', () => {
    expect(Object.values(VideoStatus).sort()).toEqual(
      ['FAILED', 'PROCESSING', 'READY', 'UPLOADING'].sort(),
    );
    expect(VideoStatus.UPLOADING).toBe('UPLOADING');
    expect(VideoStatus.PROCESSING).toBe('PROCESSING');
    expect(VideoStatus.READY).toBe('READY');
    expect(VideoStatus.FAILED).toBe('FAILED');
  });

  it('defines UploadSession statuses exactly', () => {
    expect(Object.values(UploadSessionStatus).sort()).toEqual(
      ['ABORTED', 'COMPLETED', 'IN_PROGRESS'].sort(),
    );
    expect(UploadSessionStatus.IN_PROGRESS).toBe('IN_PROGRESS');
    expect(UploadSessionStatus.COMPLETED).toBe('COMPLETED');
    expect(UploadSessionStatus.ABORTED).toBe('ABORTED');
  });

  it('defines MediaJob statuses exactly', () => {
    expect(Object.values(MediaJobStatus).sort()).toEqual(
      ['CANCELLED', 'FAILED', 'PENDING', 'RUNNING', 'SUCCEEDED'].sort(),
    );
    expect(MediaJobStatus.PENDING).toBe('PENDING');
    expect(MediaJobStatus.RUNNING).toBe('RUNNING');
    expect(MediaJobStatus.SUCCEEDED).toBe('SUCCEEDED');
    expect(MediaJobStatus.FAILED).toBe('FAILED');
    expect(MediaJobStatus.CANCELLED).toBe('CANCELLED');
  });
});
