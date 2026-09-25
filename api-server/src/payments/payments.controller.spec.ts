import { PaymentsService, PaymentActor } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Role } from '../common/enums/role.enum';

const ORDER_ID = 'order-1';
const OWNER: PaymentActor = { id: 'owner-1', role: Role.RESTAURANT_OWNER };

function buildPaymentWithRelations() {
  return {
    id: 'payment-1',
    orderId: ORDER_ID,
    paymentMethodCode: 'yape',
    paymentStatus: 'pending',
    amount: 100,
    subtotal: 80,
    deliveryFee: 20,
    transactionReference: 'OPE-9912',
    paymentProofUrl: 'https://cdn.example.com/proof.png',
    order: { id: ORDER_ID, deliveryAddress: 'Calle Secreta 123' },
    verifier: {
      id: 'admin-1',
      email: 'admin@ejemplo.com',
      password_hash: 'bcrypt-hash',
    },
  };
}

function buildController() {
  const service = {
    getOrderPayment: jest.fn().mockResolvedValue(buildPaymentWithRelations()),
    verifyPayment: jest.fn().mockResolvedValue(buildPaymentWithRelations()),
  };
  const controller = new PaymentsController(
    service as unknown as PaymentsService,
  );
  const req = { user: { sub: OWNER.id, role: OWNER.role } };
  return { controller, service, req };
}

describe('PaymentsController respuestas de pago', () => {
  describe('getOrderPayment', () => {
    it('no filtra password_hash ni la direccion del cliente', async () => {
      const { controller, req } = buildController();

      const result = await controller.getOrderPayment(ORDER_ID, req);
      const serialized = JSON.stringify(result);

      expect(serialized).not.toContain('bcrypt-hash');
      expect(serialized).not.toContain('Calle Secreta 123');
      expect(serialized).not.toContain('admin@ejemplo.com');
    });

    it('no expone las relaciones order ni verifier', async () => {
      const { controller, req } = buildController();

      const result = await controller.getOrderPayment(ORDER_ID, req);

      expect(result).not.toHaveProperty('order');
      expect(result).not.toHaveProperty('verifier');
    });

    it('mantiene los datos que el dueño necesita para verificar', async () => {
      const { controller, req } = buildController();

      const result = await controller.getOrderPayment(ORDER_ID, req);

      expect(result).toMatchObject({
        orderId: ORDER_ID,
        transactionReference: 'OPE-9912',
        paymentProofUrl: 'https://cdn.example.com/proof.png',
        amount: 100,
        paymentStatus: 'pending',
      });
    });
  });

  describe('verifyPayment', () => {
    it('tambien filtra las relaciones en la respuesta', async () => {
      const { controller, req } = buildController();

      const result = await controller.verifyPayment(
        { orderId: ORDER_ID, status: 'verified' },
        req,
      );
      const serialized = JSON.stringify(result);

      expect(serialized).not.toContain('bcrypt-hash');
      expect(result).not.toHaveProperty('verifier');
      expect(result).not.toHaveProperty('order');
    });
  });
});
