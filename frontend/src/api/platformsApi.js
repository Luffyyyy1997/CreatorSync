import axiosClient from './axiosClient.js'

export const platformsApi = {
  status: async () => {
    const { data } = await axiosClient.get('/platforms/status')
    return data  // { twitter: bool, instagram: bool, youtube: bool, tiktok: bool }
  },

  connect: (platform) => {
    // Redirect the browser to the OAuth consent URL
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    // We need to include the JWT for the backend to identify the user
    const token = localStorage.getItem('cs_token')
    window.location.href = `${base}/platforms/${platform}/connect?token=${token}`
  },

  disconnect: async (platform) => {
    await axiosClient.delete(`/platforms/${platform}/disconnect`)
  },
}
