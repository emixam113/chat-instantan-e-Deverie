import {DataSourceOptions} from 'typeorm';
import "dotenv/config";

export const databaseConfig: DataSourceOptions = {
    type:'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DATABASE_PORT ||'5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],  
    synchronize: false,
}