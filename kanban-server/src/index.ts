import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';

const app: Express = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/', (req: Request, res: Response) => {
  res.send('Kanban Server is running');
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
