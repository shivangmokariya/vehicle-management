import { useQuery } from 'react-query'
import { dashboardAPI } from '../services/api'
import {
  UsersIcon,
  TruckIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'

const ScalesIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 3v2m0 0c-4.418 0-8 1.79-8 4v2a8 8 0 0016 0V9c0-2.21-3.582-4-8-4zm0 0v13m-4 0h8" />
  </svg>
);

function Navbar() {
  return (
    <nav className="w-full bg-white shadow flex items-center px-8 py-3 mb-8">
      <div className="flex items-center space-x-3">
        <CurrencyDollarIcon className="h-7 w-7 text-green-600" />
        <BanknotesIcon className="h-7 w-7 text-blue-600" />
        <CreditCardIcon className="h-7 w-7 text-purple-600" />
        <span className="text-2xl font-extrabold text-gray-900 ml-4 tracking-wide">
          Krisha Associates
        </span>
      </div>
      <span className="ml-8 text-lg text-gray-500 font-medium">
        Finance & Vehicle Repossession Experts
      </span>
    </nav>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading } = useQuery('dashboardSummary', dashboardAPI.getSummary)

  const dashboardStats = [
    { name: 'Total Users', value: summary?.data?.totalUsers ?? 0, icon: CurrencyDollarIcon, color: 'bg-blue-500' },
    { name: 'Total Vehicles', value: summary?.data?.totalVehicles ?? 0, icon: BanknotesIcon, color: 'bg-green-500' },
    { name: 'Total Companies', value: summary?.data?.totalCompanies ?? 0, icon: CreditCardIcon, color: 'bg-purple-500' },
    { name: 'Total Areas', value: summary?.data?.totalAreas ?? 0, icon: CurrencyDollarIcon, color: 'bg-orange-500' },
  ]

  return (
    <div>
      <Navbar />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((item) => (
          <div key={item.name} className="card overflow-hidden">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className={`h-6 w-6 text-white ${item.color} p-1 rounded-lg`} aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{isLoading ? '...' : item.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Manage Users</h4>
                  <p className="text-sm text-gray-500">Create and manage admin users</p>
                </div>
                <a
                  href="/users"
                  className="btn-primary text-sm"
                >
                  Go to Users
                </a>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Vehicle Management</h4>
                  <p className="text-sm text-gray-500">Upload Excel files and manage vehicles</p>
                </div>
                <a
                  href="/vehicles"
                  className="btn-primary text-sm"
                >
                  Go to Vehicles
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">System Information</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Role:</span>
                <span className="text-sm font-medium text-gray-900">Super Admin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Access Level:</span>
                <span className="text-sm font-medium text-gray-900">Full Access</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Permissions:</span>
                <span className="text-sm font-medium text-gray-900">All Operations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 