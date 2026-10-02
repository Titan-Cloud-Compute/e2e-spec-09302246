import { UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TodosController } from './todos.controller';
import { TodosModule } from './todos.module';
import { AppModule } from '../app.module';

describe('TodosController', () => {
  const service = {
    list: jest.fn().mockResolvedValue([{ id: 't1', title: 'A', createdAt: new Date() }]),
    create: jest.fn().mockImplementation((_u: string, title: string) =>
      Promise.resolve({ id: 't2', title, createdAt: new Date() }),
    ),
  };
  const ctrl = new TodosController(service as never);
  const req = (userId?: string) => ({ session: userId ? { userId } : undefined }) as never;

  beforeEach(() => jest.clearAllMocks());

  it('is mounted at api/todos behind JwtAuthGuard', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TodosController)).toBe('api/todos');
    expect(Reflect.getMetadata(GUARDS_METADATA, TodosController)).toContain(JwtAuthGuard);
  });

  it('GET lists the session user\'s todos', async () => {
    await ctrl.list(req('u1'));
    expect(service.list).toHaveBeenCalledWith('u1');
  });

  it('POST creates for the session user', async () => {
    const res = await ctrl.create(req('u1'), { title: 'Write tests' });
    expect(service.create).toHaveBeenCalledWith('u1', 'Write tests');
    expect(res.title).toBe('Write tests');
  });

  it('rejects requests without a session user', () => {
    expect(() => ctrl.list(req())).toThrow(UnauthorizedException);
  });

  it('TodosModule is registered in AppModule', () => {
    const imports = Reflect.getMetadata('imports', AppModule) as unknown[];
    expect(imports).toContain(TodosModule);
  });
});
