import pool from "../db";


export default async function listTables() {
    const connection = await pool.getConnection();
    let result;
    try {
        const [rows, fields] = await connection.query("SHOW TABLES");
        console.log("Tables in the database: ");
        const r = [];
        //@ts-ignore
        for (const row of rows) {
            if (row.Tables_in_Database) {
                const schema = await connection.query(`DESCRIBE ${row.Tables_in_Database}`);
                console.log(row.Tables_in_Database);
                console.log(schema);
                const name = row.Tables_in_Database;
                r.push({ name, schema });
            }
        }
        result = r;
    } catch (e) {
        console.error(e);
    } finally {
        connection.release();
        return result;
    }
}