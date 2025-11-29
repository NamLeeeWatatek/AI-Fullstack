import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NodeTypesService } from './node-types.service';
import { NodeType, NodeCategory } from './domain/node-type';

@ApiTags('Node Types')
@Controller({ path: 'node-types', version: '1' })
export class NodeTypesController {
  constructor(private readonly nodeTypesService: NodeTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all node types' })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Query('category') category?: string): NodeType[] {
    return this.nodeTypesService.findAll(category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all node categories' })
  getCategories(): NodeCategory[] {
    return this.nodeTypesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get node type by ID' })
  findOne(@Param('id') id: string): NodeType | undefined {
    return this.nodeTypesService.findOne(id);
  }
}
