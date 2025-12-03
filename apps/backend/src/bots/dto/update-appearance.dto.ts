import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean, Matches } from 'class-validator';

export class UpdateAppearanceDto {
    @ApiPropertyOptional({
        example: '#667eea',
        description: 'Primary color for button and user messages',
    })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-F]{6}$/i, {
        message: 'Invalid color format. Use hex format like #667eea',
    })
    primaryColor?: string;

    @ApiPropertyOptional({
        example: '#ffffff',
        description: 'Background color for chat window',
    })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-F]{6}$/i, {
        message: 'Invalid color format. Use hex format like #ffffff',
    })
    backgroundColor?: string;

    @ApiPropertyOptional({
        example: '#f9fafb',
        description: 'Background color for bot messages',
    })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-F]{6}$/i, {
        message: 'Invalid color format. Use hex format like #f9fafb',
    })
    botMessageColor?: string;

    @ApiPropertyOptional({
        example: '#1f2937',
        description: 'Text color for bot messages',
    })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-F]{6}$/i, {
        message: 'Invalid color format. Use hex format like #1f2937',
    })
    botMessageTextColor?: string;

    @ApiPropertyOptional({
        example: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
        description: 'Font family for chat text',
    })
    @IsOptional()
    @IsString()
    fontFamily?: string;

    @ApiPropertyOptional({
        enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
        example: 'bottom-right',
    })
    @IsOptional()
    @IsEnum(['bottom-right', 'bottom-left', 'top-right', 'top-left'])
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

    @ApiPropertyOptional({
        enum: ['small', 'medium', 'large'],
        example: 'medium',
    })
    @IsOptional()
    @IsEnum(['small', 'medium', 'large'])
    buttonSize?: 'small' | 'medium' | 'large';

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    showAvatar?: boolean;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    showTimestamp?: boolean;

    @ApiPropertyOptional({ example: 'Xin chào! Tôi có thể giúp gì cho bạn?' })
    @IsOptional()
    @IsString()
    welcomeMessage?: string;

    @ApiPropertyOptional({ example: 'Nhập tin nhắn...' })
    @IsOptional()
    @IsString()
    placeholderText?: string;
}

export class AppearanceResponseDto {
    @ApiPropertyOptional({ example: '#667eea' })
    primaryColor: string;

    @ApiPropertyOptional({ example: '#ffffff' })
    backgroundColor: string;

    @ApiPropertyOptional({ example: '#f9fafb' })
    botMessageColor: string;

    @ApiPropertyOptional({ example: '#1f2937' })
    botMessageTextColor: string;

    @ApiPropertyOptional({ example: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto' })
    fontFamily: string;

    @ApiPropertyOptional({ example: 'bottom-right' })
    position: string;

    @ApiPropertyOptional({ example: 'medium' })
    buttonSize: string;

    @ApiPropertyOptional({ example: true })
    showAvatar: boolean;

    @ApiPropertyOptional({ example: true })
    showTimestamp: boolean;

    @ApiPropertyOptional({ example: 'Xin chào! Tôi có thể giúp gì cho bạn?' })
    welcomeMessage: string;

    @ApiPropertyOptional({ example: 'Nhập tin nhắn...' })
    placeholderText: string;
}
