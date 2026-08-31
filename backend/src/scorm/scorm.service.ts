import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrollmentStatus } from '@prisma/client';
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../common/prisma/prisma.service';
import { parseManifest } from './manifest-parser';
import { CommitCmiDto } from './dto/scorm-cmi.dto';

/**
 * SCORM 1.2 package management (ELR_CNT_001/005/006) and Run-Time
 * Environment data persistence (ELR_LMS_003/006). The RTE endpoints in
 * ScormController map 1:1 onto the SCORM 1.2 JavaScript API the frontend
 * player exposes as `window.API` (LMSInitialize/LMSGetValue/LMSSetValue/
 * LMSCommit/LMSFinish).
 */
@Injectable()
export class ScormService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get storageRoot(): string {
    return this.config.get<string>('scorm.storagePath')!;
  }

  async uploadPackage(courseId: string, zipBuffer: Buffer, uploadedBy: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const zip = new AdmZip(zipBuffer);
    const manifestEntry = zip.getEntry('imsmanifest.xml');
    if (!manifestEntry) {
      throw new BadRequestException('Package is missing imsmanifest.xml at its root — not a valid SCORM package.');
    }
    const manifestXml = manifestEntry.getData().toString('utf-8');
    const manifest = await parseManifest(manifestXml);

    const lastVersion = await this.prisma.scormPackage.findFirst({
      where: { courseId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;

    const destDir = path.join(this.storageRoot, courseId, String(nextVersion));
    fs.mkdirSync(destDir, { recursive: true });
    zip.extractAllTo(destDir, true);

    return this.prisma.scormPackage.create({
      data: {
        courseId,
        version: nextVersion,
        scormVersion: manifest.scormVersion,
        manifestIdentifier: manifest.identifier,
        entryPoint: manifest.entryPoint,
        storagePath: destDir,
        uploadedBy,
      },
    });
  }

  async getLaunchablePackage(courseId: string) {
    const pkg = await this.prisma.scormPackage.findFirst({
      where: { courseId },
      orderBy: { version: 'desc' },
    });
    if (!pkg) throw new NotFoundException('No SCORM package uploaded for this course');
    return pkg;
  }

  /** LMSInitialize: returns the last-committed CMI state, or a blank slate. */
  async initialize(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const latest = await this.prisma.scormTrackingRecord.findFirst({
      where: { enrollmentId },
      orderBy: { lastAccessedAt: 'desc' },
    });

    if (enrollment.status === EnrollmentStatus.NOT_STARTED) {
      await this.prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: EnrollmentStatus.IN_PROGRESS },
      });
    }

    return (
      latest?.cmiData ?? {
        'cmi.core.lesson_status': 'not attempted',
        'cmi.core.score.raw': '',
        'cmi.suspend_data': '',
        'cmi.core.session_time': '00:00:00',
      }
    );
  }

  /** LMSCommit / LMSFinish: persists the full CMI data set for this attempt. */
  async commit(enrollmentId: string, dto: CommitCmiDto) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    await this.prisma.scormTrackingRecord.create({
      data: {
        enrollmentId,
        cmiData: dto.cmiData as any,
        lessonStatus: dto.lessonStatus,
        scoreRaw: dto.scoreRaw,
        sessionTime: dto.sessionTime,
        suspendData: dto.suspendData,
      },
    });

    const status = this.mapLessonStatus(dto.lessonStatus);
    if (status) {
      await this.prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status,
          scoreRaw: dto.scoreRaw,
          completedAt: status === EnrollmentStatus.COMPLETED ? new Date() : undefined,
        },
      });
    }

    return { ok: true };
  }

  private mapLessonStatus(lessonStatus?: string): EnrollmentStatus | undefined {
    switch (lessonStatus) {
      case 'completed':
      case 'passed':
        return EnrollmentStatus.COMPLETED;
      case 'failed':
        return EnrollmentStatus.FAILED;
      case 'incomplete':
      case 'browsed':
        return EnrollmentStatus.IN_PROGRESS;
      default:
        return undefined;
    }
  }
}
