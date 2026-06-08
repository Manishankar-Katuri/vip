import { Test, TestingModule } from '@nestjs/testing';
import { HospitalRequestController } from './hospital-request.controller';
import { HospitalRequestService } from './hospital-request.service';

describe('HospitalRequestController', () => {
  let controller: HospitalRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HospitalRequestController],
      providers: [
        {
          provide: HospitalRequestService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            updateStatus: jest.fn()
          }
        }
      ],
    }).compile();

    controller = module.get<HospitalRequestController>(HospitalRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
