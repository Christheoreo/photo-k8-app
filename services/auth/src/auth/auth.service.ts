import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  private readonly privateKey: Buffer;
  private readonly publicKey: Buffer;

  constructor(private readonly db: DatabaseService) {
    const privateKeyPath =
      process.env.PRIVATE_KEY_PATH ?? '/app/keys/private.pem';
    const publicKeyPath = process.env.PUBLIC_KEY_PATH ?? '/app/keys/public.pem';
    this.privateKey = fs.readFileSync(privateKeyPath);
    this.publicKey = fs.readFileSync(publicKeyPath);
  }

  private signToken(payload: object): string {
    return jwt.sign(payload, this.privateKey, {
      algorithm: 'ES256',
      expiresIn: '24h',
    });
  }

  async register(email: string, password: string): Promise<void> {
    // Check if user already exists
    const existing = await this.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst();

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const password_hash = await bcrypt.hash(password, 12);

    await this.db
      .insertInto('users')
      .values({ email, password_hash })
      .returning(['id', 'email'])
      .executeTakeFirstOrThrow();
  }

  async login(email: string, password: string): Promise<{ token: string }> {
    const user = await this.db
      .selectFrom('users')
      .select(['id', 'email', 'password_hash'])
      .where('email', '=', email)
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.signToken({ sub: user.id, email: user.email });
    return { token };
  }

  verify(token: string): object {
    try {
      return jwt.verify(token, this.publicKey, {
        algorithms: ['ES256'],
      }) as object;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
