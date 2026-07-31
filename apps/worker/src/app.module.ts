import { Module } from '@nestjs/common';
import { SHARED_PACKAGE } from '@linkmovie/shared';

@Module({})
export class AppModule {
  static readonly sharedPackage = SHARED_PACKAGE;
}
