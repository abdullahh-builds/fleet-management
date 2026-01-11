require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    try {
        // Check if users.json exists
        if (!fs.existsSync('users.json')) {
            console.log('📝 No users.json found. Will create admin account via app initialization.');
            process.exit(0);
        }

        // Read existing users.json
        const data = fs.readFileSync('users.json', 'utf8');
        const users = JSON.parse(data);
        
        console.log(`📂 Found ${users.length} users in users.json`);
        
        // Insert each user into PostgreSQL
        for (const user of users) {
            await pool.query(
                'INSERT INTO users (user_id, email, password, name, role, status) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO UPDATE SET email=$2, password=$3, name=$4, role=$5, status=$6',
                [user.userId, user.email, user.password, user.name, user.role, user.status]
            );
            console.log(`✅ Migrated: ${user.email} (${user.role})`);
        }
        
        // Verify migration
        const result = await pool.query('SELECT email, role, status FROM users ORDER BY role DESC');
        console.log(`\n✅ Total users in PostgreSQL: ${result.rows.length}`);
        console.log('📊 Users in database:');
        result.rows.forEach(u => console.log(`   - ${u.email} [${u.role}] (${u.status})`));
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
})();
