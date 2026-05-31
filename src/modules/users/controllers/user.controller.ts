import {
  Body,
  Controller,
  Post,
  Request,
  Response,
  Route,
  Tags,
  Patch,
  Get
} from "tsoa";
import { StatusCodes } from "http-status-codes";
import { UserSignUpRequest, UserSignUpResponse, UpdateUserDto  } from "../dtos/user.dto.js";
import { userSignUp,updateUserInfo } from "../services/user.service.js";
import { isLogin } from "../../../common/middlewares/auth.middleware.js";
import { Request as ExpressRequest } from "express";
import { ApiResponse, success, ApiFailResponse } from "../../../common/responses/response.js";
import { AppError} from "../../../common/errors/app.error.js";
import { User } from "../../../generated/prisma/client.js";

@Route("users") 
@Tags("Users")  


export class UserController extends Controller {

  /**
     * 회원가입 API
     * @summary 회원가입을 처리하는 엔드포인트입니다.
     */
    
    @Post("signup")
    @Response<ApiResponse<UserSignUpResponse>>(200, "회원가입 성공")
    @Response<ApiFailResponse>(400, "중복된 이메일 에러", {
        resultType: "FAIL",
        error: {
        errorCode: "400",
        reason: "이메일이 중복되었습니다.",
            },
            data: null,
        }) 
    public async handleUserSignUp(
        @Body() requestBody: UserSignUpRequest
    ): Promise<ApiResponse<UserSignUpResponse>> {
        console.log("회원가입을 요청했습니다!");
        console.log("body:", requestBody);

        if (!requestBody.email || !requestBody.name || !requestBody.phoneNumber) {
        throw new AppError({
        errorCode: "INVALID_REQUEST",
        message: "유효하지 않은 요청값입니다.",
        statusCode: 404
    });
  }
       
        const user = await userSignUp(requestBody);

     
        return success(user);
           
        
    }
    /**
     * @summary 사용자 프로필 정보 수정
     * @description 로그인한 사용자의 정보를 받아 데이터베이스에 반영합니다.
     */
    @Patch("profile") 
    @Response<ApiResponse<User>>(200, "사용자 정보 수정 성공") 
    public async handleUpdateProfile(
        @Request() request: ExpressRequest, 
        @Body() updateData: UpdateUserDto 
    ): Promise<ApiResponse<User>> {
        
      
        const user = request.user as User;

        const updatedUser = await updateUserInfo(user.id, updateData);
        
        
        return { 
        resultType: "SUCCESS", 
        error: null,           
        data: updatedUser      
        };
    }
}

    

  



