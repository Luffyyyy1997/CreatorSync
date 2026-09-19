import axiosClient from './axiosClient.js'

export const aiApi = {
  ideas: async (topic, platform = 'general') => {
    const { data } = await axiosClient.post('/ai/ideas', { topic, platform })
    return data.ideas  // string[]
  },

  caption: async (topic, platform = 'general') => {
    const { data } = await axiosClient.post('/ai/caption', { topic, platform })
    return data.caption  // string
  },

  hashtags: async (topic, platform = 'general') => {
    const { data } = await axiosClient.post('/ai/hashtags', { topic, platform })
    return data.hashtags  // string[]
  },
}
