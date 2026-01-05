import { Injectable } from '@nestjs/common';
import { IRepository, FindAllOptions } from '../interfaces/repository.interface';

@Injectable()
export abstract class BaseRepository<
  T,
  CreateDto = Partial<T>,
  UpdateDto = Partial<T>,
> implements IRepository<T, CreateDto, UpdateDto>
{
  abstract create(dto: CreateDto): Promise<T>;

  abstract findById(id: string): Promise<T | null>;

  abstract findAll(options?: FindAllOptions): Promise<T[]>;

  abstract update(id: string, dto: UpdateDto): Promise<T>;

  abstract delete(id: string): Promise<boolean>;

  async exists(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }
}
