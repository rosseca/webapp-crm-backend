import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Notes')
@ApiBearerAuth()
@Controller('notes')
@Public()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get(':customerId')
  @ApiOperation({ summary: 'Get all notes for a customer' })
  @ApiParam({ name: 'customerId', description: 'The customer ID' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getNotesByCustomerId(@Param('customerId') customerId: string) {
    return this.notesService.getNotesByCustomerId(customerId);
  }

  @Post(':customerId')
  @ApiOperation({ summary: 'Create a note for a customer' })
  @ApiParam({ name: 'customerId', description: 'The customer ID' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createNote(
    @Param('customerId') customerId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.createNote(customerId, createNoteDto);
  }
}
