import { Test, TestingModule } from '@nestjs/testing';
import { HospitalRequestService } from './hospital-request.service';
import { PrismaService } from '../prisma.service';

describe('HospitalRequestService', () => {
  let service: HospitalRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospitalRequestService,
        {
          provide: PrismaService,
          useValue: {
            hospitalRequest: {
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn()
            },
            hospitalWorkspace: {
              findUnique: jest.fn(),
              create: jest.fn()
            }
          }
        }
      ],
    }).compile();

    service = module.get<HospitalRequestService>(HospitalRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
