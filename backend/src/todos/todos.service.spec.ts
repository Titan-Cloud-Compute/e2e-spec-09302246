import { BadRequestException } from '@nestjs/common';
import { TodosService } from './todos.service';

function makePrisma() {
  return {
    todo: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: 't1', title: data.title, createdAt: new Date() }),
      ),
    },
  };
}

describe('TodosService', () => {
  it('lists only the given user\'s todos', async () => {
    const prisma = makePrisma();
    const svc = new TodosService(prisma as never);
    await expect(svc.list('u1')).resolves.toEqual([]);
    expect(prisma.todo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
  });

  it('creates a todo owned by the user with a trimmed title', async () => {
    const prisma = makePrisma();
    const svc = new TodosService(prisma as never);
    const created = await svc.create('u1', '  Buy milk  ');
    expect(created.title).toBe('Buy milk');
    expect(prisma.todo.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { title: 'Buy milk', userId: 'u1' } }),
    );
  });

  it.each([undefined, '', '   ', 42])('rejects invalid title %p', async (title) => {
    const prisma = makePrisma();
    const svc = new TodosService(prisma as never);
    expect(() => svc.create('u1', title)).toThrow(BadRequestException);
    expect(prisma.todo.create).not.toHaveBeenCalled();
  });
});
