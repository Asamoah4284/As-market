import React from 'react';
import { Modal } from 'react-native';
import { Paystack } from 'react-native-paystack-webview';

const PaystackPayment = ({ 
  isVisible, 
  amount, 
  email, 
  onCancel, 
  onSuccess,
  reference = Math.floor(Math.random() * 1000000000 + 1).toString(),
  publicKey = 'pk_test_adab0e58f74cc222a31e9e82a291ae8de3952848' // Replace with your Paystack PUBLIC key
}) => {
  // Convert amount to pesewas (multiply by 100)
  const amountInPesewas = Math.round(amount * 100);

  console.log('PaystackPayment - Amount details:', {
    originalAmount: amount,
    amountInPesewas,
    reference
  });

  return (
    <Modal visible={isVisible} animationType="slide">
      <Paystack
        paystackKey={publicKey}
        amount={amountInPesewas}
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