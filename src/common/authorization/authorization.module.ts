import { Global, Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';
import { AbilitiesGuard } from '../guards/abilities.guard';

@Global()
@Module({
  providers: [CaslAbilityFactory, AbilitiesGuard],
  exports: [CaslAbilityFactory, AbilitiesGuard],
})
export class AuthorizationModule {}
