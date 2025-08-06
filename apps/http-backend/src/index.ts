import express from 'express';
import {prismaClient} from '@repo/db/client';
import jwt from 'jsonwebtoken';
import {jwtSecret} from "backend-common/constants";
import bcrypt from 'bcrypt';
import {z} from 'zod';
import { middleware } from './middleware';
import { CreateUserSchema,SigninSchema,CreateRoomSchema } from '@repo/common/types';

const app=express();
app.use(express.json());

app.post('/signup', async(req, res) => {
    try{
    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }
    const {email,password,name}=parsedData.data;
    if (!email || !password) {
        res.status(400).json({ error: 'email and password are required' });
        return;
    }
    const hashedPassword=await bcrypt.hash(password, 5);
    const user =await prismaClient.user.create({
        data:{
            email,
            password: hashedPassword,
            name
        }
    })
    res.json({ message: 'User created successfully', user });
} catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error });
}

    
})

app.post('/signin', async (req, res) => {
    try{
        const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }
    const {email,password}=parsedData.data;
    if (!email || !password) {
        res.status(400).json({ error: 'email and password are required' });
        return;
    }
    const user=await prismaClient.user.findUnique({
        where:{email}
    })
    if(!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if(!isPasswordValid) {
        res.status(401).json({ error: 'Invalid password' });
        return;
    }
    const token =jwt.sign({email,userId:user.id},jwtSecret)
    res.setHeader('authorization', token);  

    res.json({ message: 'User signed in successfully', user, token });
    } catch (error) {
        console.error('Error signing in user:', error);
        res.status(500).json({ error });
    }
    

    
})

app.post('/room',middleware, async (req, res) => {
    try{
    const parsedData=CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }
    //@ts-ignore
    const adminId=req.user.id;
    const room =await prismaClient.room.create({
        data:{
            slug: parsedData.data.name,
            adminId: adminId
        }
    })
    res.json({ message: 'Room created successfully', room });
} catch (error) {
    res.status(400).json({error:"room already exists or invalid data"});
}

})
app.get('/chats',middleware,async(req,res)=>{
    const roomId=req.query.roomId as string;
    if(!roomId) {
        res.status(400).json({ error: 'roomId is required' });
        return;
    }
    const intRoomId=parseInt(roomId, 10);
    const chats=await prismaClient.chat.findMany({
        take: 100,
        where: {
            roomId: intRoomId
        },
    })
})
let balance:{[key:string]:number} = {};

app.get('/balance',(req,res)=>{
    const number=req.body.number as string;
    if(!number) {
        res.status(400).json({ error: 'number is required' });
        return;
    }
    res.json({balance: balance[number] || 0});
})

app.post('/balance', (req, res) => {
    const { number, amount } = req.body;
    if (!number || !amount) {
        res.status(400).json({ error: 'number and amount are required' });
        return;
    }
    if (!balance[number]) {
        balance[number] = 0;
    }
    balance[number] += amount;
    res.json({ message: 'Balance updated successfully', balance: balance[number] });
});


app.listen(3001);
