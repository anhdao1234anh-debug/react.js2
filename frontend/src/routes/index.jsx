import { createBrowserRouter } from 'react-router';
import { routes } from './routes';

/** Router của app (Data Router API). Cây route khai báo ở ./routes.jsx, đường dẫn ở ./paths.js */
export const router = createBrowserRouter(routes);
