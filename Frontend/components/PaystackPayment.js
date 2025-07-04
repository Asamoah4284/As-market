import React from 'react';
import { Modal } from 'react-native';
import { Paystack } from 'react-native-paystack-webview';
import { PAYSTACK_PUBLIC_KEY } from '../config/api';

const PaystackPayment = ({ 
  isVisible, 
  amount, 
  email, 
  onCancel, 
  onSuccess,
  reference = Math.floor(Math.random() * 1000000000 + 1).toString(),
  publicKey = PAYSTACK_PUBLIC_KEY
}) => {
  console.log('PaystackPayment - Amount details:', {
    originalAmount: amount,
    reference
  });

  return (
    <Modal visible={isVisible} animationType="slide">
      <Paystack
        paystackKey={publicKey}
        amount={amount}
        billingEmail={email}
        activityIndicatorColor="green"
        onCancel={onCancel}
        onSuccess={onSuccess}
        autoStart={true}
        reference={reference}
        billingName="Customer"
        channels={["card", "bank", "ussd", "qr", "mobile_money"]}
        currency="GHS"
      />
    </Modal>
  );
};

export default PaystackPayment; 