import { CustomerNote } from '../entities/note.entity';
import { CreateNoteDto } from '../dto/create-note.dto';

export interface INotesRepository {
  getNotesByCustomerId(customerId: string): Promise<CustomerNote[]>;
  createNote(customerId: string, data: CreateNoteDto): Promise<CustomerNote>;
}

export const NOTES_REPOSITORY = 'NOTES_REPOSITORY';
