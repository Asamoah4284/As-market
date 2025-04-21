const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
// This is necessary to send push notifications
const expo = new Expo();

/**
 * Send push notifications to one or multiple recipients
 * @param {string|string[]} pushTokens - Push token or array of push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body/message
 * @param {object} data - Additional data to send
 * @returns {Promise} - Result of notification sending
 */
const sendPushNotification = async (pushTokens, title, body, data = {}) => {
  // Create the messages that we want to send to clients
  let messages = [];
  let tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];

  for (let pushToken of tokens) {
    // Validate the token
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message
    messages.push({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default',
    });
  }

  // Send the messages
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  try {
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    }
    return tickets;
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    throw error;
  }
};

module.exports = {
  sendPushNotification,
}; 