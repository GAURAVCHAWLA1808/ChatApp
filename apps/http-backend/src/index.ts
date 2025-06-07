import express from "express";
import Middleware from "./middleware";
const jwt = require('jsonwebtoken')
import { JWT_SCERET } from "@repo/backend-common/config"
import { signinSchema, signupSchema, createroom } from "@repo/common/types"
import { prismaClient } from "@repo/db/client"
import { Request,Response } from "express";
import { Prisma } from "@prisma/client";


const app = express()
app.use(express.json())


app.post('/signup', async (req:Request, res:Response) => {
    const parsedData = signupSchema.safeParse(req.body)
    if (!parsedData.success) {
        res.json({
            message: "invalid inputs"
        })

        return
    }
    console.log("1")
    let Id 
    try {
        
        const user = await prismaClient.user.create({
            
            data: {
                email: parsedData.data.username,
                password: parsedData.data.password,
                name : parsedData.data.name,
               }
            })  
            
        Id = user.id
        console.log("2")
        const token = jwt.sign({Id}, JWT_SCERET)
         res.status(200).json({
            token: token
         })
        return
             } catch (err:any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code == 'P2002') {
            res.status(400).json({
        message:"email is already exist"
            })
        } else {
            res.status(411).json({
                message:"internal server error"
            })
}
        return
       }
    

})
app.post('/signin', async (req:Request, res:Response) => {
    const parsedData = signinSchema.safeParse(req.body)
    if (!parsedData.success) {
          res.json({
            message: "not a valid email Id "
          })
        return 
    }    
    
    const username = parsedData.data?.username
    const password = parsedData.data?.password
    try {
        const user = await prismaClient.user.findUnique({
            where: {
                email: username
            }
        })
        if (user?.password !== password) {
            res.status(401).json({
                message: "invalid credential"
            })
            return
        }
      const Id = user.id
        const token = jwt.sign({userId:Id}, JWT_SCERET)
        res.status(200).json({
            token:token
        })
    return
       } catch (err) {
           res.status(500).json({
               message:"internal server error"
           })
       }
    
})
app.post('/create-room', Middleware ,async (req, res) => {
    const parsedData = createroom.safeParse(req.body)
    if (!parsedData.success) {
        res.status(400).json({
            message:"invalid credentials"
        })
        return
    }
    const userId = req.userId
    console.log(userId)
    const name = parsedData.data.name
    console.log(name)
   try {
    const room = await prismaClient.rooms.create({
        
        data: {
            slug: name,
            adminId: userId,
            }
    })
       res.status(200).json({
           "roomId":room.id
       })
       return
   } catch (error) {
       res.status(411).json({
        message:"room already exist with this name"
    })
   }
    
})

app.get("/chats/:roomId", Middleware, async (req: Request, res: Response) => {
    try {
        const roomId = Number(req.params.roomId)
        const messages = await prismaClient.chats.findMany({
            where: {
             roomId: roomId,
            },
            orderBy: {id: "desc"},
            take: 1000
            })
        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
})
app.get("/room/:slug", Middleware , async (req:Request,res:Response) => {
    const slug = req.params.slug
    try {
        const room = await prismaClient.rooms.findFirst({
            where: {
               slug:slug 
           }
        })
        res.status(200).json({
           room
        })
    } catch (error) {
        res.json({
            message :"there is no room which such name"
        })
    }
})

app.delete("/delete/:slug", Middleware, (req, res) => {
    const slug = req.params.slug
 try {
    const room = prismaClient.rooms.findFirst({
        where: {
           slug:slug
       }
    })

    if (room == null) {
        res.status(404).json({
            message:"there is no such room "
        })
    }

    prismaClient.rooms.delete({
    where: {
        slug:slug 
    }
})
 } catch (error) {
     res.status(500).json({
        message:"internal server error"
    })
 }

})
app.listen(4000)
