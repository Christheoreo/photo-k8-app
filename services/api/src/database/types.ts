import { Generated, Insertable, Selectable, Updateable } from 'kysely'

export interface JobTable {
  id: Generated<string>
  status: string
  source_path: string
  result_path: string | null
  operation: string
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface UserTable {
  id: Generated<string>
  email: string
  password_hash: string
  created_at: Generated<Date>
}

export interface Database {
  jobs: JobTable
  users: UserTable
}