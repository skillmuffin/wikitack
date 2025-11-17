'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">WikiTack</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user?.display_name || user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to WikiTack!
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
                  <dl className="mt-2 border-t border-gray-200 divide-y divide-gray-200">
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Username</dt>
                      <dd className="text-sm text-gray-900">{user?.username}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{user?.email || 'Not provided'}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                      <dd className="text-sm text-gray-900">{user?.display_name || 'Not set'}</dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                      <dd className="text-sm text-gray-900">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user?.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <button className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">Create Space</h4>
                        <p className="text-sm text-gray-500 mt-1">Start a new wiki space</p>
                      </div>
                    </button>
                    <button className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">Browse Pages</h4>
                        <p className="text-sm text-gray-500 mt-1">View existing wiki pages</p>
                      </div>
                    </button>
                    <button className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">Manage Tags</h4>
                        <p className="text-sm text-gray-500 mt-1">Organize content with tags</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
