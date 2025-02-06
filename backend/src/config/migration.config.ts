import { DataSource } from "typeorm";
import {databaseConfig} from './database.config'

console.log(__dirname)
export default new DataSource({
    ...databaseConfig,
    migrations: [__dirname + '/../migrations/*.ts']
})