import pool from "../db";

export default async function run(sql: string) {
    const connection = await pool.getConnection();
    let result = undefined;
    try {
        const r = await connection.execute(sql);
        result = r;
    } catch (e) {
        console.error(e);
    } finally {
        connection.release();
        return result;
    }
}