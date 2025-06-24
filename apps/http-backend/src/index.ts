import express from 'express';
const {prismaClient} =require('db/client');
import jwt from 'jsonwebtoken';
import {jwtSecret} from "backend-common/constants";
import bcrypt from 'bcrypt';
import {z} from 'zod';
import { middleware } from './middleware';
import { CreateUserSchema,SigninSchema } from '@repo/common/types';

const app=express();
app.use(express.json());

app.post('/signup', async(req, res) => {
    try{
    const validBody = CreateUserSchema.safeParse(req.body);
    if(!validBody.success) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }
    const {username,password}=req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
    }
    const hashedPassword=await bcrypt.hash(password, 5);
    const user =await prismaClient.user.create({
        data:{
            username,
            password: hashedPassword
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
        const validBody = SigninSchema.safeParse(req.body);
    if(!validBody.success) {
        res.status(400).json({ error: 'Invalid request body' });
        return;
    }
    const {username,password}=req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
    }
    const user=await prismaClient.user.findUnique({
        where:{username}
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
    const token =jwt.sign({username},jwtSecret)
    res.setHeader('authorization', token);  

    res.json({ message: 'User signed in successfully', user, token });
    } catch (error) {
        console.error('Error signing in user:', error);
        res.status(500).json({ error });
    }
    

    
})

app.get('/rooms',middleware, async (req, res) => {
    res.json({ message: 'Welcome to the rooms endpoint', username: (req as any).username });
})


app.listen(3001);
