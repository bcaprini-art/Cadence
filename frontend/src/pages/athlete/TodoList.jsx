import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/todos');
      setTodos(Array.isArray(data) ? data : data.todos || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const payload = { title: newTitle.trim() };
      if (newDueDate) payload.dueDate = newDueDate;
      if (newPriority) payload.priority = newPriority;
      if (newCategory) payload.category = newCategory;
      await api.post('/todos', payload);
      setNewTitle('');
      setNewDueDate('');
      setNewPriority('medium');
      setNewCategory('');
      await fetchTodos();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add todo');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (todo) => {
    try {
      await api.patch(`/todos/${todo.id}`, { completed: !todo.completed });
      await fetchTodos();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update todo');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/todos/${id}`);
      await fetchTodos();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete todo');
    }
  };

  const priorityColors = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm animate-pulse">Loading todos…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">To-Do List</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your tasks and priorities</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total</div>
        </div>
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{completedCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Completed</div>
        </div>
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{pendingCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Pending</div>
        </div>
      </div>

      {/* Add Form */}
      <form
        onSubmit={handleAdd}
        className="bg-[#0d1526] rounded-xl border border-white/10 p-5 space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="What do you need to do?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            className="flex-1 bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
          />
          <button
            type="submit"
            disabled={saving || !newTitle.trim()}
            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Adding…' : 'Add'}
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-slate-500 mb-1">Due Date</label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500/50"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs text-slate-500 mb-1">Priority</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500/50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-slate-500 mb-1">Category</label>
            <input
              type="text"
              placeholder="e.g. School, Sports"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-[#1e2d4a] border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
            />
          </div>
        </div>
      </form>

      {/* Todo List */}
      {todos.length === 0 ? (
        <div className="bg-[#1e2d4a] rounded-xl border border-slate-700/50 p-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-slate-400 text-sm">All caught up! No to-dos yet.</p>
          <p className="text-slate-500 text-xs mt-1">
            Add one above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`bg-[#0d1526] rounded-xl border border-white/10 p-4 flex items-center gap-4 transition-all hover:border-white/20 ${
                todo.completed ? 'opacity-60' : ''
              }`}
            >
              <button
                onClick={() => handleToggle(todo)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  todo.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-slate-500 hover:border-green-400'
                }`}
              >
                {todo.completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    todo.completed ? 'text-slate-500 line-through' : 'text-white'
                  }`}
                >
                  {todo.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {todo.category && (
                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                      {todo.category}
                    </span>
                  )}
                  {todo.dueDate && (
                    <span className="text-xs text-slate-500">
                      Due {todo.dueDate}
                    </span>
                  )}
                </div>
              </div>

              {todo.priority && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${
                    priorityColors[todo.priority] || priorityColors.medium
                  }`}
                >
                  {todo.priority}
                </span>
              )}

              <button
                onClick={() => handleDelete(todo.id)}
                className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
