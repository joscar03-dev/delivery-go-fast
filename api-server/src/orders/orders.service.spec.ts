import { OrdersService } from './orders.service';
import { OrderStatus } from '../common/enums/order-status.enum';
import { Role } from '../common/enums/role.enum';

const ORDER_ID = '11111111-2222-3333-4444-555555555555';
const OWNER_ID = 'owner-1';
const RESTAURANT_ID = 'restaurant-1';

type Emitted = {
  event: string;
  room: string;
  payload: Record<string, unknown>;
};

function buildOrder() {
  return {
    id: ORDER_ID,
    total: 100,
    deliveryAddress: 'Calle Privada 999',
    status: OrderStatus.PENDING,
    client: { id: 'client-1', name: 'Ana' },
    restaurant: {
      id: RESTAURANT_ID,
      name: 'Pizzería',
      owner: { id: OWNER_ID },
    },
    driver: null,
  };
}

function buildService(order: unknown) {
  const emissions: Emitted[] = [];
  const to = jest.fn((room: string) => ({
    emit: jest.fn((event: string, payload: Record<string, unknown>) => {
      emissions.push({ event, room, payload });
    }),
  }));
  const server = { to, emit: jest.fn() };

  const orderRepository = { findOne: jest.fn().mockResolvedValue(order) };

  const service = new OrdersService(
    orderRepository as never,
    {} as never, // orderItemRepository
    {} as never, // reviewRepository
    {} as never, // menuItemRepository
    {} as never, // restaurantRepository
    {} as never, // menuOptionRepository
    {} as never, // addressRepository
    {} as never, // userRepository
    {} as never, // dataSource
    { server } as never, // deliveryGateway
    {} as never, // geolocationService
    {} as never, // notificationsService
    {} as never, // paymentsService
    { emit: jest.fn() } as never, // eventEmitter
  );

  return { service, server, emissions, orderRepository };
}

function roomsOf(emissions: Emitted[], event: string): string[] {
  return emissions.filter((e) => e.event === event).map((e) => e.room);
}

describe('OrdersService difusión de eventos por sala', () => {
  describe('emitOrderStatusUpdate', () => {
    it('no emite a todo el servidor, solo a salas del pedido', async () => {
      const { service, server, emissions } = buildService(buildOrder());

      await (
        service as unknown as {
          emitOrderStatusUpdate: (
            id: string,
            status: OrderStatus,
            previous?: OrderStatus,
          ) => Promise<void>;
        }
      ).emitOrderStatusUpdate(ORDER_ID, OrderStatus.PREPARING);

      expect(server.emit).not.toHaveBeenCalled();
      expect(roomsOf(emissions, 'order-status-updated')).toEqual([
        `order_${ORDER_ID}`,
        `role_${Role.SUPER_ADMIN}`,
        `restaurant_${OWNER_ID}`,
      ]);
    });

    it('no emite nada si el pedido ya no existe', async () => {
      const { service, server, emissions } = buildService(null);

      await (
        service as unknown as {
          emitOrderStatusUpdate: (
            id: string,
            status: OrderStatus,
          ) => Promise<void>;
        }
      ).emitOrderStatusUpdate(ORDER_ID, OrderStatus.PREPARING);

      expect(server.emit).not.toHaveBeenCalled();
      expect(emissions).toHaveLength(0);
    });
  });

  describe('emitNewOrderEvent', () => {
    it('nunca emite a todo el servidor: la dirección se filtra a todos', async () => {
      const { service, server, emissions } = buildService(buildOrder());

      await (
        service as unknown as {
          emitNewOrderEvent: (o: unknown) => Promise<void>;
        }
      ).emitNewOrderEvent(buildOrder());

      expect(server.emit).not.toHaveBeenCalled();
      expect(roomsOf(emissions, 'new-order-available')).toEqual([
        'available_drivers',
        `restaurant_${OWNER_ID}`,
      ]);
    });

    it('omite la sala del restaurante si el pedido no tiene dueño', async () => {
      const orphan = {
        ...buildOrder(),
        restaurant: { id: RESTAURANT_ID, name: 'Pizzería', owner: null },
      };
      const { service, emissions } = buildService(orphan);

      await (
        service as unknown as {
          emitNewOrderEvent: (o: unknown) => Promise<void>;
        }
      ).emitNewOrderEvent(orphan);

      expect(roomsOf(emissions, 'new-order-available')).toEqual([
        'available_drivers',
      ]);
    });
  });
});
