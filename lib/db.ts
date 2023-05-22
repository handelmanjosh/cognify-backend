import { createPool } from 'mysql2/promise';


//for the database
const pool = createPool({
    host: "cogdevdb1.cluster-c5x5puget9pa.us-east-1.rds.amazonaws.com",
    port: 3306,
    database: "Database",
    user: "cogaurdb1",
    password: "Aur_Cogdb23!",
});
export default pool;

