export const defaultPaymentMethods = [
  {
    code: 'cash',
    name: 'Efectivo',
    description: 'Pago en efectivo al recibir el pedido',
    is_active: true,
  },
  {
    code: 'yape',
    name: 'Yape',
    description: 'Transferencia mediante Yape',
    is_active: true,
  },
  {
    code: 'plin',
    name: 'Plin',
    description: 'Transferencia mediante Plin',
    is_active: true,
  },
  {
    code: 'card',
    name: 'Tarjeta',
    description: 'Pago con tarjeta de crédito/débito',
    is_active: false,
  },
];
