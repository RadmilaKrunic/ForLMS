import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import configuration from './config/configuration';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ScormModule } from './scorm/scorm.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    // Serves extracted SCORM package files (HTML/JS/assets) to the player
    // iframe under /content/<courseId>/<version>/... (ELR_LMS_003/004).
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: config.get<string>('scorm.storagePath')!,
          serveRoot: '/content',
        },
      ],
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    ScormModule,
    EnrollmentsModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
