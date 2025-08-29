import axios from 'axios'
import { useAuthStore } from '../store/auth'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })
api.interceptors.request.use(config=>{ const t = useAuthStore.getState().token; if(t) config.headers.Authorization=`Bearer ${t}`; return config })
export default api
