import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'k8yJ6vQ9pL2fT7rX3zC5hB8nG1dM4sW7',
    });
  }
  async valide(payload: any) {
    return {
      userId: payload.sub, sender: payload.sender
    };
  }
}