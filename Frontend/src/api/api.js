import axios from "axios";
import { useAbakhqrStore } from "@/stores/abakhqr";

const api = axios.create({
     baseURL: import.meta.env.BASE_URL_ABAKHQR,
     headers:{
          Accept:"application/json",
          "Content-Type":"application/json"

     }
})
api.interceptors.request.use((config) =>{
     let abakhqrStore = useAbakhqrStore();
     console.log(abakhqrStore.token);
     
     if(abakhqrStore.token){
          config.headers.Authorization = `Bearer ${abakhqrStore.token}`;
     }
     return config;
})
export default api;