import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const API_VERSION = 'v24.0';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function sendMessage(recipientId: string, message: string) {
  const url = `https://graph.facebook.com/${API_VERSION}/me/messages`;

  try {
    const response = await axios.post(
      url,
      {
        recipient: { id: recipientId },
        message: { text: message },
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN },
      }
    );

    console.log('✅ Message sent successfully!');
    console.log('   Message ID:', response.data.message_id);
    console.log('   Recipient ID:', response.data.recipient_id);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error sending message:');
    console.error('   ', error.response?.data || error.message);
    throw error;
  }
}

async function sendTypingIndicator(recipientId: string, action: 'typing_on' | 'typing_off') {
  const url = `https://graph.facebook.com/${API_VERSION}/me/messages`;

  try {
    await axios.post(
      url,
      {
        recipient: { id: recipientId },
        sender_action: action,
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN },
      }
    );

    console.log(`✅ Typing indicator ${action} sent`);
  } catch (error: any) {
    console.error('❌ Error sending typing indicator:', error.response?.data || error.message);
  }
}

async function sendQuickReplies(recipientId: string, text: string, replies: string[]) {
  const url = `https://graph.facebook.com/${API_VERSION}/me/messages`;

  try {
    const response = await axios.post(
      url,
      {
        recipient: { id: recipientId },
        message: {
          text: text,
          quick_replies: replies.map((reply) => ({
            content_type: 'text',
            title: reply,
            payload: reply,
          })),
        },
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN },
      }
    );

    console.log('✅ Quick replies sent successfully!');
    console.log('   Message ID:', response.data.message_id);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error sending quick replies:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('📘 Facebook Messenger - Send Message Tool');
  console.log('═══════════════════════════════════════════════════\n');

  if (!PAGE_ACCESS_TOKEN) {
    console.error('❌ FACEBOOK_PAGE_ACCESS_TOKEN not found in .env');
    rl.close();
    return;
  }

  console.log('📝 Instructions:');
  console.log('1. Go to your Facebook Page');
  console.log('2. Send a message to your page from your personal account');
  console.log('3. Get the sender ID from webhook logs or Facebook Graph API');
  console.log('4. Enter the sender ID below\n');

  const recipientId = await question('Enter Recipient ID (Facebook User ID): ');

  if (!recipientId) {
    console.log('❌ Recipient ID is required');
    rl.close();
    return;
  }

  console.log('\n📤 Choose message type:');
  console.log('1. Simple text message');
  console.log('2. Message with typing indicator');
  console.log('3. Message with quick replies');

  const choice = await question('\nEnter choice (1-3): ');

  try {
    switch (choice) {
      case '1':
        const message = await question('Enter message: ');
        await sendMessage(recipientId, message);
        break;

      case '2':
        const message2 = await question('Enter message: ');
        console.log('\n⌨️  Sending typing indicator...');
        await sendTypingIndicator(recipientId, 'typing_on');
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        await sendMessage(recipientId, message2);
        await sendTypingIndicator(recipientId, 'typing_off');
        break;

      case '3':
        const message3 = await question('Enter message: ');
        const repliesInput = await question('Enter quick replies (comma separated): ');
        const replies = repliesInput.split(',').map((r) => r.trim());
        await sendQuickReplies(recipientId, message3, replies);
        break;

      default:
        console.log('❌ Invalid choice');
    }
  } catch (error) {
    // Error already logged
  }

  console.log('\n✅ Done!');
  rl.close();
}

main();
