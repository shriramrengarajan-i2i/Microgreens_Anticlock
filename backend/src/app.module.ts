import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigModule } from './config/app-config.module';
import { HealthModule } from './health/health.module';
import { HttpClientModule } from './http/http-client.module';

// Modular monolith: each feature lives in its own module and is imported here.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AppConfigModule,
    HttpClientModule,
    HealthModule,
  ],
})
export class AppModule {}
