import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Todo {
  id: string;
  title: string;
  createdAt?: string;
}

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="todos-page">
      <header class="page-header">
        <h1>To-dos</h1>
      </header>
      <div class="todos-card">
        <form class="todo-form" (ngSubmit)="add()">
          <label for="todo-title" class="sr-only">Task title</label>
          <input
            id="todo-title"
            type="text"
            name="title"
            data-testid="todo-title-input"
            placeholder="What needs to be done?"
            maxlength="500"
            [(ngModel)]="title"
            [disabled]="saving()"
          />
          <button
            type="submit"
            class="btn-primary"
            data-testid="todo-add-button"
            [disabled]="saving() || !title.trim()"
          >Add</button>
        </form>
        @if (error()) {
          <p class="error" role="alert" data-testid="todo-error">{{ error() }}</p>
        }
        @if (todos().length === 0) {
          <p class="empty" data-testid="todo-empty">No tasks yet. Add your first one above.</p>
        } @else {
          <ul class="todo-list" data-testid="todo-list">
            @for (t of todos(); track t.id) {
              <li class="todo-item" data-testid="todo-item">{{ t.title }}</li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  styles: [`
    .todos-page { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
    .page-header { margin-bottom: 1.5rem; }
    h1 { font-size: var(--font-size-xl); color: var(--color-text-primary); margin: 0; }
    .todos-card {
      background: white;
      border-radius: var(--radius-card);
      border: 1px solid var(--color-border);
      padding: 1.5rem;
    }
    .todo-form { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
    .todo-form input {
      flex: 1;
      padding: 0.625rem 0.75rem;
      font-size: var(--font-size-input, 1rem);
      border: 1px solid var(--color-gray-300);
      border-radius: var(--radius-btn);
      min-height: 44px;
    }
    .btn-primary {
      padding: 0.625rem 1.5rem;
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: white;
      background: var(--color-primary);
      border: none;
      border-radius: var(--radius-btn);
      cursor: pointer;
      min-height: 44px;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .empty, .error { color: var(--color-text-secondary); margin: 0; }
    .todo-list { list-style: none; margin: 0; padding: 0; }
    .todo-item { padding: 0.75rem 0; border-bottom: 1px solid var(--color-border); }
    .todo-item:last-child { border-bottom: none; }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;
    }
  `]
})
export class TodosComponent implements OnInit {
  private http = inject(HttpClient);

  readonly todos = signal<Todo[]>([]);
  readonly saving = signal(false);
  readonly error = signal('');
  title = '';

  async ngOnInit(): Promise<void> {
    try {
      const list = await firstValueFrom(
        this.http.get<Todo[]>('api/todos', { withCredentials: true }),
      );
      this.todos.set(Array.isArray(list) ? list : []);
    } catch {
      this.error.set('Could not load your tasks.');
    }
  }

  async add(): Promise<void> {
    const title = this.title.trim();
    if (!title || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const created = await firstValueFrom(
        this.http.post<Todo>('api/todos', { title }, { withCredentials: true }),
      );
      const todo: Todo = created && typeof created.id === 'string' && typeof created.title === 'string'
        ? created
        : { id: 'local-' + Date.now(), title };
      this.todos.update(list => [...list, todo]);
      this.title = '';
    } catch {
      this.error.set('Could not add the task. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }
}
