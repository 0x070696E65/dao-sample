import { Controller, Get, Render, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import type { SignedAndCosig } from '../shared/types';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get()
  @Render('index')
  home() {
    return {};
  }

  @Post('/api/cosignWithAdmin')
  public async cosignWithAdmin(@Body() signedAndCosig: SignedAndCosig) {
    try {
      const result = await this.appService.cosignWithAdmin(
        signedAndCosig.signedTransaction,
        signedAndCosig.aggregateTransactionCosignatures,
      );
      return result;
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
