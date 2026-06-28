export default function AdminDashboardPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
            <p className="text-gray-600 mb-6">Welcome to the admin dashboard. Here you can manage your products, orders, and users.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Products</h2>
                    <p className="text-gray-600">Manage your product inventory.</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Orders</h2>
                    <p className="text-gray-600">View and manage customer orders.</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Users</h2>
                    <p className="text-gray-600">Manage user accounts and permissions.</p>
                </div>
            </div>
        </div>
    );
}