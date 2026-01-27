import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({
    description: 'The content of the note',
    example: 'Customer requested refund due to billing issue.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'The author of the note (optional)',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  author?: string;
}
