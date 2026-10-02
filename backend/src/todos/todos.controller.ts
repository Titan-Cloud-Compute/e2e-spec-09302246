import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TodosService } from './todos.service';

@ApiTags('todos')
@UseGuards(JwtAuthGuard)
@Controller('api/todos')
export class TodosController {
  constructor(private readonly todos: TodosService) {}

  private userId(req: Request): string {
    const id = req.session?.userId;
    if (!id) throw new UnauthorizedException('not authenticated');
    return id;
  }

  @Get()
  list(@Req() req: Request) {
    return this.todos.list(this.userId(req));
  }

  @Post()
  create(@Req() req: Request, @Body() body: { title?: unknown } | undefined) {
    return this.todos.create(this.userId(req), body?.title);
  }
}
