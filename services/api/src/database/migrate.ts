import { Migrator, FileMigrationProvider } from 'kysely/migration'
import { db } from './database'
import * as path from 'path'
import { promises as fs } from 'fs'

async function migrate() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach(result => {
    if (result.status === 'Success') {
      console.log(`migration ${result.migrationName} ran successfully`)
    } else if (result.status === 'Error') {
      console.error(`migration ${result.migrationName} failed`)
    }
  })

  if (error) {
    console.error('migration failed:', error)
    process.exit(1)
  }

  await db.destroy()
}

migrate()