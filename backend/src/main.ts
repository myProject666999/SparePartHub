import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dayjs from 'dayjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('备品备件库存中心 API')
    .setDescription('备品备件库存管理系统后端接口文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 服务启动成功: http://localhost:${port}`);
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] API文档: http://localhost:${port}/api/docs`);
}

bootstrap();
