const puppeteer = require('puppeteer');

module.exports.config = {
  name: 'friendrequests',
  version: '1.0.0',
  hasPermission: 2, // Admin Permission or a specific role
  description: 'Accept or decline friend requests on Facebook',
  usages: 'friendrequests [accept|decline] [username]',
  credits: 'Facebook Automation by YourBot',
  cooldowns: 0,
};

module.exports.run = async function({ api, event, args }) {
  const action = args[0];  // 'accept' or 'decline'
  const userID = args[1];  // Facebook user ID or name to find
  const fbUsername = "your_facebook_email_or_phone"; // Login credentials
  const fbPassword = "your_facebook_password";      // Login credentials
  
  // Verify action and userID
  if (!['accept', 'decline'].includes(action)) {
    return api.sendMessage('❌ Invalid action. Use "accept" or "decline".', event.threadID, event.messageID);
  }
  if (!userID) {
    return api.sendMessage('❌ Please provide a valid user ID or username.', event.threadID, event.messageID);
  }

  // Puppeteer automation to login to Facebook and process friend requests
  try {
    const browser = await puppeteer.launch({ headless: false }); // Open browser window
    const page = await browser.newPage();

    // Go to Facebook login page
    await page.goto('https://www.facebook.com/login');

    // Log in using credentials
    await page.type('#email', fbUsername);
    await page.type('#pass', fbPassword);
    await page.click('[type="submit"]');
    await page.waitForNavigation();

    // Go to the "Friend Requests" page
    await page.goto('https://www.facebook.com/friends/requests/');

    // Wait for friend request section to load
    await page.waitForSelector('[data-testid="friend_request_list"]');

    // Find the friend request based on userID or name
    const requestButton = await page.$x(`//span[contains(text(), '${userID}')]/ancestor::div[contains(@class, 'friendRequest')]//button[text()='Confirm']`);

    if (requestButton.length === 0) {
      return api.sendMessage(`❌ No friend request found for ${userID}.`, event.threadID, event.messageID);
    }

    if (action === 'accept') {
      // Accept the friend request
      await requestButton[0].click();
      api.sendMessage(`✅ Friend request from ${userID} has been accepted.`, event.threadID, event.messageID);
    } else if (action === 'decline') {
      // Decline the friend request
      const declineButton = await page.$x(`//span[contains(text(), '${userID}')]/ancestor::div[contains(@class, 'friendRequest')]//button[text()='Delete']`);
      if (declineButton.length > 0) {
        await declineButton[0].click();
        api.sendMessage(`❌ Friend request from ${userID} has been declined.`, event.threadID, event.messageID);
      }
    }

    // Close the browser after the action is done
    await browser.close();
  } catch (error) {
    console.error(error);
    api.sendMessage('❌ Something went wrong while processing your request. Please try again later.', event.threadID, event.messageID);
  }
};
