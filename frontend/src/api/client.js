import axios from 'axios'

const api = axios.create({ baseURL: 'https://improved-enigma-7vq66jq5gr96fp9jx-8000.app.github.dev' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
