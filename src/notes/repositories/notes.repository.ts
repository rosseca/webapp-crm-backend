import { Injectable, Inject, Logger } from '@nestjs/common';
import { Firestore, Timestamp } from '@google-cloud/firestore';
import { FIRESTORE } from '../../common/firestore/firestore.module';
import { INotesRepository } from './notes.repository.interface';
import { CustomerNote } from '../entities/note.entity';
import { CreateNoteDto } from '../dto/create-note.dto';

@Injectable()
export class NotesRepository implements INotesRepository {
  private readonly logger = new Logger(NotesRepository.name);
  private notesCollection;

  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {
    this.notesCollection = this.firestore.collection('customer_notes');
  }

  async getNotesByCustomerId(customerId: string): Promise<CustomerNote[]> {
    this.logger.log(`Getting notes for customer: ${customerId}`);

    try {
      const snapshot = await this.notesCollection
        .where('customer_id', '==', customerId)
        .get();

      if (snapshot.empty) {
        return [];
      }

      const notes = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          customer_id: data.customer_id,
          content: data.content,
          author: data.author || undefined,
          created_at: data.created_at?.toDate?.()?.toISOString() || null,
          updated_at: data.updated_at?.toDate?.()?.toISOString() || null,
        } as CustomerNote;
      });

      // Sort by created_at descending (newest first)
      return notes.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    } catch (error) {
      this.logger.error(`Failed to get notes: ${error.message}`);
      throw error;
    }
  }

  async createNote(
    customerId: string,
    data: CreateNoteDto,
  ): Promise<CustomerNote> {
    this.logger.log(`Creating note for customer: ${customerId}`);

    try {
      const now = Timestamp.now();
      const docRef = await this.notesCollection.add({
        customer_id: customerId,
        content: data.content,
        author: data.author || null,
        created_at: now,
        updated_at: now,
      });

      const newDoc = await docRef.get();
      const docData = newDoc.data();

      return {
        id: docRef.id,
        customer_id: customerId,
        content: docData?.content,
        author: docData?.author || undefined,
        created_at: docData?.created_at?.toDate?.()?.toISOString() || null,
        updated_at: docData?.updated_at?.toDate?.()?.toISOString() || null,
      } as CustomerNote;
    } catch (error) {
      this.logger.error(`Failed to create note: ${error.message}`);
      throw error;
    }
  }
}
