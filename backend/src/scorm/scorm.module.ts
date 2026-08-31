import { Module } from '@nestjs/common';
import { ScormService } from './scorm.service';
import { ScormController } from './scorm.controller';

@Module({
  providers: [ScormService],
  controllers: [ScormController],
  exports: [ScormService],
})
export class ScormModule {}
