import {
  Controller,
  Get,
  Render,
  Post,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ParamsInterceptor } from './params.interceptor';
import type { AggregateBonded, QuestData } from '../shared/types';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  @UseInterceptors(ParamsInterceptor)
  home() {
    return {};
  }

  @Get('/sign-up')
  @Render('signUp')
  signUpPage() {
    return {};
  }

  @Get('/sign-in')
  @Render('signIn')
  signIn() {
    return {};
  }

  @Post('/api/signUp')
  public async signUp(@Body() aggregateBonded: AggregateBonded) {
    try {
      const result = await this.appService.signUp(aggregateBonded);
      return result;
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  @Post('/api/createQuest')
  public async createQuest(@Body() questData: QuestData) {
    try {
      this.appService.createQuest(questData);
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  @Post('/api/overrideQuest')
  public async overrideQuest(@Body() questDatas: QuestData[]) {
    try {
      this.appService.overrideQuest(questDatas);
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  @Post('/api/verifyToken')
  public async verifyToken(@Body() arr: string[]) {
    try {
      const result = this.appService.verifyToken(arr);
      return result;
    } catch (e: any) {
      throw new Error(e.message);
    }
  }
}
