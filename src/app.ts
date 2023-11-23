import express, { Request, Response } from 'express';
import 'reflect-metadata';
import { globalErrorHandler } from './config/globalErrorHandler';
import authRouter from './routes/auth';

const app = express();

app.get('/', async (req: Request, res: Response) => {
    const name = (req.query.name as string) || '';
    res.status(200).send('Welcome to auth service: ' + name);
});

app.use('/auth', authRouter);

// global error handler; keep this last
app.use(globalErrorHandler);

export default app;
