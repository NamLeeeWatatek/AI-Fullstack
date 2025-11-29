import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlowEntity } from './infrastructure/persistence/relational/entities/flow.entity';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';

@Injectable()
export class FlowsService {
  constructor(
    @InjectRepository(FlowEntity)
    private flowRepository: Repository<FlowEntity>,
  ) {}

  async create(createDto: CreateFlowDto, ownerId: number) {
    const flow = this.flowRepository.create({
      ...createDto,
      ownerId,
      data: createDto.data || {},
    });
    return this.flowRepository.save(flow);
  }

  async findAll(ownerId?: number) {
    const query = this.flowRepository.createQueryBuilder('flow');
    
    if (ownerId) {
      query.where('flow.ownerId = :ownerId', { ownerId });
    }
    
    return query.getMany();
  }

  async findOne(id: number) {
    const flow = await this.flowRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return flow;
  }

  async update(id: number, updateDto: UpdateFlowDto) {
    const flow = await this.findOne(id);
    Object.assign(flow, updateDto);
    return this.flowRepository.save(flow);
  }

  async remove(id: number) {
    const flow = await this.findOne(id);
    await this.flowRepository.remove(flow);
  }
}
