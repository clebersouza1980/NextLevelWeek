import express from 'express';
import ClassesControllers from './controllers/classes_controller';
import ConnectionsControllers from './controllers/connections_controllers';

const routes = express.Router();
const classesControllers = new ClassesControllers();
const connectionsControllers = new ConnectionsControllers();

routes.get('/classes',classesControllers.index);
routes.post('/classes',classesControllers.create);

routes.post('/connections',connectionsControllers.create);
routes.get('/connections',connectionsControllers.index);



export default routes;
