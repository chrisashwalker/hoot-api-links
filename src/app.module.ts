import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PollingService } from "./polling.service";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PollingService],
})
export class AppModule {}
