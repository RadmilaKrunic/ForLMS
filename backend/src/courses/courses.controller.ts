import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  findPublished() {
    return this.courses.findPublished();
  }

  @Get('all')
  @Roles('Administrator', 'ContentManager')
  findAll() {
    return this.courses.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courses.findOne(id);
  }

  @Post()
  @Roles('Administrator', 'ContentManager')
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: { userId: string }) {
    return this.courses.create(dto, user.userId);
  }

  @Patch(':id/publish')
  @Roles('Administrator', 'ContentManager')
  publish(@Param('id') id: string) {
    return this.courses.publish(id);
  }

  @Patch(':id/archive')
  @Roles('Administrator', 'ContentManager')
  archive(@Param('id') id: string) {
    return this.courses.archive(id);
  }
}
