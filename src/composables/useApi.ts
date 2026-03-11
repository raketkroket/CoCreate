import { ref } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

let token = localStorage.getItem('token') || null
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const loading = ref(false)

const setToken = (newToken) => {
  token = newToken
  localStorage.setItem('token', token)
}

const setUser = (newUser) => {
  user.value = newUser
  localStorage.setItem('user', JSON.stringify(newUser))
}

const clearAuth = () => {
  token = null
  user.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

const apiCall = async (method, endpoint, data = null) => {
  const headers = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const options = {
    method,
    headers
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  const response = await fetch(`${API_URL}${endpoint}`, options)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API error')
  }

  return response.json()
}

export function useApi() {
  // Auth
  const register = async (email, password, username) => {
    loading.value = true
    try {
      const response = await apiCall('POST', '/auth/register', {
        email,
        password,
        username
      })
      setToken(response.token)
      setUser(response.user)
      return response.user
    } finally {
      loading.value = false
    }
  }

  const login = async (email, password) => {
    loading.value = true
    try {
      const response = await apiCall('POST', '/auth/login', {
        email,
        password
      })
      setToken(response.token)
      setUser(response.user)
      return response.user
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    clearAuth()
  }

  // Students
  const getStudents = async () => {
    return apiCall('GET', '/students')
  }

  const getStudent = async (id) => {
    return apiCall('GET', `/students/${id}`)
  }

  const createStudent = async (name) => {
    return apiCall('POST', '/students', { name })
  }

  const updateStudent = async (id, data) => {
    return apiCall('PATCH', `/students/${id}`, data)
  }

  const deleteStudent = async (id) => {
    return apiCall('DELETE', `/students/${id}`)
  }

  // Attendance
  const getAttendance = async (startDate, endDate) => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    return apiCall('GET', `/attendance?${params.toString()}`)
  }

  const markAttendance = async (studentId, date, onTime) => {
    return apiCall('POST', '/attendance', {
      studentId,
      date,
      onTime
    })
  }

  const updateAttendance = async (id, onTime) => {
    return apiCall('PATCH', `/attendance/${id}`, { onTime })
  }

  const deleteAttendance = async (id) => {
    return apiCall('DELETE', `/attendance/${id}`)
  }

  // Rewards
  const getRewards = async () => {
    return apiCall('GET', '/rewards')
  }

  const createReward = async (name, description, pointsRequired, icon) => {
    return apiCall('POST', '/rewards', {
      name,
      description,
      pointsRequired,
      icon
    })
  }

  const getStudentRewards = async (studentId) => {
    return apiCall('GET', `/rewards/student/${studentId}`)
  }

  const assignReward = async (studentId, rewardId) => {
    return apiCall('POST', '/rewards/assign', {
      studentId,
      rewardId
    })
  }

  const updateRewardRedeemed = async (id, redeemed) => {
    return apiCall('PATCH', `/rewards/${id}/redeem`, { redeemed })
  }

  const deleteReward = async (id) => {
    return apiCall('DELETE', `/rewards/${id}`)
  }

  // Teacher
  const getTeacher = async () => {
    return apiCall('GET', '/teacher')
  }

  const getTeacherSettings = async () => {
    return apiCall('GET', '/teacher/settings')
  }

  const updateTeacherSettings = async (data) => {
    return apiCall('PATCH', '/teacher/settings', data)
  }

  return {
    // Auth
    register,
    login,
    logout,
    token: () => token,
    user,
    loading,

    // Students
    getStudents,
    getStudent,
    createStudent,
    updateStudent,
    deleteStudent,

    // Attendance
    getAttendance,
    markAttendance,
    updateAttendance,
    deleteAttendance,

    // Rewards
    getRewards,
    createReward,
    getStudentRewards,
    assignReward,
    updateRewardRedeemed,
    deleteReward,

    // Teacher
    getTeacher,
    getTeacherSettings,
    updateTeacherSettings
  }
}
