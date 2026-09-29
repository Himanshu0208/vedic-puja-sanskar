'use client';

import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { adminService } from '@/services/api/adminService';
import type { AdminUser } from '@/types/admin';
import { PaginationNav } from '@/components/common/PaginationNav';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      adminService.getUsers({ page, pageSize: 20, search })
        .then((result: unknown) => {
          if (!active) return;
          if (Array.isArray(result)) {
            setUsers(result);
            setTotal(result.length);
            setTotalPages(1);
          } else if (result && typeof result === 'object' && 'users' in result) {
            const data = result as { users: AdminUser[]; total: number; totalPages: number };
            setUsers(data.users || []);
            setTotal(data.total ?? (data.users?.length || 0));
            setTotalPages(data.totalPages ?? 1);
          } else {
            setUsers([]);
            setTotal(0);
            setTotalPages(0);
          }
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : 'Could not load users.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [page, search]);

  const safeUsers = users || [];

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-stone-500">Customer accounts and their order activity.</p>
        </div>
        <span className="rounded-full bg-white px-3.5 py-2 text-sm font-medium text-stone-600 ring-1 ring-stone-200">
          {total} accounts
        </span>
      </div>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-2.5 text-stone-400" size={17} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by email"
            className="w-full rounded-xl border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-700"
          />
        </div>
        <p className="text-sm text-stone-500">Showing {safeUsers.length} of {total}</p>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Account</th>
                  <th className="px-5 py-3.5 font-semibold">Role</th>
                  <th className="px-5 py-3.5 font-semibold">Orders</th>
                  <th className="px-5 py-3.5 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-stone-500">Loading users…</td>
                  </tr>
                ) : (
                  safeUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-stone-50/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-50 text-amber-900">
                            <Users size={17} />
                          </span>
                          <div>
                            <p className="font-medium text-stone-900">{user.email}</p>
                            <p className="mt-0.5 text-xs text-stone-400">ID {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-stone-100 text-stone-600'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-stone-700">{user.orderCount}</td>
                      <td className="px-5 py-4 text-stone-600">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>
                    </tr>
                  ))
                )}
                {!loading && safeUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-stone-500">No accounts match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!error && totalPages > 1 && (
        <div className="mt-4">
          <PaginationNav
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={20}
            onPageChange={(newPage) => {
              setPage(newPage);
            }}
            isLoading={loading}
            itemLabel="accounts"
          />
        </div>
      )}
    </section>
  );
}
