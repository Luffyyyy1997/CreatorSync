import axiosClient from './axiosClient.js'

export const postsApi = {
  list: async (params = {}) => {
    const { data } = await axiosClient.get('/posts', { params })
    return data
  },

  get: async (id) => {
    const { data } = await axiosClient.get(`/posts/${id}`)
    return data
  },

  create: async (postData) => {
    const { data } = await axiosClient.post('/posts', postData)
    return data
  },

  update: async (id, postData) => {
    const { data } = await axiosClient.put(`/posts/${id}`, postData)
    return data
  },

  remove: async (id) => {
    await axiosClient.delete(`/posts/${id}`)
  },

  publishNow: async (id) => {
    const { data } = await axiosClient.post(`/posts/${id}/publish-now`)
    return data
  },
}
