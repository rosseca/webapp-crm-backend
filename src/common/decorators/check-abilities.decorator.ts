import { SetMetadata } from '@nestjs/common';
import { RequiredRule } from '../authorization/casl-ability.factory';

export const CHECK_ABILITIES_KEY = 'check_abilities';

export const CheckAbilities = (...requirements: RequiredRule[]) =>
  SetMetadata(CHECK_ABILITIES_KEY, requirements);
