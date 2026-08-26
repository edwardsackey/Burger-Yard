import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import crypto from 'crypto';

export const initializePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, callbackUrl } = req.body;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      res.status(500).json({ message: 'Server configuration error: Paystack key missing in .env' });
      return;
    }

    // Call Paystack API to initialize the transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: order.user.email || 'customer@burgeryard.com',
        amount: Math.round(order.total_amount * 100), // Paystack requires amount in kobo/cents
        callback_url: callbackUrl,
        metadata: {
          order_id: order.id
        }
      })
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error('Paystack error:', data);
      res.status(400).json({ message: 'Failed to initialize payment with Paystack', error: data.message });
      return;
    }

    res.json({ 
      message: 'Payment initialized',
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Called by the app right after the user returns from the Paystack page.
 * The webhook is the real source of truth for production, but it needs a
 * publicly reachable URL — this lets the app get an immediate, real answer
 * (rather than assuming success) even when testing locally without one.
 */
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reference } = req.params;
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      res.status(500).json({ message: 'Server configuration error: Paystack key missing in .env' });
      return;
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = await response.json();

    if (!response.ok || !data.status) {
      res.status(400).json({ message: 'Could not verify transaction', error: data.message });
      return;
    }

    const paystackStatus: string = data.data.status; // 'success' | 'failed' | 'abandoned'
    const orderId = data.data.metadata?.order_id ? parseInt(data.data.metadata.order_id) : null;

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.userId !== req.user!.id) {
        res.status(403).json({ message: 'Unauthorized' });
        return;
      }
      if (paystackStatus === 'success' && order.status === 'PENDING') {
        await prisma.order.update({ where: { id: orderId }, data: { status: 'PREPARING' } });
      }
    }

    res.json({ status: paystackStatus, orderId });
  } catch (error) {
    console.error('Payment verify error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const paystackWebhook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      res.status(500).send('Configuration error');
      return;
    }

    // Security: Verify the webhook actually came from Paystack
    const hash = crypto.createHmac('sha512', secretKey).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      res.status(401).send('Invalid signature');
      return;
    }

    const event = req.body;
    
    // When payment is successful, move order from PENDING to PREPARING
    if (event.event === 'charge.success') {
      const orderId = event.data.metadata?.order_id;
      
      if (orderId) {
        await prisma.order.update({
          where: { id: parseInt(orderId) },
          data: { status: 'PREPARING' }
        });
        console.log(`✅ SUCCESS: Order #${orderId} marked as PREPARING via Paystack Webhook.`);
      }
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
