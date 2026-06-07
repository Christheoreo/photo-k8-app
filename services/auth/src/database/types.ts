import { Generated } from 'kysely'

export interface UserTable {
  id: Generated<string>
  email: string
  password_hash: string
  created_at: Generated<Date>
}

export interface Database {
  users: UserTable
}