const { createClient } = require('@supabase/supabase-js');

// OLD Project (Source)
const OLD_URL = 'https://oqtlakdvlmkaalymgrwd.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdGxha2R2bG1rYWFseW1ncndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzA3MTYsImV4cCI6MjA2NDQwNjcxNn0.FeGpQzJon_remo0_-nQ3e4caiWjw5un9p7rK3EcJfjY';

// NEW Project (Destination)
const NEW_URL = 'https://spqjbrmpwgwjcynvbadr.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcWpicm1wd2d3amN5bnZiYWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NTc2MzAsImV4cCI6MjA4NjUzMzYzMH0.kZAA9T_C3lsinqRFOyhKxEaCZ-KpobflDdhQeN2HCWM';

const oldClient = createClient(OLD_URL, OLD_KEY);
const newClient = createClient(NEW_URL, NEW_KEY);

const tables = [
    'users', // Profiles only
    'activities',
    'posts',
    'study_groups',
    'conversations'
];

const dependentTables = [
    'activity_participants',
    'study_group_members',
    'comments',
    'post_likes',
    'conversation_members',
    'messages',
    'notifications'
];

async function migrateTable(tableName) {
    console.log(`Migrating ${tableName}...`);

    // Fetch from Old
    const { data: oldData, error: readError } = await oldClient
        .from(tableName)
        .select('*');

    if (readError) {
        console.error(`Error reading ${tableName}:`, readError.message);
        return;
    }

    if (!oldData || oldData.length === 0) {
        console.log(`No data in ${tableName}.`);
        return;
    }

    console.log(`Found ${oldData.length} rows in ${tableName}. Inserting...`);

    // Transform Data
    const mappedData = oldData.map(row => {
        const newRow = { ...row };

        // Fix Posts: userId -> user_id
        if (tableName === 'posts') {
            if (newRow.userId && !newRow.user_id) {
                newRow.user_id = newRow.userId;
            }
        }

        // Fix Comments: userId -> user_id, postId -> post_id
        if (tableName === 'comments') {
            if (newRow.userId && !newRow.user_id) {
                newRow.user_id = newRow.userId;
            }
            if (newRow.postId && !newRow.post_id) {
                newRow.post_id = newRow.postId;
            }
        }

        return newRow;
    });

    // Insert into New
    const chunkSize = 100;
    for (let i = 0; i < mappedData.length; i += chunkSize) {
        const chunk = mappedData.slice(i, i + chunkSize);

        const { error: writeError } = await newClient
            .from(tableName)
            .upsert(chunk);

        if (writeError) {
            console.error(`Error writing chunk ${i} to ${tableName}:`, writeError.message);
        } else {
            console.log(`  Wrote rows ${i} to ${i + chunk.length}`);
        }
    }
}

async function runMigration() {
    console.log("Starting Migration...");

    // 1. Base Tables
    for (const table of tables) {
        await migrateTable(table);
    }

    // 2. Dependent Tables
    for (const table of dependentTables) {
        await migrateTable(table);
    }

    console.log("Migration Complete.");
}

runMigration();
