import axiosClient from './axiosClient.js'

export const authApi = {
  register: async (email, password, displayName) => {
    const { data } = await axiosClient.post('/auth/register', {
      email,
      password,
      display_name: displayName,
    })
    return data
  },

  login: async (email, password) => {
    const { data } = await axiosClient.post('/auth/login', { email, password })
    return data
  },

  me: async () => {
    const { data } = await axiosClient.get('/auth/me')
    return data
  },
}
