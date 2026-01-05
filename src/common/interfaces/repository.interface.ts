export interface IRepository<T, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  create(dto: CreateDto): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(options?: FindAllOptions): Promise<T[]>;
  update(id: string, dto: UpdateDto): Promise<T>;
  delete(id: string): Promise<boolean>;
}

export interface FindAllOptions {
  limit?: number;
  offset?: number;
  filters?: Record<string, unknown>;
}

export interface IApiRepository<T, CreateDto = Partial<T>, UpdateDto = Partial<T>>
  extends IRepository<T, CreateDto, UpdateDto> {
  healthCheck(): Promise<boolean>;
}
