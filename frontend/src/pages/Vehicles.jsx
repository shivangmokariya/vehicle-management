import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import { vehiclesAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline'

export default function Vehicles() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedMaker, setSelectedMaker] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [viewingVehicle, setViewingVehicle] = useState(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: vehiclesData, isLoading } = useQuery(
    ['vehicles', searchTerm, selectedBranch, selectedArea, selectedMaker, page],
    () => vehiclesAPI.getVehicles({
      search: searchTerm,
      branch: selectedBranch,
      area: selectedArea,
      vehicleMaker: selectedMaker,
      page,
      limit: 15
    }).then(res => res.data)
  )
console.log(vehiclesData,"<<<<<<vehiclesData")
  const uploadMutation = useMutation(vehiclesAPI.uploadExcel, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('vehicles')
      toast.success(`Successfully uploaded ${data.data.uploaded} vehicles`)
      setUploadModalOpen(false)
      setUploadFile(null)
      setUploadProgress(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload file')
      setUploadProgress(null)
    }
  })

  const updateVehicleMutation = useMutation(
    ({ id, data }) => vehiclesAPI.updateVehicle(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicles')
        toast.success('Vehicle updated successfully')
        setIsModalOpen(false)
        setEditingVehicle(null)
        reset()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update vehicle')
      }
    }
  )

  const deleteVehicleMutation = useMutation(vehiclesAPI.deleteVehicle, {
    onSuccess: () => {
      queryClient.invalidateQueries('vehicles')
      toast.success('Vehicle deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete vehicle')
    }
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const allGroups = useMemo(() => {
    const groupSet = new Set();
    vehiclesData?.vehicles?.forEach(v => v.group && groupSet.add(v.group));
    return Array.from(groupSet);
  }, [vehiclesData]);
  const [editGroup, setEditGroup] = useState('');

  const onSubmit = (data) => {
    if (editingVehicle) {
      updateVehicleMutation.mutate({ id: editingVehicle._id, data: { ...data, group: editGroup } })
    }
  }

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle)
    setEditGroup(vehicle.group || '')
    reset({
      vehicleNo: vehicle.vehicleNo,
      chassisNo: vehicle.chassisNo,
      engineNo: vehicle.engineNo,
      agNo: vehicle.agNo,
      branch: vehicle.branch,
      customerName: vehicle.customerName,
      bkt: vehicle.bkt,
      area: vehicle.area,
      vehicleMaker: vehicle.vehicleMaker,
      lpp: vehicle.lpp,
      bcc: vehicle.bcc,
      companyName: vehicle.companyName,
      companyBranch: vehicle.companyBranch,
      companyContact: vehicle.companyContact,
      companyContactPerson: vehicle.companyContactPerson,
      agencyName: vehicle.agencyName,
      agencyContact: vehicle.agencyContact,
    })
    setIsModalOpen(true)
  }

  const handleView = (vehicle) => {
    setViewingVehicle(vehicle)
  }

  const handleDelete = (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      deleteVehicleMutation.mutate(vehicleId)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'text/csv' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv')
      ) {
        setUploadFile(file)
      } else {
        toast.error('Please select a valid Excel or CSV file (.xlsx, .xls, .csv)')
      }
    }
  }

  const handleUploadSubmit = () => {
    if (!uploadFile) {
      toast.error('Please select a file to upload')
      return
    }

    const formData = new FormData()
    formData.append('excelFile', uploadFile)

    setUploadProgress('Uploading...')
    uploadMutation.mutate(formData)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingVehicle(null)
    setViewingVehicle(null)
    reset()
  }

  const closeUploadModal = () => {
    setUploadModalOpen(false)
    setUploadFile(null)
    setUploadProgress(null)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Upload Excel files and manage vehicle records
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="btn-primary flex items-center"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Upload Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              <input
                type="text"
                placeholder="Filter by branch..."
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              <input
                type="text"
                placeholder="Filter by area..."
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Maker
              </label>
              <input
                type="text"
                placeholder="Filter by maker..."
                value={selectedMaker}
                onChange={(e) => setSelectedMaker(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedBranch('')
                  setSelectedArea('')
                  setSelectedMaker('')
                }}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Vehicle No</th>
                <th className="table-header-cell">Customer</th>
                <th className="table-header-cell">Branch</th>
                <th className="table-header-cell">Area</th>
                <th className="table-header-cell">Maker</th>
                <th className="table-header-cell">Company</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="table-cell text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </td>
                </tr>
              ) : vehiclesData?.vehicles?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-cell text-center py-8 text-gray-500">
                    No vehicles found
                  </td>
                </tr>
              ) : (
                vehiclesData?.vehicles?.map((vehicle) => (
                  <tr key={vehicle._id}>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">{vehicle.vehicleNo}</div>
                        <div className="text-gray-500 text-xs">Chassis: {vehicle.chassisNo}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">{vehicle.customerName}</div>
                        <div className="text-gray-500 text-xs">BKT: {vehicle.bkt}</div>
                      </div>
                    </td>
                    <td className="table-cell">{vehicle.branch}</td>
                    <td className="table-cell">{vehicle.area}</td>
                    <td className="table-cell">{vehicle.vehicleMaker}</td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">{vehicle.companyName}</div>
                        <div className="text-gray-500 text-xs">{vehicle.companyBranch}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(vehicle)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="btn-secondary"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>
          Page {vehiclesData?.currentPage || 1} of {vehiclesData?.totalPages || 1}
        </span>
        <button
          className="btn-secondary"
          onClick={() => setPage((p) => Math.min((vehiclesData?.totalPages || 1), p + 1))}
          disabled={page === (vehiclesData?.totalPages || 1)}
        >
          Next
        </button>
      </div>

      {/* Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Vehicle</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle No
                    </label>
                    <input
                      type="text"
                      {...register('vehicleNo', { required: 'Vehicle No is required' })}
                      className="input-field"
                    />
                    {errors.vehicleNo && (
                      <p className="text-sm text-red-600">{errors.vehicleNo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chassis No
                    </label>
                    <input
                      type="text"
                      {...register('chassisNo', { required: 'Chassis No is required' })}
                      className="input-field"
                    />
                    {errors.chassisNo && (
                      <p className="text-sm text-red-600">{errors.chassisNo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Engine No
                    </label>
                    <input
                      type="text"
                      {...register('engineNo', { required: 'Engine No is required' })}
                      className="input-field"
                    />
                    {errors.engineNo && (
                      <p className="text-sm text-red-600">{errors.engineNo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      AG No
                    </label>
                    <input
                      type="text"
                      {...register('agNo', { required: 'AG No is required' })}
                      className="input-field"
                    />
                    {errors.agNo && (
                      <p className="text-sm text-red-600">{errors.agNo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch
                    </label>
                    <input
                      type="text"
                      {...register('branch', { required: 'Branch is required' })}
                      className="input-field"
                    />
                    {errors.branch && (
                      <p className="text-sm text-red-600">{errors.branch.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      {...register('customerName', { required: 'Customer Name is required' })}
                      className="input-field"
                    />
                    {errors.customerName && (
                      <p className="text-sm text-red-600">{errors.customerName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      BKT
                    </label>
                    <input
                      type="text"
                      {...register('bkt', { required: 'BKT is required' })}
                      className="input-field"
                    />
                    {errors.bkt && (
                      <p className="text-sm text-red-600">{errors.bkt.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area
                    </label>
                    <input
                      type="text"
                      {...register('area', { required: 'Area is required' })}
                      className="input-field"
                    />
                    {errors.area && (
                      <p className="text-sm text-red-600">{errors.area.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Maker
                    </label>
                    <input
                      type="text"
                      {...register('vehicleMaker', { required: 'Vehicle Maker is required' })}
                      className="input-field"
                    />
                    {errors.vehicleMaker && (
                      <p className="text-sm text-red-600">{errors.vehicleMaker.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LPP
                    </label>
                    <input
                      type="text"
                      {...register('lpp', { required: 'LPP is required' })}
                      className="input-field"
                    />
                    {errors.lpp && (
                      <p className="text-sm text-red-600">{errors.lpp.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      BCC
                    </label>
                    <input
                      type="text"
                      {...register('bcc', { required: 'BCC is required' })}
                      className="input-field"
                    />
                    {errors.bcc && (
                      <p className="text-sm text-red-600">{errors.bcc.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      {...register('companyName', { required: 'Company Name is required' })}
                      className="input-field"
                    />
                    {errors.companyName && (
                      <p className="text-sm text-red-600">{errors.companyName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Branch
                    </label>
                    <input
                      type="text"
                      {...register('companyBranch', { required: 'Company Branch is required' })}
                      className="input-field"
                    />
                    {errors.companyBranch && (
                      <p className="text-sm text-red-600">{errors.companyBranch.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Contact
                    </label>
                    <input
                      type="text"
                      {...register('companyContact', { required: 'Company Contact is required' })}
                      className="input-field"
                    />
                    {errors.companyContact && (
                      <p className="text-sm text-red-600">{errors.companyContact.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Contact Person
                    </label>
                    <input
                      type="text"
                      {...register('companyContactPerson', { required: 'Company Contact Person is required' })}
                      className="input-field"
                    />
                    {errors.companyContactPerson && (
                      <p className="text-sm text-red-600">{errors.companyContactPerson.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agency Name
                    </label>
                    <input
                      type="text"
                      {...register('agencyName', { required: 'Agency Name is required' })}
                      className="input-field"
                    />
                    {errors.agencyName && (
                      <p className="text-sm text-red-600">{errors.agencyName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agency Contact
                    </label>
                    <input
                      type="text"
                      {...register('agencyContact', { required: 'Agency Contact is required' })}
                      className="input-field"
                    />
                    {errors.agencyContact && (
                      <p className="text-sm text-red-600">{errors.agencyContact.message}</p>
                    )}
                  </div>

                  {/* Group Single-select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                    <select
                      value={editGroup}
                      onChange={e => setEditGroup(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select Group</option>
                      {allGroups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {editGroup && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{editGroup}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateVehicleMutation.isLoading}
                    className="btn-primary"
                  >
                    {updateVehicleMutation.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Update'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Excel File</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Excel File
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    name="excelFile"
                    onChange={handleFileUpload}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only .xlsx, .xls, and .csv files are allowed
                  </p>
                </div>

                {uploadFile && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      Selected: {uploadFile.name}
                    </p>
                  </div>
                )}

                {uploadProgress && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{uploadProgress}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeUploadModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadSubmit}
                    disabled={!uploadFile || uploadMutation.isLoading}
                    className="btn-primary"
                  >
                    {uploadMutation.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Upload'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Vehicle Modal */}
      {viewingVehicle && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle No</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.vehicleNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chassis No</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.chassisNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Engine No</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.engineNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">AG No</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.agNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Branch</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.branch}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">BKT</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.bkt}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Area</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.area}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle Maker</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.vehicleMaker}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">LPP</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.lpp}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">BCC</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.bcc}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.companyName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Branch</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.companyBranch}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Contact</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.companyContact}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Contact Person</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.companyContactPerson}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Agency Name</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.agencyName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Agency Contact</label>
                  <p className="text-sm text-gray-900">{viewingVehicle.agencyContact}</p>
                </div>
              </div>
              {/* Group display */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Group</label>
                {viewingVehicle.group && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs mt-1">{viewingVehicle.group}</span>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setViewingVehicle(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 