import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  InferSubjects,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UserRole } from '../../auth/entities/auth.entity';

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

export type Subject = 'User' | 'Customer' | 'Transaction' | 'all';

export type AppAbility = MongoAbility<[Action, Subject]>;

export interface RequiredRule {
  action: Action;
  subject: Subject;
}

@Injectable()
export class CaslAbilityFactory {
  createForUser(role: UserRole): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    if (role === 'admin') {
      // Admin has full access to everything
      can('manage', 'all');
    } else if (role === 'customer_service') {
      // Customer service can read all resources
      can('read', 'Customer');
      can('read', 'Transaction');
      can('read', 'User');

      // Customer service cannot create users (invite)
      cannot('create', 'User');
    }

    return build();
  }
}
