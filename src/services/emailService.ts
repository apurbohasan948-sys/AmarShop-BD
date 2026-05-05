/**
 * Mock Email Service Placeholder
 * In a production environment, this would integrate with a service like 
 * SendGrid, Mailgun, or Firebase Cloud Functions with a Transporter.
 */
import { Order } from '../types';

export const sendOrderConfirmationEmail = async (order: Order, userEmail: string) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const emailBody = `
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    EMAARSHOP BD - ORDER CONFIRMATION
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    To: ${userEmail}
    Subject: Order #${order.id?.slice(-8).toUpperCase() || 'NEW'} Confirmed!
    
    Hi ${order.customerName},
    
    Thank you for shopping with AmarShop BD. Your order has 
    been received and is currently pending payment verification.
    
    ORDER SUMMARY:
    Ref: #${order.id?.slice(-8).toUpperCase()}
    Payment Method: ${order.paymentMethod}
    Trx ID: ${order.transactionId}
    
    ITEMS:
    ${order.items.map(item => `- ${item.name} (Qty: ${item.quantity}) - ৳${(item.price * item.quantity).toLocaleString()}`).join('\n    ')}
    
    SHIPPING TO:
    ${order.customerPhone}
    ${order.address.street}
    ${order.address.upazila}, ${order.address.district}
    Bangladesh
    
    TOTAL PAYABLE: ৳${order.total.toLocaleString()}
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Your order will be processed once our team verifies 
    the delivery charge payment.
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;

  console.log("%c[MOCK EMAIL SENT]", "color: #ea580c; font-weight: bold; background: #fff7ed; padding: 4px 8px; border-radius: 4px;", emailBody);
  
  return true;
};
