import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  CaslAbilityFactory,
  RequiredRule,
} from '../authorization/casl-ability.factory';
import { CHECK_ABILITIES_KEY } from '../decorators/check-abilities.decorator';
import { UserRole } from '../../auth/entities/auth.entity';

@Injectable()
export class AbilitiesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules =
      this.reflector.get<RequiredRule[]>(
        CHECK_ABILITIES_KEY,
        context.getHandler(),
      ) || [];

    // If no rules are defined, allow access
    if (rules.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'];

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get role from claims (token payload) - default to 'admin' for migration
    const role: UserRole = (user.claims?.role as UserRole) || 'admin';
    const ability = this.caslAbilityFactory.createForUser(role);

    // Check all required rules
    for (const rule of rules) {
      if (!ability.can(rule.action, rule.subject)) {
        throw new ForbiddenException(
          `You do not have permission to ${rule.action} ${rule.subject}`,
        );
      }
    }

    return true;
  }
}
