import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import {jwtSecret} from "backend-common/constants";
import {prismaClient} from '@repo/db/client';

const wss=new WebSocketServer({ port: 8080 });

interface User{
  ws:WebSocket;
  userId:string;
  rooms:string[];
}

let users:User[]=[]
wss.on("connection", async(ws,request) => {
  console.log("New client connected");
  const url=request.url;
  let userId;
  if(!url){
    ws.close();
    return
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token")||"";
  try{
  const decoded=await jwt.verify(token, jwtSecret);
  

  if (!decoded|| !(decoded as JwtPayload).userId||typeof decoded=='string') {
    console.log("Invalid token");
    ws.close();
    return;
  }
  userId=decoded.userId;
  users.push({
    userId:decoded.userId,ws,rooms:[]
  })
}catch(e){
    ws.close();
    return ;
  }


  ws.on("message", (data) => {
    const parsedData=JSON.parse(data as unknown as string);
    console.log(parsedData)
    if(parsedData.type='join_room'){
      const user=users.find(x=>x.ws==ws)
      // check room exsist or permission
      user?.rooms.push(parsedData.roomId)
    }
    if(parsedData.type=='leave_room'){
      const user=users.find(x=>x.ws==ws)
      if(!user)return;
      user.rooms=user.rooms.filter(x=>x===parsedData.roomId)
    }
    else if(parsedData.type=='chat'){
      // need to check meesage 
      // need to persist message to db 

      prismaClient.chat.create({
        data:{
          message:parsedData.message,
          roomId:parsedData.roomId,
          userId
        }
      })
      
      users.forEach(user=>{
        if(user.rooms.includes(parsedData.roomId))user.ws.send(parsedData.message);
      })
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});