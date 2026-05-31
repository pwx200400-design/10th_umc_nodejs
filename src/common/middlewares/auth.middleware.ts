import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app.error.js';

export const isLogin = (req: Request, res: Response, next: NextFunction) => {
    // 1. Passport 인증 수행
    passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
        // 2. 에러가 발생하거나 사용자가 없으면 401 에러 반환
        if (err || !user) {
            return next(new AppError({
                errorCode: "UNAUTHORIZED",
                message: "로그인이 필요한 서비스입니다.",
                statusCode: 401
            }));
        }

        // 3. 인증 성공 시 req.user에 사용자 정보 주입
        req.user = user;
        next(); // 다음 단계로 이동
    })(req, res, next);
};
