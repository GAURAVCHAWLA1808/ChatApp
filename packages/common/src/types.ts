import {z} from "zod"
export const signinSchema = z.object({
    username: z.string().email(),
    password: z.string().min(8),
   
    
})
    
export const signupSchema = z.object({
    username: z.string().email(),
    password: z.string().min(8),
    name:z.string(),
})
export const createroom = z.object({
    name:z.string()
})