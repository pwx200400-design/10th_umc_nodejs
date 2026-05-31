
import { Response ,Request } from 'express';

declare global {
  namespace Express {
    interface Response {
      
      success: (data: any, message?: string) => void;
      
      
      error: (message: string, statusCode?: number) => void;
    }
    interface Request {
  user?: User; // 필요에 따라 'any' 대신 Prisma의 'User' 타입으로 변경
    }
  }
}