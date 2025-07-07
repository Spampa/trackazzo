import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupPriceDropTest() {
    console.log('🔧 Configurazione test calo prezzo reale...');
    
    try {
        // Trova un prodotto
        const product = await prisma.amazonProduct.findFirst();
        
        if (!product) {
            console.log('❌ Nessun prodotto trovato');
            return;
        }

        console.log(`📦 Prodotto: ${product.title}`);
        console.log(`💰 Prezzo attuale: ${product.currentPrice}`);

        // Aumenta temporaneamente il prezzo nel DB
        const artificialHighPrice = (product.currentPrice || 100) * 1.2; // +20%
        
        await prisma.amazonProduct.update({
            where: { id: product.id },
            data: { currentPrice: artificialHighPrice }
        });

        console.log(`📈 Prezzo temporaneo impostato a: ${artificialHighPrice}`);
        console.log(`\n🔍 Ora esegui il monitoraggio:`);
        console.log(`npm run test:monitoring`);
        console.log(`\n📉 Il sistema rileverà automaticamente il calo dal prezzo artificiale a quello reale!`);

    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupPriceDropTest();
