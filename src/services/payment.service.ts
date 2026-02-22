import { db } from '../config/firebase';

export class PaymentService {
  /**
   * Simule la vérification d'une transaction Mobile Money.
   * Dans un cas réel, ceci appellerait l'API d'un agrégateur (Cinétpay, Fedapay, etc.)
   */
  static async verifyMobileMoneyPayment(orderId: string, phoneNumber: string): Promise<boolean> {
    console.log(`[SIMULATION] Vérification du paiement MM pour la commande ${orderId} au numéro ${phoneNumber}...`);
    
    // On simule un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulation : On accepte toujours le paiement pour le moment
    return true;
  }
}
