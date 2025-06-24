import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import {jwtSecret} from "backend-common/constants";

const wss=new WebSocketServer({ port: 8080 });
wss.on("connection", async(ws,request) => {
  console.log("New client connected");
  const url=request.url;
  if(!url){
    return
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token")||"";
  const decoded=await jwt.verify(token, jwtSecret);

  if (!decoded|| !(decoded as JwtPayload).username) {
    console.log("Invalid token");
    ws.close();
    return;
  }

  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
    // Echo the message back to the client
    ws.send(`Echo: ${message}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});