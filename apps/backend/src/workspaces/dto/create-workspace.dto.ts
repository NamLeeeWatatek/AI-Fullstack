import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Workspace' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'my-workspace' })
  @IsNotEmpty()
  @IsString()
  slug: string;
}
