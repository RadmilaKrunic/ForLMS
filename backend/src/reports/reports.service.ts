import { Injectable } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { PrismaService } from '../common/prisma/prisma.service';

/** ELR_LMS_006: activity tracking & basic reporting for administrators. */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async courseCompletion(courseId: string) {
    return this.prisma.enrollment.findMany({
      where: { courseId },
      include: { user: true },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async userActivity(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: true, tracking: { orderBy: { lastAccessedAt: 'desc' }, take: 1 } },
    });
  }

  async courseCompletionCsv(courseId: string): Promise<string> {
    const rows = await this.courseCompletion(courseId);
    const records = rows.map((r) => ({
      user: r.user.displayName,
      username: r.user.username,
      status: r.status,
      score: r.scoreRaw ?? '',
      assignedAt: r.assignedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? '',
    }));
    return stringify(records, {
      header: true,
      columns: ['user', 'username', 'status', 'score', 'assignedAt', 'completedAt'],
    });
  }
}
