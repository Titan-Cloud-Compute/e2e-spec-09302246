import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const TODO_TITLE_MAX = 500;

export interface TodoDto {
  id: string;
  title: string;
  createdAt: Date;
}

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  /** The given user's to-dos, oldest first (new tasks append to the end). */
  list(userId: string): Promise<TodoDto[]> {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, createdAt: true },
    });
  }

  /** Create a to-do owned by `userId`. Rejects empty / whitespace-only titles. */
  create(userId: string, rawTitle: unknown): Promise<TodoDto> {
    const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
    if (!title) throw new BadRequestException('title is required');
    if (title.length > TODO_TITLE_MAX) {
      throw new BadRequestException(`title must be at most ${TODO_TITLE_MAX} characters`);
    }
    return this.prisma.todo.create({
      data: { title, userId },
      select: { id: true, title: true, createdAt: true },
    });
  }
}
