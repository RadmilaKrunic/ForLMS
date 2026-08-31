import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post()
  @Roles('Administrator', 'ContentManager')
  assign(@Body() dto: CreateEnrollmentDto, @CurrentUser() user: { userId: string }) {
    return this.enrollments.assign(dto, user.userId);
  }

  @Get('me')
  findMine(@CurrentUser() user: { userId: string }) {
    return this.enrollments.findForUser(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollments.findOne(id);
  }
}
