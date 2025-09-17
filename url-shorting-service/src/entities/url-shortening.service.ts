import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UrlMapping } from '../entities/url-mapping.entity';
import { Analytics } from '../entities/analytics.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { customAlphabet } from 'nanoid/async';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 7);
const CACHE_TTL = 3600; // 1 hour in seconds

@Injectable()
export class UrlShorteningService {
  constructor(
    @InjectRepository(UrlMapping)
    private readonly urlMappingRepository: Repository<UrlMapping>,
    @InjectRepository(Analytics)
    private readonly analyticsRepository: Repository<Analytics>,
    @InjectRedis() private readonly redisClient: Redis,
  ) {}

  async shortenUrl(longUrl: string, alias?: string): Promise<string> {
    let shortCode = alias;
    if (alias) {
      const existingMapping = await this.urlMappingRepository.findOne({ where: { shortCode: alias } });
      if (existingMapping) {
        throw new ConflictException('Alias already in use.');
      }
    } else {
      let isUnique = false;
      while (!isUnique) {
        shortCode = await nanoid();
        const existingMapping = await this.urlMappingRepository.findOne({ where: { shortCode } });
        isUnique = !existingMapping;
      }
    }

    const newMapping = this.urlMappingRepository.create({
      shortCode,
      longUrl,
    });
    await this.urlMappingRepository.save(newMapping);
    
    // Cache the new mapping
    await this.redisClient.setex(shortCode, CACHE_TTL, longUrl);

    return shortCode;
  }

  async getLongUrl(shortCode: string): Promise<UrlMapping> {
    // 1. Check Redis Cache
    const cachedLongUrl = await this.redisClient.get(shortCode);
    if (cachedLongUrl) {
      // Create a temporary object to avoid DB lookup
      return { shortCode, longUrl: cachedLongUrl } as UrlMapping;
    }

    // 2. Query Database
    const urlMapping = await this.urlMappingRepository.findOne({ where: { shortCode } });
    if (!urlMapping) {
      throw new NotFoundException('Short URL not found.');
    }

    // 3. Cache the result for future requests
    await this.redisClient.setex(shortCode, CACHE_TTL, urlMapping.longUrl);

    return urlMapping;
  }

  // Asynchronous analytics tracking to not block the redirect response
  async trackAnalytics(urlMapping: UrlMapping, ipAddress: string, userAgent: string): Promise<void> {
    try {
      const newAnalytics = this.analyticsRepository.create({
        ipAddress,
        userAgent,
        urlMapping,
      });
      await this.analyticsRepository.save(newAnalytics);

      // Increment click count on the url_mappings table
      await this.urlMappingRepository.increment({ id: urlMapping.id }, 'clickCount', 1);

    } catch (error) {
      console.error('Failed to track analytics:', error);
      // Log the error but do not throw, as this is a background task.
    }
  }

  async getAnalytics(shortCode: string): Promise<{ clicks: number; clickDetails: any[] }> {
    const urlMapping = await this.urlMappingRepository.findOne({
      where: { shortCode },
      relations: ['analytics'],
    });

    if (!urlMapping) {
      throw new NotFoundException('Short URL not found.');
    }

    const clickDetails = urlMapping.analytics.map(detail => ({
      ip: detail.ipAddress,
      timestamp: detail.timestamp,
    }));

    return {
      clicks: urlMapping.clickCount,
      clickDetails,
    };
  }
}