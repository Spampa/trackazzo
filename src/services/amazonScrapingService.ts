import { chromium, Browser, Page } from 'playwright';

export interface ProductInfo {
  title: string;
  currentPrice: number | null;
  originalPrice: number | null;
  currency: string;
  availability?: string;
}

export class AmazonScrapingService {
  private browser: Browser | null = null;

  /**
   * Inizializza il browser
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Chiude il browser
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Determina la regione Amazon dal locale della chat
   */
  private getAmazonDomain(chatId: number): string {
    // Per ora usiamo solo amazon.it come default
    // In futuro si può mappare il chatId alla regione dell'utente
    return 'amazon.it';
  }

  /**
   * Normalizza l'URL Amazon per la regione specifica
   */
  private normalizeAmazonUrl(originalUrl: string, domain: string): string {
    try {
      const url = new URL(originalUrl);
      
      // Estrai l'ASIN
      const asinMatch = url.pathname.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
      
      if (asinMatch) {
        const asin = asinMatch[1] || asinMatch[2];
        return `https://${domain}/dp/${asin}`;
      }
      
      // Se non trova l'ASIN, sostituisci solo il dominio
      return originalUrl.replace(url.hostname, domain);
    } catch (error) {
      return originalUrl;
    }
  }

  /**
   * Normalizza il titolo del prodotto
   */
  private normalizeTitle(title: string): string {
    if (!title) return 'Prodotto Amazon';
    
    // Prendi tutto fino alla prima virgola
    const commaIndex = title.indexOf(',');
    const normalizedTitle = commaIndex !== -1 ? title.substring(0, commaIndex).trim() : title.trim();
    
    // Limita la lunghezza
    return normalizedTitle.length > 100 ? normalizedTitle.substring(0, 100) + '...' : normalizedTitle;
  }

  /**
   * Estrae il prezzo dai selettori
   */
  private async extractPrice(page: Page, wholeSelector: string, decimalSelector: string): Promise<{ price: number; currency: string } | null> {
    try {
      const wholeElement = await page.$(wholeSelector);
      const decimalElement = await page.$(decimalSelector);
      
      if (!wholeElement) return null;
      
      const wholeText = await wholeElement.textContent() || '';
      const decimalText = decimalElement ? await decimalElement.textContent() || '00' : '00';
      
      // Pulisci i testi
      const wholePart = wholeText.replace(/[^0-9]/g, '');
      const decimalPart = decimalText.replace(/[^0-9]/g, '').padEnd(2, '0').substring(0, 2);
      
      if (!wholePart) return null;
      
      const price = parseFloat(`${wholePart}.${decimalPart}`);
      
      if (isNaN(price)) return null;
      
      // Determina la valuta dal contesto della pagina
      const pageText = await page.textContent('body') || '';
      let currency = 'EUR';
      if (pageText.includes('$')) currency = 'USD';
      else if (pageText.includes('£')) currency = 'GBP';
      
      return { price, currency };
    } catch (error) {
      return null;
    }
  }

  /**
   * Scraping delle informazioni del prodotto Amazon con Playwright
   */
  async scrapeProduct(url: string, chatId?: number): Promise<ProductInfo | null> {
    let page: Page | null = null;
    
    try {
      // Espandi link corti se necessario
      const expandedUrl = await this.expandShortUrl(url);
      
      // Determina il dominio Amazon dalla regione
      const domain = this.getAmazonDomain(chatId || 0);
      const normalizedUrl = this.normalizeAmazonUrl(expandedUrl, domain);

      const browser = await this.initBrowser();
      page = await browser.newPage();

      // Configura user agent
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });

      // Naviga alla pagina
      await page.goto(normalizedUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Aspetta che il contenuto principale si carichi
      await page.waitForTimeout(2000);

      // Estrazione del titolo dal selettore ID "productTitle"
      let title = 'Prodotto Amazon';
      try {
        const titleElement = await page.$('#productTitle');
        if (titleElement) {
          const titleText = await titleElement.textContent();
          if (titleText) {
            title = this.normalizeTitle(titleText);
          }
        }
      } catch (error) {
        // Solo log se necessario per debug
      }

      // Estrazione del prezzo attuale
      let currentPrice: number | null = null;
      let currency = 'EUR';
      
      try {
        const priceInfo = await this.extractPrice(page, '.a-price-whole', '.a-price-fraction');
        if (priceInfo) {
          currentPrice = priceInfo.price;
          currency = priceInfo.currency;
        }
      } catch (error) {
        // Solo log se necessario per debug
      }

      // Estrazione del prezzo originale
      let originalPrice: number | null = null;
      
      try {
        const originalPriceElement = await page.$('.a-price.a-text-price .a-offscreen');
        if (originalPriceElement) {
          const originalPriceText = await originalPriceElement.textContent();
          if (originalPriceText) {
            const priceMatch = originalPriceText.match(/([0-9]+[.,][0-9]{2})/);
            if (priceMatch && priceMatch[1]) {
              const price = parseFloat(priceMatch[1].replace(',', '.'));
              if (!isNaN(price) && price > (currentPrice || 0)) {
                originalPrice = price;
              }
            }
          }
        }
      } catch (error) {
        // Solo log se necessario per debug  
      }

      // Verifica disponibilità
      let availability = 'Disponibile';
      try {
        const pageContent = await page.textContent('body') || '';
        if (pageContent.includes('Non disponibile') || pageContent.includes('Temporarily out of stock')) {
          availability = 'Non disponibile';
        } else if (pageContent.includes('Solo') && pageContent.includes('rimast')) {
          availability = 'Disponibilità limitata';
        }
      } catch (error) {
        // Solo log se necessario per debug
      }

      const productInfo: ProductInfo = {
        title,
        currentPrice,
        originalPrice,
        currency,
        availability
      };

      return productInfo;

    } catch (error) {
      console.error('Errore nello scraping Amazon con Playwright:', error);
      return null;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Verifica se un URL è valido per lo scraping
   */
  isValidAmazonUrl(url: string): boolean {
    const amazonDomains = [
      'amazon.it', 'amazon.com', 'amazon.co.uk', 'amazon.de', 
      'amazon.fr', 'amazon.es', 'amazon.ca', 'amazon.com.au',
      'amzn.to', 'amzn.eu', 'a.co'
    ];
    
    return amazonDomains.some(domain => url.includes(domain));
  }

  /**
   * Espande link corti Amazon e estrae ASIN
   */
  async expandShortUrl(url: string): Promise<string> {
    // Se è già un link lungo, ritornalo
    if (url.includes('/dp/') || url.includes('/gp/product/')) {
      return url;
    }

    // Se è un link corto, prova a espanderlo
    if (url.includes('amzn.') || url.includes('a.co') || url.includes('/d/')) {
      try {
        const browser = await this.initBrowser();
        const page = await browser.newPage();
        
        // Naviga al link corto
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });
        
        // Ottieni l'URL finale dopo i redirect
        const finalUrl = page.url();
        await page.close();
        
        return finalUrl;
      } catch (error) {
        return url; // Ritorna l'originale se fallisce
      }
    }

    return url;
  }

  /**
   * Ottiene informazioni rapide per la preview
   */
  async getQuickProductInfo(url: string): Promise<{ title: string; domain: string }> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Estrai ASIN per un titolo più pulito
      const asinMatch = urlObj.pathname.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
      const asin = asinMatch ? (asinMatch[1] || asinMatch[2]) : 'Prodotto';
      
      return {
        title: `Prodotto Amazon ${asin}`,
        domain: domain
      };
    } catch (error) {
      return {
        title: 'Prodotto Amazon',
        domain: 'amazon.it'
      };
    }
  }

  /**
   * Cleanup delle risorse
   */
  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }

  /**
   * Estrae l'ASIN da un URL Amazon (gestisce anche link corti)
   */
  async extractAsinFromUrl(url: string): Promise<string | null> {
    try {
      // Prima espandi il link se è corto
      const expandedUrl = await this.expandShortUrl(url);
      
      // Poi estrai l'ASIN
      return this.extractAsin(expandedUrl);
    } catch (error) {
      return null;
    }
  }

  /**
   * Estrae l'ASIN da un URL Amazon (solo per URL già espansi)
   */
  extractAsin(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const asinMatch = urlObj.pathname.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
      if (asinMatch) {
        return asinMatch[1] || asinMatch[2] || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
