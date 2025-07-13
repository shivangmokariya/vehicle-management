import { useState, useEffect } from 'react'
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
  ChevronDownIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
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
  const [expandedBatch, setExpandedBatch] = useState(null)
  const [batchPages, setBatchPages] = useState({})
  const [batchVehicles, setBatchVehicles] = useState({})
  const [batchLoading, setBatchLoading] = useState({})
  const [batches, setBatches] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [renameBatchId, setRenameBatchId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingBatchId, setDeletingBatchId] = useState(null);
  const [confirmDeleteBatchId, setConfirmDeleteBatchId] = useState(null);

  // Fetch batches function
  const fetchBatches = () => {
    setBatchesLoading(true)
    vehiclesAPI.getBatches()
      .then(res => {
        setBatches(res.data.batches)
        setBatchesLoading(false)
      })
      .catch(() => setBatchesLoading(false))
  }

  // Fetch batches on mount
  useEffect(() => {
    fetchBatches()
  }, [])

  // Fetch vehicles for a batch and page
  const fetchBatchVehicles = (batchId, page = 1) => {
    setBatchLoading(prev => ({ ...prev, [batchId]: true }))
    vehiclesAPI.getBatchVehicles(batchId, { page, limit: 10 })
      .then(res => {
        setBatchVehicles(prev => ({ ...prev, [batchId]: res.data }))
        setBatchPages(prev => ({ ...prev, [batchId]: page }))
        setBatchLoading(prev => ({ ...prev, [batchId]: false }))
      })
      .catch(() => setBatchLoading(prev => ({ ...prev, [batchId]: false })))
  }

  // Handle accordion expand
  const handleExpand = (batchId) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null)
    } else {
      setExpandedBatch(batchId)
      if (!batchVehicles[batchId]) {
        fetchBatchVehicles(batchId, 1)
      }
    }
  }

  // Handle pagination inside accordion
  const handleBatchPage = (batchId, page) => {
    fetchBatchVehicles(batchId, page)
  }

  // Handle rename
  const handleRename = (batchId, currentName) => {
    setRenameBatchId(batchId)
    setRenameValue(currentName)
  }
  const handleRenameSave = (batchId) => {
    vehiclesAPI.renameBatch(batchId, renameValue)
      .then(res => {
        setBatches(batches.map(b => b._id === batchId ? { ...b, fileName: res.data.batch.fileName } : b))
        setRenameBatchId(null)
        toast.success('File name updated')
      })
      .catch(() => toast.error('Failed to rename file'))
  }

  const handleDeleteBatch = async (batchId) => {
    setDeletingBatchId(batchId);
    try {
      await vehiclesAPI.deleteBatch(batchId);
      toast.success('Batch and related vehicles deleted successfully.');
      fetchBatches();
    } catch (err) {
      toast.error('Failed to delete batch.');
    } finally {
      setDeletingBatchId(null);
      setConfirmDeleteBatchId(null);
    }
  };

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
      fetchBatches() // Refresh batches after upload
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

  const [editGroup, setEditGroup] = useState('');
  const [groupOptions, setGroupOptions] = useState([]);

  // Fetch unique group values on mount
  useEffect(() => {
    vehiclesAPI.getGroups().then(res => {
      setGroupOptions((res.data.groups || []).filter(Boolean));
    });
  }, []);

  const onSubmit = (data) => {
    if (editingVehicle) {
      updateVehicleMutation.mutate({ id: editingVehicle._id, data: { ...data, group: editGroup } })
    }
  }

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle)
    setEditGroup(vehicle.group || '')
    reset({
      vehicleNo: vehicle.vehicleNo || '',
      chassisNo: vehicle.chassisNo || '',
      engineNo: vehicle.engineNo || '',
      agNo: vehicle.agNo || '',
      branch: vehicle.branch || '',
      customerName: vehicle.customerName || '',
      bkt: vehicle.bkt || '',
      area: vehicle.area || '',
      vehicleMaker: vehicle.vehicleMaker || '',
      lpp: vehicle.lpp || '',
      bcc: vehicle.bcc || '',
      companyName: vehicle.companyName || '',
      companyBranch: vehicle.companyBranch || '',
      companyContact: vehicle.companyContact || '',
      companyContactPerson: vehicle.companyContactPerson || '',
      agencyName: vehicle.agencyName || '',
      agencyContact: vehicle.agencyContact || '',
      // --- Add all new fields below ---
      state: vehicle.state || '',
      city: vehicle.city || '',
      fileNo: vehicle.fileNo || '',
      loanAgreementNo: vehicle.loanAgreementNo || '',
      nameOfClient: vehicle.nameOfClient || '',
      vehicleType: vehicle.vehicleType || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      regNo: vehicle.regNo || '',
      month: vehicle.month || '',
      emi: vehicle.emi || '',
      pos: vehicle.pos || '',
      tos: vehicle.tos || '',
      fcAmt: vehicle.fcAmt || '',
      loanAmount: vehicle.loanAmount || '',
      dpd: vehicle.dpd || '',
      customerAddress: vehicle.customerAddress || '',
      customerMobileNumber: vehicle.customerMobileNumber || '',
      groupAccountCount: vehicle.groupAccountCount || '',
      contactPerson1: vehicle.contactPerson1 || '',
      mobileNumber1: vehicle.mobileNumber1 || '',
      contactPerson2: vehicle.contactPerson2 || '',
      mobileNumber2: vehicle.mobileNumber2 || '',
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

  // Add debug log before return
  console.log('BATCHES STATE:', batches);

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

      {/* Batch Accordions */}
      <div className="space-y-4">
        {batchesLoading ? (
          <div className="text-center py-8">Loading batches...</div>
        ) : Array.isArray(batches) && batches.length > 0 ? (
          batches.map(batch => (
            <div key={batch._id} className="border rounded shadow-sm">
              {/* Accordion Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => handleExpand(batch._id)}>
                <div className="flex items-center space-x-2">
                  {expandedBatch === batch._id ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
                  {renameBatchId === batch._id ? (
                    <>
                      <input
                        className="input-field w-48"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                      <button className="ml-2 text-green-600" onClick={e => { e.stopPropagation(); handleRenameSave(batch._id) }}><CheckIcon className="h-4 w-4" /></button>
                      <button className="ml-1 text-gray-500" onClick={e => { e.stopPropagation(); setRenameBatchId(null) }}><XMarkIcon className="h-4 w-4" /></button>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-lg">{batch.fileName}</span>
                      <button className="ml-2 text-blue-600" title="Rename" onClick={e => { e.stopPropagation(); handleRename(batch._id, batch.fileName) }}><PencilIcon className="h-4 w-4" /></button>
                    </>
                  )}
                  <span className="ml-6 text-gray-600">Company: <span className="font-medium">{batch.companyName}</span></span>
                  <span className="ml-6 text-gray-600">Uploaded: <span className="font-medium">{new Date(batch.uploadDate).toLocaleString()}</span></span>
                  <button
                    className="ml-6 text-red-600 hover:text-red-800 transition duration-150"
                    title="Delete Batch"
                    onClick={e => { e.stopPropagation(); setConfirmDeleteBatchId(batch._id); }}
                    disabled={deletingBatchId === batch._id}
                  >
                    {deletingBatchId === batch._id ? 'Deleting...' : <TrashIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {/* Accordion Content */}
              {expandedBatch === batch._id && (
                <div className="p-4 bg-white">
                  {batchLoading[batch._id] ? (
                    <div className="text-center py-8">Loading vehicles...</div>
                  ) : batchVehicles[batch._id]?.vehicles?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No vehicles found in this batch</div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
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
                            {batchVehicles[batch._id]?.vehicles?.map(vehicle => (
                              <tr key={vehicle._id}>
                                <td className="table-cell">{vehicle.vehicleNo}</td>
                                <td className="table-cell">{vehicle.customerName}</td>
                                <td className="table-cell">{vehicle.branch}</td>
                                <td className="table-cell">{vehicle.area}</td>
                                <td className="table-cell">{vehicle.vehicleMaker}</td>
                                <td className="table-cell">{vehicle.companyName}</td>
                                <td className="table-cell">
                              <div className="flex items-center justify-center gap-4">
                                <button
                                  title="View"
                                  onClick={() => handleView(vehicle)}
                                  className="text-blue-600 hover:text-blue-800 transition duration-150"
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </button>
                                <button
                                  title="Edit"
                                  onClick={() => handleEdit(vehicle)}
                                  className="text-green-600 hover:text-green-800 transition duration-150"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  title="Delete"
                                  onClick={() => handleDelete(vehicle._id)}
                                  className="text-red-600 hover:text-red-800 transition duration-150"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </td>

                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Pagination Controls */}
                      <div className="flex justify-between items-center mt-4">
                        <button
                          className="btn-secondary"
                          onClick={() => handleBatchPage(batch._id, Math.max(1, (batchPages[batch._id] || 1) - 1))}
                          disabled={(batchPages[batch._id] || 1) === 1}
                        >
                          Previous
                        </button>
                        <span>
                          Page {batchVehicles[batch._id]?.currentPage || 1} of {batchVehicles[batch._id]?.totalPages || 1}
                        </span>
                        <button
                          className="btn-secondary"
                          onClick={() => handleBatchPage(batch._id, Math.min((batchVehicles[batch._id]?.totalPages || 1), (batchPages[batch._id] || 1) + 1))}
                          disabled={(batchPages[batch._id] || 1) === (batchVehicles[batch._id]?.totalPages || 1)}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No batches found</div>
        )}
      </div>

      {/* Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto border w-full max-w-5xl shadow-lg rounded-md bg-white flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="sticky top-0 bg-white z-10 p-5 border-b rounded-t-md">
              <h3 className="text-lg font-medium text-gray-900">Edit Vehicle</h3>
            </div>
            <div className="overflow-y-auto px-6 py-4 flex-1 pb-32" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <form id="edit-vehicle-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex flex-col h-full">

              {/* Vehicle Info */}
              <h4 className="text-gray-800 font-semibold text-sm pt-4 pb-2 border-b border-gray-200">Vehicle Info</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <div><label className="label">Vehicle No</label><input {...register('vehicleNo')} className="input-field" /></div>
                <div><label className="label">Chassis No</label><input {...register('chassisNo')} className="input-field" /></div>
                <div><label className="label">Engine No</label><input {...register('engineNo')} className="input-field" /></div>
                <div><label className="label">AG No</label><input {...register('agNo')} className="input-field" /></div>
                <div><label className="label">Branch</label><input {...register('branch')} className="input-field" /></div>
                <div><label className="label">Customer Name</label><input {...register('customerName')} className="input-field" /></div>
                <div><label className="label">BKT</label><input {...register('bkt')} className="input-field" /></div>
                <div><label className="label">Area</label><input {...register('area')} className="input-field" /></div>
                <div><label className="label">Vehicle Maker</label><input {...register('vehicleMaker')} className="input-field" /></div>
                <div><label className="label">State</label><input {...register('state')} className="input-field" /></div>
                <div><label className="label">City</label><input {...register('city')} className="input-field" /></div>
                <div><label className="label">File No</label><input {...register('fileNo')} className="input-field" /></div>
                <div><label className="label">Loan Agreement No</label><input {...register('loanAgreementNo')} className="input-field" /></div>
                <div><label className="label">Name Of Client</label><input {...register('nameOfClient')} className="input-field" /></div>
                <div><label className="label">Make</label><input {...register('make')} className="input-field" /></div>
                <div><label className="label">Model</label><input {...register('model')} className="input-field" /></div>
                <div><label className="label">Year</label><input {...register('year')} className="input-field" /></div>
                <div><label className="label">Reg No</label><input {...register('regNo')} className="input-field" /></div>
                <div><label className="label">Month</label><input {...register('month')} className="input-field" /></div>
                <div><label className="label">EMI</label><input {...register('emi')} className="input-field" /></div>
                <div><label className="label">POS</label><input {...register('pos')} className="input-field" /></div>
                <div><label className="label">TOS</label><input {...register('tos')} className="input-field" /></div>
                <div><label className="label">FC Amt</label><input {...register('fcAmt')} className="input-field" /></div>
                <div><label className="label">Loan Amount</label><input {...register('loanAmount')} className="input-field" /></div>
                <div><label className="label">DPD</label><input {...register('dpd')} className="input-field" /></div>
                <div><label className="label">Customer Address</label><input {...register('customerAddress')} className="input-field" /></div>
                <div><label className="label">Customer Mobile Number</label><input {...register('customerMobileNumber')} className="input-field" /></div>
                <div><label className="label">Group Account Count</label><input {...register('groupAccountCount')} className="input-field" /></div>
                <div><label className="label">Contact Person 1</label><input {...register('contactPerson1')} className="input-field" /></div>
                <div><label className="label">Mobile Number 1</label><input {...register('mobileNumber1')} className="input-field" /></div>
                <div><label className="label">Contact Person 2</label><input {...register('contactPerson2')} className="input-field" /></div>
                <div><label className="label">Mobile Number 2</label><input {...register('mobileNumber2')} className="input-field" /></div>
              </div>

              {/* Company Info */}
              <h4 className="text-gray-800 font-semibold text-sm pt-4 pb-2 border-b border-gray-200">Company Info</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <div><label className="label">LPP</label><input {...register('lpp')} className="input-field" /></div>
                <div><label className="label">BCC</label><input {...register('bcc')} className="input-field" /></div>
                <div><label className="label">Company Name</label><input {...register('companyName')} className="input-field" /></div>
                <div><label className="label">Company Branch</label><input {...register('companyBranch')} className="input-field" /></div>
                <div><label className="label">Company Contact</label><input {...register('companyContact')} className="input-field" /></div>
                <div><label className="label">Company Contact Person</label><input {...register('companyContactPerson')} className="input-field" /></div>
              </div>

              {/* Agency Info */}
              <h4 className="text-gray-800 font-semibold text-sm pt-4 pb-2 border-b border-gray-200">Agency Info</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <div><label className="label">Agency Name</label><input {...register('agencyName')} className="input-field" /></div>
                <div><label className="label">Agency Contact</label><input {...register('agencyContact')} className="input-field" /></div>
                <div>
                  <label className="label">Vehicle Type</label>
                  <select
                    value={editGroup}
                    onChange={e => setEditGroup(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select Groups</option>
                    {groupOptions.map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </select>
                  {editGroup && <span className="text-xs text-blue-700 ml-1 italic">{editGroup}</span>}
                </div>
              </div>

              {/* Action Buttons removed from here */}
              {/* <div className="flex justify-end space-x-3 pt-6"> ... </div> */}

              </form>
            </div>
            {/* Sticky Footer Action Buttons */}
            <div className="sticky bottom-0 bg-white z-10 p-5 border-t flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-vehicle-form"
                className="btn-primary ml-3"
              >
                Update
              </button>
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
              <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
                {/* Vehicle Info */}
                <h4 className="text-gray-800 font-semibold text-sm pt-4 pb-2 border-b border-gray-200">Vehicle Info</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div><label className="block text-sm font-medium text-gray-700">Vehicle No</label><p className="text-sm text-gray-900">{viewingVehicle.vehicleNo}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Chassis No</label><p className="text-sm text-gray-900">{viewingVehicle.chassisNo}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Engine No</label><p className="text-sm text-gray-900">{viewingVehicle.engineNo}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">AG No</label><p className="text-sm text-gray-900">{viewingVehicle.agNo}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Branch</label><p className="text-sm text-gray-900">{viewingVehicle.branch}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Customer Name</label><p className="text-sm text-gray-900">{viewingVehicle.customerName}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">BKT</label><p className="text-sm text-gray-900">{viewingVehicle.bkt}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Area</label><p className="text-sm text-gray-900">{viewingVehicle.area}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Vehicle Maker</label><p className="text-sm text-gray-900">{viewingVehicle.vehicleMaker}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">State</label><p className="text-sm text-gray-900">{viewingVehicle.state}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">City</label><p className="text-sm text-gray-900">{viewingVehicle.city}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">File No</label><p className="text-sm text-gray-900">{viewingVehicle.fileNo}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Loan Agreement No</label><p className="text-sm text-gray-900">{viewingVehicle.loanAgreementNo}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Name Of Client</label><p className="text-sm text-gray-900">{viewingVehicle.nameOfClient}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Vehicle Type</label><p className="text-sm text-gray-900">{viewingVehicle.vehicleType}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Make</label><p className="text-sm text-gray-900">{viewingVehicle.make}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Model</label><p className="text-sm text-gray-900">{viewingVehicle.model}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Year</label><p className="text-sm text-gray-900">{viewingVehicle.year}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Reg No</label><p className="text-sm text-gray-900">{viewingVehicle.regNo}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Month</label><p className="text-sm text-gray-900">{viewingVehicle.month}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">EMI</label><p className="text-sm text-gray-900">{viewingVehicle.emi}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">POS</label><p className="text-sm text-gray-900">{viewingVehicle.pos}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">TOS</label><p className="text-sm text-gray-900">{viewingVehicle.tos}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">FC Amt</label><p className="text-sm text-gray-900">{viewingVehicle.fcAmt}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Loan Amount</label><p className="text-sm text-gray-900">{viewingVehicle.loanAmount}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">DPD</label><p className="text-sm text-gray-900">{viewingVehicle.dpd}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Customer Address</label><p className="text-sm text-gray-900">{viewingVehicle.customerAddress}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Customer Mobile Number</label><p className="text-sm text-gray-900">{viewingVehicle.customerMobileNumber}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Group Account Count</label><p className="text-sm text-gray-900">{viewingVehicle.groupAccountCount}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Contact Person 1</label><p className="text-sm text-gray-900">{viewingVehicle.contactPerson1}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Mobile Number 1</label><p className="text-sm text-gray-900">{viewingVehicle.mobileNumber1}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Contact Person 2</label><p className="text-sm text-gray-900">{viewingVehicle.contactPerson2}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Mobile Number 2</label><p className="text-sm text-gray-900">{viewingVehicle.mobileNumber2}</p></div>
                </div>
                {/* Company Info */}
                <h4 className="text-gray-800 font-semibold text-sm pt-4 pb-2 border-b border-gray-200">Company Info</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div><label className="block text-sm font-medium text-gray-700">LPP</label><p className="text-sm text-gray-900">{viewingVehicle.lpp}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">BCC</label><p className="text-sm text-gray-900">{viewingVehicle.bcc}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Company Name</label><p className="text-sm text-gray-900">{viewingVehicle.companyName}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Company Branch</label><p className="text-sm text-gray-900">{viewingVehicle.companyBranch}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Company Contact</label><p className="text-sm text-gray-900">{viewingVehicle.companyContact}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Company Contact Person</label><p className="text-sm text-gray-900">{viewingVehicle.companyContactPerson}</p></div>
                </div>
                {/* Agency Info */}
                <h4 className="text-gray-800 font-semibold text-sm pt-4 pb-2 border-b border-gray-200">Agency Info</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div><label className="block text-sm font-medium text-gray-700">Agency Name</label><p className="text-sm text-gray-900">{viewingVehicle.agencyName}</p></div>
                  <div><label className="block text-sm font-medium text-gray-700">Agency Contact</label><p className="text-sm text-gray-900">{viewingVehicle.agencyContact}</p></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group</label>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs mt-1">{viewingVehicle.group}</span>
                  </div>
                </div>
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

      {/* Delete Batch Confirmation Modal */}
      {confirmDeleteBatchId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Delete Batch</h3>
            <p className="mb-6 text-gray-700">Are you sure you want to delete this batch and all its vehicles? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => setConfirmDeleteBatchId(null)}
                disabled={deletingBatchId === confirmDeleteBatchId}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDeleteBatch(confirmDeleteBatchId)}
                disabled={deletingBatchId === confirmDeleteBatchId}
              >
                {deletingBatchId === confirmDeleteBatchId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 