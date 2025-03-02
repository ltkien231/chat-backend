import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const signature = req.headers['x-auth-signature'];
    const address = req.headers['x-auth-address'];
    if (!signature || !address) {
      throw new HttpException('Missing authorization header', HttpStatus.UNAUTHORIZED);
    }

    // if (!valid) {
    //   throw new HttpException('Invalid authentication credentials', HttpStatus.UNAUTHORIZED);
    // }

    next();
  }
}
