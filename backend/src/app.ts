import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/v1', routes);

// Error Handling
app.use(errorMiddleware);

export default app;
