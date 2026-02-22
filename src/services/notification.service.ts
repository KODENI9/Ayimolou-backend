import * as admin from 'firebase-admin';

export class NotificationService {
  /**
   * Envoie une notification push à un utilisateur spécifique.
   * @param userId L'identifiant de l'utilisateur (Clerk ID)
   * @param title Titre de la notification
   * @param body Corps du message
   * @param data Données supplémentaires (facultatif)
   */
  static async sendNotificationToUser(userId: string, title: string, body: string, data?: any) {
    try {
      // Pour l'instant, on récupère le jeton FCM depuis la collection 'users' dans Firestore
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        console.warn(`Aucun jeton FCM trouvé pour l'utilisateur ${userId}`);
        return;
      }

      const message = {
        notification: { title, body },
        data: data || {},
        token: fcmToken,
      };

      const response = await admin.messaging().send(message);
      console.log('Notification envoyée avec succès:', response);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  }

  /**
   * Alerte une revendeuse d'une nouvelle commande.
   */
  static async notifyNewOrder(vendorId: string, orderId: string) {
    return this.sendNotificationToUser(
      vendorId,
      'Nouvelle commande ! 🍛',
      'Vous avez reçu une nouvelle commande sur Ayimolou Express.',
      { orderId, type: 'NEW_ORDER' }
    );
  }

  /**
   * Informe un client du changement de statut de sa commande.
   */
  static async notifyStatusUpdate(clientId: string, orderId: string, status: string) {
    const statusMessages: Record<string, string> = {
      'ACCEPTED': 'Votre commande a été acceptée ! ✅',
      'PREPARING': 'Votre repas est en préparation... 👨‍🍳',
      'READY': 'Votre commande est prête ! 🍛',
      'DELIVERING': 'Votre repas est en cours de livraison ! 🛵',
      'COMPLETED': 'Commande livrée. Bon appétit ! 🎉',
      'CANCELLED': 'Désolé, votre commande a été annulée. ❌'
    };

    const message = statusMessages[status] || `Le statut de votre commande est maintenant : ${status}`;

    return this.sendNotificationToUser(
      clientId,
      'Suivi de commande 🍛',
      message,
      { orderId, type: 'STATUS_UPDATE', status }
    );
  }

  /**
   * Informe le client que le livreur est à moins de 500m.
   */
  static async notifyNearby(clientId: string, orderId: string) {
    return this.sendNotificationToUser(
      clientId,
      'Livreur arrive ! 🛵',
      'Votre livreur est à moins de 500m de votre adresse. Préparez-vous !',
      { orderId, type: 'NEARBY' }
    );
  }
}
