import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

describe('ReviewController', () => {
  let controller: ReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [
        {
          provide: ReviewService,
          useValue: {
            ingestReviews: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            findAlerts: jest.fn(),
            findAlertDetails: jest.fn(),
            resolveAlert: jest.fn(),
            dashboard: jest.fn()
          }
        }
      ],
    }).compile();

    controller = module.get<ReviewController>(ReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
