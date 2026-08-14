import { Global, Module } from '@nestjs/common';
import { createS3ObjectStorage } from '../s3/s3-object-storage';
import { readS3ObjectStorageConfig } from './env';
import { OBJECT_STORAGE } from './tokens';

@Global()
@Module({
  providers: [
    {
      provide: OBJECT_STORAGE,
      useFactory: () => createS3ObjectStorage(readS3ObjectStorageConfig()),
    },
  ],
  exports: [OBJECT_STORAGE],
})
export class ObjectStorageModule {}
