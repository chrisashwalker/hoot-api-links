import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LinksModule } from './links/links.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://root:guest@hoot-db-mongo:27017/hoot?authSource=admin'), LinksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
