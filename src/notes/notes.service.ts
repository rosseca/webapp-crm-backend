import { Injectable, Inject } from '@nestjs/common';
import {
  INotesRepository,
  NOTES_REPOSITORY,
} from './repositories/notes.repository.interface';
import { CustomerNote } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { GcpLoggingService, ServiceLogger } from '../common/logging';

@Injectable()
export class NotesService {
  private readonly logger: ServiceLogger;

  constructor(
    @Inject(NOTES_REPOSITORY)
    private readonly notesRepository: INotesRepository,
    private readonly loggingService: GcpLoggingService,
  ) {
    this.logger = this.loggingService.forService('NotesService');
  }

  async getNotesByCustomerId(customerId: string): Promise<CustomerNote[]> {
    await this.logger.info(
      'getNotesByCustomerId',
      'Fetching notes for customer',
      { customerId },
    );

    try {
      const notes = await this.notesRepository.getNotesByCustomerId(customerId);
      await this.logger.info(
        'getNotesByCustomerId',
        'Notes fetched successfully',
        { customerId, count: notes.length },
      );
      return notes;
    } catch (error) {
      await this.logger.error(
        'getNotesByCustomerId',
        'Failed to fetch notes',
        error instanceof Error ? error : new Error(String(error)),
        { customerId },
      );
      throw error;
    }
  }

  async createNote(
    customerId: string,
    data: CreateNoteDto,
  ): Promise<CustomerNote> {
    await this.logger.info('createNote', 'Creating note for customer', {
      customerId,
      author: data.author,
    });

    try {
      const note = await this.notesRepository.createNote(customerId, data);
      await this.logger.info('createNote', 'Note created successfully', {
        customerId,
        noteId: note.id,
      });
      return note;
    } catch (error) {
      await this.logger.error(
        'createNote',
        'Failed to create note',
        error instanceof Error ? error : new Error(String(error)),
        { customerId },
      );
      throw error;
    }
  }
}
