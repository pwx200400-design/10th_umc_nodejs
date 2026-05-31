import dotenv from "dotenv";
import express, { type Express, type Request, type Response, type NextFunction} from "express";
import cors from "cors";
import { RegisterRoutes } from "./generated/routes.js";
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler, } from "./common/middlewares/errorHandler.js";
import swaggerUi from "swagger-ui-express";
import path from "path";
import fs from "fs";
import passport from "passport";
import { googleStrategy,kakaoStrategy, jwtStrategy  } from "./auth.config.js";
import { prisma } from "./db.config.js";
import { User } from  "./generated/prisma/client.js";
import { isLogin } from './common/middlewares/auth.middleware.js';
import { MissionController } from "./modules/users/controllers/mission.controller.js";
import { ReviewController } from "./modules/users/controllers/review.controller.js";
import { UserController } from "./modules/users/controllers/user.controller.js";
dotenv.config();



const port = process.env.PORT || 3000;
passport.use(googleStrategy);
passport.use(kakaoStrategy);
passport.use(jwtStrategy); 
const app = express();
const swaggerPath = path.resolve(process.cwd(), "dist/swagger.json");
const swaggerFile = JSON.parse(fs.readFileSync(swaggerPath, "utf8"));
const missionController = new MissionController();
const reviewController = new ReviewController();
const userController = new UserController();
app.use(morgan("dev")); // 로그 포맷: dev
app.use(cookieParser());
app.use(cors()); 
app.use(express.static('public')); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 
app.use(passport.initialize());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get("/oauth2/login/google", passport.authenticate("google", { session: false }));
app.get("/oauth2/callback/google", 
  passport.authenticate("google", { session: false, failureRedirect: "/login-failed" }),
  (req, res) => {
    res.status(200).json({ success: true, tokens: req.user });
  }
);

app.get("/oauth2/login/kakao", passport.authenticate("kakao", { session: false }));
app.get(
  "/oauth2/callback/kakao",
  passport.authenticate("kakao", { session: false, failureRedirect: "/login-failed" }),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "카카오 로그인 성공!",
      tokens: req.user, 
    });
  }
);


app.get('/mypage', isLogin, (req: Request, res: Response) => {
  // Passport의 req.user를 Prisma의 User 타입으로 확실하게 변환(Casting)합니다.
  const user = req.user as User; 
  
  res.status(200).json({
    isSuccess: true,
    message: `인증 성공! ${user.name}님의 마이페이지입니다.`,
    result: { user }
  });
});

// 내 미션 목록 조회
app.get("/api/v1/missions/my-list", isLogin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 컨트롤러 호출 시 request를 그대로 넘깁니다.
        const result = await missionController.handleListMyMissions(req as any, req.query.status as string, Number(req.query.take), Number(req.query.cursor));
        res.success(result, "내 미션 목록 조회 성공");
    } catch (err) {
        next(err);
    }
});

// 미션 도전하기
app.post("/api/v1/missions/:missionId/challenge", isLogin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const missionId = Number(req.params.missionId);
        const result = await missionController.handleChallengeMission(missionId, req as any);
        res.success(result, "미션 도전 성공");
    } catch (err) {
        next(err);
    }
});

// 내가 작성한 리뷰 목록 조회
app.get("/api/v1/reviews/me", isLogin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const take = Number(req.query.take) || 10;
        const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
        
        // 미들웨어(isLogin)를 거쳤으므로 req는 ExpressRequest 타입으로 캐스팅 가능
        const result = await reviewController.handleListUserReviews(req as any, take, cursor);
        res.success(result, "내가 작성한 리뷰 목록 조회 성공");
    } catch (err) {
        next(err);
    }
});

// 나의 정보 수정하기
app.patch("/api/v1/users/profile", isLogin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 미들웨어를 거쳤으므로 req.user를 사용 가능
        const result = await userController.handleUpdateProfile(req as any, req.body);
        res.success(result, "사용자 정보 수정 성공");
    } catch (err) {
        next(err);
    }
});




app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
