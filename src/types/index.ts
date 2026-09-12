import { Request } from 'express';
import { Decimal } from '@prisma/client/runtime/library';

export interface AuthUser {
  id: number;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface OrderResponseItem {
  id: number;
  totalAmount: Decimal | string;
  status: string;
  createdAt: Date;
  user: {
    name: string;
  };
}

export interface PaginationMeta {
  limit: number;
  page: number;
  count: number;
}

export interface OrdersApiResponse {
  data: OrderResponseItem[];
  meta: PaginationMeta;
}
