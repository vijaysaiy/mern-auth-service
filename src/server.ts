import app from './app';
import { Config } from './config';
import { AppDataSource } from './config/data-source';
import logger from './config/logger';

const startServer = async () => {
    const PORT = Config.PORT;
    try {
        await AppDataSource.initialize();
        logger.info('Database connected succesfully');
        logger.debug('debug log', {});
        app.listen(PORT, () =>
            logger.info('Auth service started and listening at port ' + PORT),
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error('Error starting Auth service:', error.message);
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        }
    }
};

void startServer();
