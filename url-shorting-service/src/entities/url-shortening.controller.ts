import { Controller, Post, Body, Get, Param, Res, NotFoundException, Req } from '@nestjs/common';
import { UrlShorteningService } from './url-shortening.service';
import { Response, Request } from 'express';

@Controller()
export class UrlShorteningController {
  constructor(private readonly urlShorteningService: UrlShorteningService) {}

  @Post('shorten')
  async shortenUrl(@Body() body: { longUrl: string; alias?: string }) {
    const shortCode = await this.urlShorteningService.shortenUrl(body.longUrl, body.alias);
    const shortUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/${shortCode}`;
    return { shortUrl };
  }

  @Get(':shortcode')
  async redirectToLongUrl(@Param('shortcode') shortCode: string, @Res() res: Response, @Req() req: Request) {
    try {
      const urlMapping = await this.urlShorteningService.getLongUrl(shortCode);
      
      // Asynchronously track analytics
      this.urlShorteningService.trackAnalytics(urlMapping, req.ip, req.headers['user-agent']);

      res.redirect(302, urlMapping.longUrl);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).send('URL not found.');
      } else {
        res.status(500).send('An error occurred.');
      }
    }
  }

  @Get('analytics/:shortcode')
  async getAnalytics(@Param('shortcode') shortCode: string) {
    return this.urlShorteningService.getAnalytics(shortCode);
  }
}