import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ScormService } from './scorm.service';
import { CommitCmiDto } from './dto/scorm-cmi.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScormController {
  constructor(private readonly scorm: ScormService) {}

  /** ELR_LMS_008: content managers upload new SCORM packages without vendor involvement. */
  @Post('courses/:courseId/scorm-package')
  @Roles('Administrator', 'ContentManager')
  @UseInterceptors(FileInterceptor('file'))
  uploadPackage(
    @Param('courseId') courseId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { userId: string },
  ) {
    return this.scorm.uploadPackage(courseId, file.buffer, user.userId);
  }

  @Get('courses/:courseId/scorm-package/launch-info')
  getLaunchInfo(@Param('courseId') courseId: string) {
    return this.scorm.getLaunchablePackage(courseId);
  }

  // --- SCORM 1.2 Run-Time Environment endpoints, called by the frontend
  // ScormPlayer's window.API adapter (ELR_LMS_003) ---

  @Post('scorm/enrollments/:enrollmentId/initialize')
  initialize(@Param('enrollmentId') enrollmentId: string) {
    return this.scorm.initialize(enrollmentId);
  }

  @Post('scorm/enrollments/:enrollmentId/commit')
  commit(@Param('enrollmentId') enrollmentId: string, @Body() dto: CommitCmiDto) {
    return this.scorm.commit(enrollmentId, dto);
  }
}
