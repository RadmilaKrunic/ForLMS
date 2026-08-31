import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Administrator', 'ContentManager')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('courses/:courseId')
  courseCompletion(@Param('courseId') courseId: string) {
    return this.reports.courseCompletion(courseId);
  }

  @Get('courses/:courseId/export.csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="course-completion.csv"')
  exportCourseCompletion(@Param('courseId') courseId: string) {
    return this.reports.courseCompletionCsv(courseId);
  }

  @Get('users/:userId')
  userActivity(@Param('userId') userId: string) {
    return this.reports.userActivity(userId);
  }
}
