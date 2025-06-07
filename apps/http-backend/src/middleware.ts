import { Request, Response, NextFunction } from "express"
import {JWT_SCERET} from "@repo/backend-common/config"
const jwt = require('jsonwebtoken')


export default function Middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.header("Authorization")
    console.log(token)
   try {
       const decoded = jwt.verify(token,JWT_SCERET)
       console.log(decoded)
    if (decoded.Id) {
        req.userId = decoded.Id
        next()
    } else {
        res.json({
            messsge:"unauthorised token"
        })
    }
       
   } catch (error) {
       res.status(401).json({
           message: "invalid token",
           error
    })
   } 
    
}