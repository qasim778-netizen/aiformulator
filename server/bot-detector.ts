import type { Request } from 'express';

const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /slurp/i,
  /bingbot/i,
  /googlebot/i,
  /yandex/i,
  /baidu/i,
  /duckduck/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i,
  /slackbot/i,
  /semrush/i,
  /ahrefs/i,
  /moz/i,
  /screaming frog/i,
  /lighthouse/i,
  /pagespeed/i,
  /gtmetrix/i,
  /pingdom/i,
  /uptime/i,
  /monitoring/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /axios/i,
  /node-fetch/i,
  /java/i,
  /apache-httpclient/i,
  /go-http-client/i,
  /ruby/i,
  /perl/i,
  /php/i,
  /libwww/i,
];

export function isBot(req: Request): boolean {
  const userAgent = req.get('user-agent') || '';
  
  if (!userAgent || userAgent.length < 10) {
    return true;
  }
  
  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return true;
    }
  }
  
  return false;
}

export function isBrowser(req: Request): boolean {
  const userAgent = req.get('user-agent') || '';
  
  const browserPatterns = [
    /Mozilla.*AppleWebKit.*Chrome/i,
    /Mozilla.*AppleWebKit.*Safari/i,
    /Mozilla.*Gecko.*Firefox/i,
    /Mozilla.*Trident.*MSIE/i,
    /Mozilla.*Edge/i,
  ];
  
  return browserPatterns.some(pattern => pattern.test(userAgent));
}
