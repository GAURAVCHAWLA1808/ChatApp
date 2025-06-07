import WebSocket, { WebSocketServer } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SCERET } from "@repo/backend-common/config"
import {prismaClient} from "@repo/db/client"


interface user {
  ws: WebSocket,
  rooms: string[],
  userId:string 
}

const users :user[] =[]
const wss = new WebSocketServer({ port: 8080 });

function checkuser (token:string): string | null {
  
  try {
    const decoded = jwt.verify(token, JWT_SCERET)  
    console.log(decoded)
  if (typeof decoded == 'string') {
    return null
  }
  if (!decoded||!decoded.Id) {
    return null 
  }
  return decoded.Id
 } catch (error) {
  return null 
 }
}

wss.on('connection', function connection(ws,Request) {
 console.log("user connected")
  const url = Request.url;
  if (!url) {
    return;
  }
  const params = new URLSearchParams(url.split('?')[1])
  const token = params.get('token')||""
  const userId = checkuser(token)
  console.log(userId)
  if (userId==null)
  {
    ws.close()
    return null
  } 
  users.push({
    userId,
    rooms: [],
    ws
  })
 
 
  ws.on('message', async function message(data) {
    let parsedData;
    if (typeof data == 'string') {
      parsedData = JSON.parse(data)
    }else{
      parsedData = JSON.parse(data.toString())
    }

    if (parsedData.type == 'join') {
      const user = users.find(x => x.ws === ws)
      user?.rooms.push(parsedData.roomId)
    }

    if (parsedData.type == 'leave') {
      const user = users.find(x => x.ws === ws)
      if (!user) {
        return null
      }
      user.rooms = user.rooms.filter(x=>x !== parsedData.roomId)
    }

    if (parsedData.type == 'chat') {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      const client = users.find(x => x.ws == ws)
      const clientStatus = client?.rooms.includes(roomId)
      if (!clientStatus) {
        ws.send(JSON.stringify({ type: "error", message: "You must join the room before sending messages." }));
        return;
      }
      
      await prismaClient.chats.create({
        data: {
          roomId: roomId,
          message: message,
          userId
          }
      })
      users.forEach(user => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(JSON.stringify({
            type: "chat",
            message: message,
            roomId
          }))
        }
      })
    }

   
  });

  
});