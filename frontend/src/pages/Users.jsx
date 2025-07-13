import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm, Controller } from 'react-hook-form'
import { usersAPI } from '../services/api'
import { vehiclesAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Select from 'react-select'

const statusOptions = ['Active', 'Inactive', 'Hold']
const roleOptions = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Sub Seizer', label: 'Sub Seizer' }
]

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const queryClient = useQueryClient()
  const [profileImage, setProfileImage] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const { data: usersData, isLoading } = useQuery(
    ['users', searchTerm, selectedRole, selectedStatus],
    () => usersAPI.getUsers({
      search: searchTerm,
      role: selectedRole,
      status: selectedStatus,
      limit: 50
    })
  )
  const { data: groupsData } = useQuery(
    ['vehicle-groups'],
    () => vehiclesAPI.getGroups().then(res => res.data)
  )

  const allGroups = groupsData?.groups || [];
  const groupOptions = allGroups.map(g => ({ value: g, label: g }));

  const [selectedGroups, setSelectedGroups] = useState([])

  const createUserMutation = useMutation(usersAPI.createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users')
      toast.success('User created successfully')
      setIsModalOpen(false)
      reset()
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create user')
    }
  })

  const updateUserMutation = useMutation(
    ({ id, data }) => usersAPI.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        toast.success('User updated successfully')
        setIsModalOpen(false)
        setEditingUser(null)
        reset()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user')
      }
    }
  )

  const updateStatusMutation = useMutation(
    ({ id, status }) => usersAPI.updateUserStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        toast.success('User status updated successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update status')
      }
    }
  )

  const deleteUserMutation = useMutation(usersAPI.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users')
      toast.success('User deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  })

  const uploadProfileImageMutation = useMutation(
    ({ id, formData }) => usersAPI.uploadProfileImage(id, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        toast.success('Profile image uploaded successfully')
        setIsUploadingImage(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to upload profile image')
        setIsUploadingImage(false)
      }
    }
  )

  const deleteProfileImageMutation = useMutation(
    (id) => usersAPI.deleteProfileImage(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        toast.success('Profile image deleted successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete profile image')
      }
    }
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    control,
  } = useForm()

  const selectedRoleValue = watch('role')

  const onSubmit = async (data) => {
    const userPayload = {
      ...data,
      group: data.role === 'Sub Seizer' ? (data.group ? data.group.map(g => g.value) : []) : [],
      status: data.status ? data.status.value : 'Active',
    }
    try {
      let createdUser;
      if (editingUser) {
        await updateUserMutation.mutateAsync({ id: editingUser._id, data: userPayload });
        createdUser = editingUser;
      } else {
        const res = await createUserMutation.mutateAsync(userPayload);
        createdUser = res?.data?.user;
      }

      // Handle profile image upload
      if (profileImage && createdUser?._id) {
        setIsUploadingImage(true);
        try {
          const formData = new FormData();
          formData.append('profileImage', profileImage);
          await uploadProfileImageMutation.mutateAsync({ 
            id: createdUser._id, 
            formData 
          });
        } catch (imgErr) {
          console.error('Profile image upload failed:', imgErr);
        }
      }

      setProfileImage(null);
      setProfileImagePreview(null);
      reset();
    } catch (error) {
      console.error('User creation or image upload error:', error);
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user);
    // Map user's group array to react-select format
    const groupValue = (user.group || []).map(g => ({ value: g, label: g }));
    reset({
      fullName: user.fullName,
      username: user.username,
      mobileNo: user.mobileNo,
      role: user.role,
      group: groupValue,
      iCard: user.iCard,
    });
    setIsModalOpen(true);
  };

  const handleView = (user) => {
    setViewingUser(user)
  }

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId)
    }
  }

  const handleStatusChange = (userId, newStatus) => {
    updateStatusMutation.mutate({ id: userId, status: newStatus })
  }

  const handleDeleteProfileImage = (userId) => {
    if (window.confirm('Are you sure you want to delete this profile image?')) {
      deleteProfileImageMutation.mutate(userId)
    }
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setViewingUser(null)
    reset()
    setProfileImage(null)
    setProfileImagePreview(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setViewingUser(null)
    reset()
    setProfileImage(null)
    setProfileImagePreview(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfileImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setProfileImage(null);
      setProfileImagePreview(null);
    }
  }

  const removeSelectedImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const match = imagePath.match(/id=([^&]+)/);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    return imagePath;
  }

  const users = usersData?.users || []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input-field"
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Sub Seizer">Sub Seizer</option>
            </select>
          </div>
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Hold">Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData?.data?.users?.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.profileImage ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.profileImage}
                              alt={user.fullName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <PhotoIcon className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.employeeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'Admin' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.status}
                        onChange={(e) => handleStatusChange(user._id, e.target.value)}
                        className={`text-sm font-semibold rounded-full px-2 py-1 ${
                          user.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : user.status === 'Inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Hold">Hold</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleView(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...register('fullName', { required: 'Full name is required' })}
                    className="input-field"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    {...register('username', { required: 'Username is required' })}
                    className="input-field"
                    disabled={editingUser}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      {...register('password', { 
                        required: !editingUser ? 'Password is required' : false,
                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                      })}
                      className="input-field"
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    {...register('mobileNo', { required: 'Mobile number is required' })}
                    className="input-field"
                  />
                  {errors.mobileNo && (
                    <p className="text-sm text-red-600">{errors.mobileNo.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <Controller
                    name="role"
                    control={control}
                    rules={{ required: 'Role is required' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={roleOptions}
                        placeholder="Select Role"
                        className="react-select-container"
                        classNamePrefix="react-select"
                        value={roleOptions.find(opt => opt.value === field.value) || null}
                        onChange={val => field.onChange(val.value)}
                      />
                    )}
                  />
                  {errors.role && <p className="text-sm text-red-600">{errors.role.message}</p>}
                </div>

                {selectedRoleValue === 'Sub Seizer' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                    <Controller
                      name="group"
                      control={control}
                      rules={{ required: 'Group is required for Sub Seizer' }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isMulti
                          options={groupOptions}
                          placeholder="Select Groups"
                          className="react-select-container"
                          classNamePrefix="react-select"
                          value={groupOptions.filter(opt => (field.value || []).map(v => v.value).includes(opt.value))}
                          onChange={val => field.onChange(val)}
                        />
                      )}
                    />
                    {errors.group && <p className="text-sm text-red-600">{errors.group.message}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ICard (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('iCard')}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="input-field"
                    />
                    {profileImagePreview && (
                      <div className="relative inline-block">
                        <img 
                          src={profileImagePreview} 
                          alt="Preview" 
                          className="mt-2 rounded w-24 h-24 object-cover border" 
                        />
                        <button
                          type="button"
                          onClick={removeSelectedImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
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
                    disabled={createUserMutation.isLoading || updateUserMutation.isLoading || isUploadingImage}
                    className="btn-primary"
                  >
                    {createUserMutation.isLoading || updateUserMutation.isLoading || isUploadingImage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      editingUser ? 'Update' : 'Create'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-16 w-16">
                    {viewingUser.profileImage ? (
                      <img
                        className="h-16 w-16 rounded-full object-cover"
                        src={getImageUrl(viewingUser.profileImage)}
                        alt={viewingUser.fullName}
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{viewingUser.fullName}</h4>
                    <p className="text-sm text-gray-500">{viewingUser.username}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <p className="text-sm text-gray-900">{viewingUser.employeeId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                  <p className="text-sm text-gray-900">{viewingUser.mobileNo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="text-sm text-gray-900">{viewingUser.role}</p>
                </div>
                {viewingUser.group && viewingUser.group.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Group</label>
                    <p className="text-sm text-gray-900">{viewingUser.group.join(', ')}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{viewingUser.status}</p>
                </div>
                {viewingUser.iCard && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ICard</label>
                    <p className="text-sm text-gray-900">{viewingUser.iCard}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-sm text-gray-900">
                    {new Date(viewingUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {viewingUser.profileImage && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleDeleteProfileImage(viewingUser._id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete Profile Image
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setViewingUser(null)}
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