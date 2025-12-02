import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkflowsModule } from './workflows/workflows.module';
import { NodesModule } from './nodes/nodes.module';
import { ExecutionModule } from './execution/execution.module';
import { WebSocketModule } from './websocket/websocket.module';
import { TriggersModule } from './triggers/triggers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'postgres'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: configService.get<string>('DATABASE_NAME', 'hackaton'),
        entities: [process.cwd() + '/dist/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: false,
      }),
      inject: [ConfigService],
    }),
    WorkflowsModule,
    NodesModule,
    ExecutionModule,
    WebSocketModule,
    TriggersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
