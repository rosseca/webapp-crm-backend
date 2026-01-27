import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { NotesRepository } from './repositories/notes.repository';
import { NOTES_REPOSITORY } from './repositories/notes.repository.interface';
import { FirestoreModule } from '../common/firestore/firestore.module';

const NotesRepositoryProvider = {
  provide: NOTES_REPOSITORY,
  useClass: NotesRepository,
};

@Module({
  imports: [FirestoreModule],
  controllers: [NotesController],
  providers: [NotesRepositoryProvider, NotesService],
  exports: [NotesService],
})
export class NotesModule {}
