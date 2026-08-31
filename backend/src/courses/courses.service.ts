import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';

/** ELR_CNT_004/ELR_LMS_008: self-service course catalog management. */
@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      include: { packages: { orderBy: { version: 'desc' }, take: 1 } },
    });
  }

  findAll() {
    return this.prisma.course.findMany({
      include: { packages: { orderBy: { version: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { packages: { orderBy: { version: 'desc' } } },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  create(dto: CreateCourseDto, createdBy: string) {
    return this.prisma.course.create({
      data: { ...dto, createdBy },
    });
  }

  publish(id: string) {
    return this.prisma.course.update({ where: { id }, data: { status: CourseStatus.PUBLISHED } });
  }

  archive(id: string) {
    return this.prisma.course.update({ where: { id }, data: { status: CourseStatus.ARCHIVED } });
  }
}
