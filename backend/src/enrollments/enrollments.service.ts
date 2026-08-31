import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

/** ELR_LMS_005: assigning learners to courses. */
@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  assign(dto: CreateEnrollmentDto, assignedBy: string) {
    return this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId: dto.userId, courseId: dto.courseId } },
      update: {},
      create: { userId: dto.userId, courseId: dto.courseId, assignedBy },
    });
  }

  findForUser(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: true },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: { course: true, user: true },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }
}
