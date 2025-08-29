import { create } from 'zustand'

type Role = 'admin'|'manager'|'developer'
interface AuthState{ token:string|null; role:Role|null; setAuth:(t:string,r:Role)=>void; logout:()=>void }
export const useAuthStore = create<AuthState>((set)=>({ token:null, role:null, setAuth:(t,r)=>set({token:t,role:r}), logout:()=>set({token:null, role:null}) }))
