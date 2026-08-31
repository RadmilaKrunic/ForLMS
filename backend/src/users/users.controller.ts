import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateLocalUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('Administrator')
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  @Roles('Administrator')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post('local')
  @Roles('Administrator')
  createLocal(@Body() dto: CreateLocalUserDto) {
    return this.users.createLocal(dto);
  }

  @Patch(':id/roles/:roleName')
  @Roles('Administrator')
  assignRole(@Param('id') id: string, @Param('roleName') roleName: string) {
    return this.users.assignRole(id, roleName);
  }

  @Patch(':id/deactivate')
  @Roles('Administrator')
  deactivate(@Param('id') id: string) {
    return this.users.setActive(id, false);
  }
}
