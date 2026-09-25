import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentsService, PaymentActor } from './payments.service';
import { Role } from '../common/enums/role.enum';

const OWNER_ID = 'owner-1';
const OTHER_OWNER_ID = 'owner-2';
const ORDER_ID = 'order-1';

function buildOrder(ownerId: string | null): unknown {
  return {
    id: ORDER_ID,
    clientId: 'client-1',
    restaurantId: 'restaurant-1',
    restaurant: ownerId ? { id: 'restaurant-1', owner: { id: ownerId } } : null,
  };
}

function buildPayment(): unknown {
  return {
    id: 'payment-1',
    orderId: ORDER_ID,
    paymentMethodCode: 'card',
    amount: 100,
    paymentStatus: 'pending',
  };
}

const ADMIN: PaymentActor = { id: 'admin-1', role: Role.SUPER_ADMIN };
const OWNER: PaymentActor = { id: OWNER_ID, role: Role.RESTAURANT_OWNER };
const OTHER_OWNER: PaymentActor = {
  id: OTHER_OWNER_ID,
  role: Role.RESTAURANT_OWNER,
};
const CLIENT: PaymentActor = { id: 'client-1', role: Role.CLIENT };
const DRIVER: PaymentActor = { id: 'driver-1', role: Role.DRIVER };

describe('PaymentsService autorización de pagos', () => {
  let paymentMethodRepo: { find: jest.Mock };
  let deliveryConfigRepo: { findOne: jest.Mock };
  let orderPaymentRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let orderRepo: { findOne: jest.Mock };
  let service: PaymentsService;

  beforeEach(() => {
    paymentMethodRepo = { find: jest.fn() };
    deliveryConfigRepo = { findOne: jest.fn() };
    orderPaymentRepo = {
      findOne: jest.fn().mockResolvedValue(buildPayment()),
      create: jest.fn(),
      save: jest.fn().mockImplementation(async (p) => p),
    };
    orderRepo = { findOne: jest.fn().mockResolvedValue(buildOrder(OWNER_ID)) };

    service = new PaymentsService(
      paymentMethodRepo as never,
      deliveryConfigRepo as never,
      orderPaymentRepo as never,
      orderRepo as never,
    );
  });

  describe('assertCanManageOrderPayment', () => {
    it('permite a un super admin sobre cualquier pedido', async () => {
      await expect(
        service.assertCanManageOrderPayment(ORDER_ID, ADMIN),
      ).resolves.toBeUndefined();
    });

    it('permite al dueño del restaurante del pedido', async () => {
      await expect(
        service.assertCanManageOrderPayment(ORDER_ID, OWNER),
      ).resolves.toBeUndefined();
    });

    it('rechaza a un cliente', async () => {
      await expect(
        service.assertCanManageOrderPayment(ORDER_ID, CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza a un repartidor', async () => {
      await expect(
        service.assertCanManageOrderPayment(ORDER_ID, DRIVER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza a un dueño de otro restaurante', async () => {
      await expect(
        service.assertCanManageOrderPayment(ORDER_ID, OTHER_OWNER),
      ).rejects.toThrow(NotFoundException);
    });

    it('no filtra la existencia del pedido a un actor no autorizado', async () => {
      await expect(
        service.assertCanManageOrderPayment(ORDER_ID, CLIENT),
      ).rejects.toThrow(ForbiddenException);

      expect(orderRepo.findOne).not.toHaveBeenCalled();
      expect(orderPaymentRepo.findOne).not.toHaveBeenCalled();
    });

    it('lanza NotFound si el pedido no existe', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assertCanManageOrderPayment('missing', ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFound si el pedido no tiene restaurante', async () => {
      orderRepo.findOne.mockResolvedValue(buildOrder(null));

      await expect(
        service.assertCanManageOrderPayment(ORDER_ID, OWNER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyPayment', () => {
    it('permite marcar como verified a un cliente sin rol de gestión', async () => {
      await expect(
        service.verifyPayment(ORDER_ID, 'verified', CLIENT),
      ).rejects.toThrow(ForbiddenException);

      expect(orderPaymentRepo.save).not.toHaveBeenCalled();
    });

    it('un cliente no puede marcar como failed el pago de otro', async () => {
      await expect(
        service.verifyPayment(ORDER_ID, 'failed', CLIENT, 'estafa'),
      ).rejects.toThrow(ForbiddenException);

      expect(orderPaymentRepo.save).not.toHaveBeenCalled();
      expect(orderPaymentRepo.findOne).not.toHaveBeenCalled();
    });

    it('un dueño no puede verificar el pago de otro restaurante', async () => {
      await expect(
        service.verifyPayment(ORDER_ID, 'verified', OTHER_OWNER),
      ).rejects.toThrow(NotFoundException);

      expect(orderPaymentRepo.save).not.toHaveBeenCalled();
    });

    it('permite al dueño del restaurante verificar su pedido', async () => {
      const result = await service.verifyPayment(ORDER_ID, 'verified', OWNER);

      expect(result.paymentStatus).toBe('verified');
      expect(orderPaymentRepo.save).toHaveBeenCalled();
    });

    it('toma verifiedBy del actor autenticado, no de la entrada', async () => {
      const result = await service.verifyPayment(ORDER_ID, 'verified', ADMIN);

      expect(result.verifiedBy).toBe('admin-1');
    });

    it('persiste las notas cuando se proporcionan', async () => {
      const result = await service.verifyPayment(
        ORDER_ID,
        'failed',
        ADMIN,
        'comprobante rechazado',
      );

      expect(result.notes).toBe('comprobante rechazado');
    });

    it('lanza NotFound si el pedido existe pero no tiene pago', async () => {
      orderPaymentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.verifyPayment(ORDER_ID, 'verified', ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOrderPayment', () => {
    it('rechaza a un cliente que pide el pago de otro pedido', async () => {
      await expect(service.getOrderPayment(ORDER_ID, CLIENT)).rejects.toThrow(
        ForbiddenException,
      );

      expect(orderPaymentRepo.findOne).not.toHaveBeenCalled();
    });

    it('rechaza a un dueño de otro restaurante', async () => {
      await expect(
        service.getOrderPayment(ORDER_ID, OTHER_OWNER),
      ).rejects.toThrow(NotFoundException);
    });

    it('devuelve el pago al super admin', async () => {
      await expect(
        service.getOrderPayment(ORDER_ID, ADMIN),
      ).resolves.toMatchObject({ orderId: ORDER_ID });
    });

    it('devuelve el pago al dueño del restaurante', async () => {
      await expect(
        service.getOrderPayment(ORDER_ID, OWNER),
      ).resolves.toMatchObject({ orderId: ORDER_ID });
    });
  });
});
