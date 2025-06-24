import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {jwtSecret} from "backend-common/constants";

export function middleware(req: Request, res: Response, next: NextFunction) {
  // Log the request method and URL
  const token=req.headers["authorization"]||"";
  if (!token) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }
  const decoded =jwt.verify(token,jwtSecret);
  if(decoded){
    // @ts-ignore: TODO: add types to express request
    req.username=decoded.username;
    next();
  }else {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }
  

  // Add a custom header
  

  // Call the next middleware or route handler
  
}