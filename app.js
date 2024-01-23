import express from "express";
import dotenv from "dotenv";
export const app = express();

dotenv.config({
  path: "./data/config.env",
});

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const mysql = require("mysql");
const botToken = process.env.botToken;
const keep_alive = require("./keep_alive.js");
const host = process.env.host;
const user = process.env.user;
const password = process.env.password;
const database = process.env.user;

const bot = new TelegramBot(botToken, { polling: true });
const Group_Name = ["Planet of Supreme Kings 42,52", "DevLudo"]; // Replace with your group name
keep_alive;
const dbConnection = mysql.createConnection({
  host,
  user,
  password,
  database,
  timeout: 3600000,
});

function handleDisconnect() {
  dbConnection.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL:", err);
      setTimeout(handleDisconnect, 2000); // Retry after 2 seconds
    } else {
      console.log("Connected to MySQL");
    }

    // Set up an interval to execute the query every 30 seconds
    setInterval(() => {
      executeQuery();
      console.log("SetInterval");
    }, 50000); // 30 seconds in milliseconds
  });

  dbConnection.on("error", (err) => {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("MySQL connection lost. Reconnecting...");
      handleDisconnect();
    } else {
      console.error(err + " MySQL connection lost....");
    }
  });
}

handleDisconnect();

const pool = mysql.createPool({
  connectionLimit: 10, // Adjust as needed
  host,
  user,
  password,
  database,
  timeout: 3600000,
});

pool.query("SELECT 1", (err, results) => {
  if (err) {
    console.error("Error querying the database:", err);
  } else {
    console.log("Successfully connected to the database");
  }
});

// Function to execute the MySQL query
function executeQuery() {
  const query = "SELECT SUM(`Balance`) as Balance FROM DevLudo";

  dbConnection.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return;
    }
    // Process the results
    const balance = results[0].Balance;
    console.log(`Current Balance: ${balance}`);
  });
}

const userAttemptsMap = new Map(); // Map to store user attempts
const userMessageMap = new Map(); // Map to store user attempts

async function checkWalletForNFT(wallet, templateId) {
  try {
    const response = await axios.get(
      `https://wax.api.atomicassets.io/atomicassets/v1/assets?owner=${wallet}&template_id=${templateId}&page=1&limit=1`,
    );
    return response.data.data.length > 0 ? 1 : 0;
  } catch (error) {
    console.error("Error checking wallet for NFT:", error);
    return -1;
  }
}

function getWalletFromMySQL(TGID) {
  return new Promise((resolve, reject) => {
    const query = `SELECT WaxID FROM DevLudo WHERE TGID = '${TGID}' AND WaxID IS NOT NULL AND WaxID <> '';`;
    dbConnection.query(query, (err, results) => {
      if (err) {
        console.error("Error in getWalletFromMySQL:", err);
        reject(err);
      } else {
        const walletAddress = results.length > 0 ? results[0].WaxID : null;
        console.log("Wallet Address:", walletAddress);
        walletAddress
          ? resolve(walletAddress)
          : reject(new Error("Wallet not found in the database"));
      }
    });
  });
}

function isPrime(SNumber) {
  for (let i = 2; i <= Math.sqrt(SNumber); i++)
    if (SNumber % i === 0) return false;
  return SNumber > 1;
}

function storeInDB(tgUsername, randomNumber, chatId) {
  const insertQuery = `INSERT INTO DevLudo (TGID, Balance) VALUES ('${tgUsername}', ${randomNumber})`;
  dbConnection.query(insertQuery, (insertErr, insertResults) => {
    if (insertErr) {
      console.error(
        "Error storing username and balance in the database:",
        insertErr,
      );
      bot.sendMessage(chatId, "Error...Contact Admin");
    } else {
      bot.sendMessage(
        chatId,
        `🏆 Congratulations, @${tgUsername}! You rolled for 🪙 ${randomNumber} Dev Token`,
      );
    }
  });
}

bot.onText(/\/nwallet (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const tgUserId = msg.from.username;
  const waxId = match[1];

  if (msg.chat.type === "private" || !Group_Name.includes(msg.chat.title)) {
    bot.sendMessage(
      msg.chat.id,
      "Please join our group to chat with us: @PlanetOfTheSupremeKings",
    );
    console.log(msg.from.username);
  } else {
    try {
      const checkQuery = `SELECT * FROM DevLudo WHERE TGID = '${tgUserId}' OR WaxID = '${waxId}'`;

      dbConnection.query(checkQuery, (checkErr, checkResults) => {
        if (checkErr) {
          console.error("Error checking message in the database:", checkErr);
          bot.sendMessage(chatId, "Error checking message in the database");
        } else {
          if (checkResults.length > 0) {
            bot.sendMessage(
              chatId,
              "@" +
                tgUserId +
                " your Username or Wallet address is already Registred...!",
            );
          } else {
            const insertQuery = `INSERT INTO DevLudo (TGID, WaxID) VALUES ('${tgUserId}', '${waxId}')`;
            dbConnection.query(insertQuery, (insertErr, insertResults) => {
              if (insertErr) {
                console.error(
                  "Error storing message in the database:",
                  insertErr,
                );
                bot.sendMessage(
                  chatId,
                  "Error storing message in the database",
                );
              } else {
                bot.sendMessage(
                  chatId,
                  "@" +
                    tgUserId +
                    " Registred " +
                    waxId +
                    " Wax address Successfully...!",
                );
              }
            });
          }
        }
      });
    } catch (error) {
      bot.sendMessage(msg.chat.id, "An error occurred.");
      console.error(error);
    }
  }
});

bot.onText(/\/fekopasse/, (msg) => {
  if (msg.chat.type === "private" || !Group_Name.includes(msg.chat.title)) {
    bot.sendMessage(
      msg.chat.id,
      "Please join our group to chat with us: @PlanetOfTheSupremeKings",
    );
    console.log(msg.from.username);
  } else {
    try {
      const chatId = msg.chat.id;
      const tgUsername = msg.from.username;
      let wallet;
      const templateId = 712928;
      const userId = msg.from.id;
      const randomNumB = Math.floor(Math.random() * 100) + 1;
      const randomText = generateRandomText();

      const keyboard = {
        inline_keyboard: [
          [{ text: `${randomNumB}`, callback_data: "number" }],
          [{ text: `${randomText}`, callback_data: "text" }],
        ],
      };

      getWalletFromMySQL(tgUsername)
        .then((address) => {
          wallet = address;
          console.log("Stored Wallet Address:", wallet);
        })
        .catch((error) => {
          console.error("Error:", error.message);
        });

      // Example usage
      const randomNumber = generateWeightedRandomNumber();
      console.log(randomNumber);

      const checkQuery = `SELECT * FROM DevLudo WHERE TGID = '${tgUsername}'`;

      dbConnection.query(checkQuery, (checkErr, checkResults) => {
        if (checkErr) {
          console.error("Error checking username in the database:", checkErr);
          bot.sendMessage(chatId, "Error checking username in the database");
        } else {
          if (checkResults.length > 0) {
            // Check if the user has an ongoing game
            if (userAttemptsMap.has(tgUsername)) {
              const attempts = userAttemptsMap.get(tgUsername);
              if (attempts >= 5) {
                // Ban the user for 1 day
                const untilDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
                bot
                  .banChatMember(chatId, userId, { until_date: untilDate })
                  .then(() => {
                    bot.sendMessage(
                      chatId,
                      `🚫 🚫 🚫 BAN 🚫 🚫 🚫 \n@${msg.from.username} has been banned by Bot for using Bot or AutoClick.`,
                    );
                  })
                  .catch((error) => {
                    console.error("Error kicking user:", error);
                  });
                // Reset the attempts counter
                userAttemptsMap.delete(tgUsername);
              } else {
                // Increase the attempts counter
                userAttemptsMap.set(tgUsername, attempts + 1);
                bot.sendMessage(
                  chatId,
                  `‼️ Attention ‼️ \n@${tgUsername}, Complete your last validation promptly, or you risk facing a permanent ban...! Attempt ${
                    attempts + 1
                  }/5`,
                );
              }
            } else {
              checkWalletForNFT(wallet, templateId)
                .then((result) => {
                  if (result) {
                    console.log(
                      `Wallet ${wallet} holds NFT with template_id ${templateId}`,
                    );
                    if (isPrime(randomNumB)) {
                      if (randomNumB.toString().length % 2 == 0) {
                        bot
                          .sendMessage(
                            chatId,
                            "⚠️ ⚠️ ⚠️ \n\n@" +
                              tgUsername +
                              ' Click the "Number" button:',
                            { reply_markup: keyboard },
                          )
                          .then((sentMessage) => {
                            const messageId = sentMessage.message_id;
                            // Store user ID and message ID in the map
                            userAttemptsMap.set(tgUsername, 1);
                            userMessageMap.set(tgUsername, messageId);
                            bot.on("callback_query", (query) => {
                              if (
                                query.message.message_id === messageId &&
                                query.from.username === tgUsername
                              ) {
                                if (query.data === "number") {
                                  storeInDB(tgUsername, randomNumber, chatId);
                                } else if (query.data === "text") {
                                  bot.sendMessage(
                                    chatId,
                                    `⚠️ ⚠️ ⚠️ \n\nShh... @${tgUsername} autoClick & boting not allowed here...! \nKindly read validation msg carefully...!`,
                                  );
                                }
                                // Delete the original message with buttons
                                bot.deleteMessage(chatId, messageId);
                                // Remove the user from the map
                                userAttemptsMap.delete(tgUsername);
                                userMessageMap.delete(tgUsername);
                              }
                            });
                          })
                          .catch((error) => console.error("Error:", error));
                      } else {
                        bot
                          .sendMessage(
                            chatId,
                            "⚠️ ⚠️ ⚠️\n\n@" +
                              tgUsername +
                              ' Click the "Text" button:',
                            { reply_markup: keyboard },
                          )
                          .then((sentMessage) => {
                            const messageId = sentMessage.message_id;
                            // Store user ID and message ID in the map
                            userAttemptsMap.set(tgUsername, 1);
                            userMessageMap.set(tgUsername, messageId);
                            bot.on("callback_query", (query) => {
                              if (
                                query.message.message_id === messageId &&
                                query.from.username === tgUsername
                              ) {
                                if (query.data === "text") {
                                  storeInDB(tgUsername, randomNumber, chatId);
                                } else if (query.data === "number") {
                                  bot.sendMessage(
                                    chatId,
                                    `⚠️ ⚠️ ⚠️ \n\nShh.. seems @${tgUsername}is sleeping...!\nKindly read validation msg carefully...!`,
                                  );
                                }
                                // Delete the original message with buttons
                                bot.deleteMessage(chatId, messageId);
                                // Remove the user from the map
                                userAttemptsMap.delete(tgUsername);
                                userMessageMap.delete(tgUsername);
                              }
                            });
                          })
                          .catch((error) => console.error("Error:", error));
                      }
                    } else {
                      storeInDB(tgUsername, randomNumber, chatId);
                    }
                  } else {
                    console.log(
                      `Wallet ${wallet} does not hold required NFT with template_id ${templateId}`,
                    );
                    bot.sendMessage(
                      chatId,
                      `🙈 🙈 🙈 Shhhhh, @${tgUsername}! You Dont hold required nft...! \n \nhttps://wax.atomichub.io/explorer/template/wax-mainnet/supremekings/VIP-Gold-Pass_712928 `,
                    );
                  }
                })
                .catch((error) => console.error("Error:", error));
            }
          } else {
            bot.sendMessage(
              chatId,
              "Error: You need to register first. Use /nHelp for more options.",
            );
          }
        }
      });
    } catch (error) {
      bot.sendMessage(msg.chat.id, "An error occurred.");
      console.error(error);
    }
  }
});

function generateRandomText() {
  const textLength = Math.floor(Math.random() * 10) + 1;
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomText = "";

  for (let i = 0; i < textLength; i++) {
    const randomCharIndex = Math.floor(Math.random() * characters.length);
    randomText += characters.charAt(randomCharIndex);
  }

  return randomText;
}

function generateWeightedRandomNumber() {
  const weightedOptions = [
    { number: 0, weight: 3 }, // 0 is more frequent
    { number: 1, weight: 1 },
    { number: 2, weight: 1 },
    { number: 3, weight: 1 },
    { number: 4, weight: 1 },
    { number: 5, weight: 1 },
    { number: 6, weight: 1 }, // 6 is rare
  ];

  let totalWeight = 0;
  weightedOptions.forEach((option) => {
    totalWeight += option.weight;
  });

  let randomValue = Math.random() * totalWeight;

  for (let i = 0; i < weightedOptions.length; i++) {
    if (randomValue < weightedOptions[i].weight) {
      return weightedOptions[i].number;
    }

    randomValue -= weightedOptions[i].weight;
  }

  // In case of rounding errors
  return weightedOptions[weightedOptions.length - 1].number;
}

// Bot command to get balance
bot.onText(/\/mybalance/, (msg) => {
  if (msg.chat.type === "private" || !Group_Name.includes(msg.chat.title)) {
    bot.sendMessage(
      msg.chat.id,
      "Please join our group to chat with us: @PlanetOfTheSupremeKings",
    );
    console.log(msg.from.username);
  } else {
    try {
      const chatId = msg.chat.id;
      const tgUsername = msg.from.username;

      // Call the getBalance function
      getBalance(tgUsername, (err, balance) => {
        if (err) {
          console.error("Error getting balance:", err);
          bot.sendMessage(
            chatId,
            "Error getting balance. Please try again later.",
          );
        } else {
          bot.sendMessage(
            chatId,
            `👛 Balance 👛 \n\n @${tgUsername}, your current unpaid balance is ${balance} Dev`,
          );
        }
      });
    } catch (error) {
      bot.sendMessage(msg.chat.id, "An error occurred.");
      console.error(error);
    }
  }
});

// Modified getBalance function to accept TGID and callback
function getBalance(TGID, callback) {
  const query = `SELECT SUM(\`Balance\`) as Balance FROM DevLudo WHERE TGID = '${TGID}'`;
  dbConnection.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      callback(err, null);
    } else {
      const balance = results[0].Balance || 0;
      callback(null, balance);
    }
  });
}

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  // Send help information to the user
  bot.sendMessage(
    chatId,
    "/nwallet - Sync Wax Wallet /nwallet n3tvg.wam \n/mybalance - Show Unpaid Balance \n/fekopasse - Play game using this command \n/help - Use this command for help \n",
  );
});

//


// Bot command to make a payment
bot.onText(/\/pay (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const tgUsername = msg.from.username;

    // Split the command arguments
    const args = match[1].split(' ');

    // Validate the number of arguments
    if (args.length !== 3) {
        console.error('Invalid number of arguments');
        bot.sendMessage(chatId, 'Please provide the correct number of arguments: /pay <amount> @<TGID> <memo>');
        return;
    }

    // Extract values from the arguments
    const amount = args[0];
    const TGID = args[1];
    const memo = args[2];

    // Check if any parameter is missing
    if (!amount || !TGID || !memo) {
        console.error('Missing parameters');
        bot.sendMessage(chatId, 'Please provide all required parameters: amount, TGID, memo.');
        return;
    }

    // Ensure TGID starts with '@'
    if (!TGID.startsWith('@')) {
        bot.sendMessage(chatId, 'Please provide correct User starting with @.');
        return;
    }

    // Convert amount to a number
    const parsedAmount = parseInt(amount, 10);

    // Check if the amount is a positive integer
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error('Invalid amount');
        bot.sendMessage(chatId, 'Please provide a valid positive amount.');
        return;
    }

    // Check if the TGID exists in the table
    const checkTGIDQuery = `SELECT * FROM DevLudo WHERE TGID = '${TGID}'`;
    dbConnection.query(checkTGIDQuery, (checkTGIDErr, checkTGIDResults) => {
        if (checkTGIDErr) {
            console.error('Error checking TGID:', checkTGIDErr);
            bot.sendMessage(chatId, 'Error checking TGID. Please try again later.');
        } else {
            if (checkTGIDResults.length === 0) {
                bot.sendMessage(chatId, 'Entered User is not available.');
            } else {
                // Proceed with the payment
                proceedWithPayment(TGID, parsedAmount, memo, chatId);
            }
        }
    });
});

// Function to proceed with the payment after validations
function proceedWithPayment(TGID, amount, memo, chatId) {
    // Check if the amount is greater than the balance
    const balanceQuery = `SELECT SUM(Balance) as Balance FROM DevLudo WHERE TGID = '${TGID}'`;
    dbConnection.query(balanceQuery, (balanceErr, balanceResults) => {
        if (balanceErr) {
            console.error('Error checking balance:', balanceErr);
            bot.sendMessage(chatId, 'Error checking balance. Please try again later.');
        } else {
            const currentBalance = balanceResults[0].Balance || 0;
            if (amount > currentBalance) {
                bot.sendMessage(chatId, 'Entered amount is greater than the holding amount.');
            } else {
                // Call the payDev function
                payDev(TGID, amount, memo, chatId);
            }
        }
    });
}

// Modified payDev function to accept TGID, amount, memo, and chatId
function payDev(TGID, amount, memo, chatId) {
    // Insert the values into the DevLudo table
    const insertQuery = `INSERT INTO DevLudo (TGID, Balance, Memo) VALUES ('${TGID}', ${amount}*(-1), '${memo}')`;
    dbConnection.query(insertQuery, (err, results) => {
        if (err) {
            console.error('Error recording payment:', err);
            bot.sendMessage(chatId, 'Error recording payment. Please try again later.');
        } else {
            bot.sendMessage(chatId, `Payment recorded successfully. TGID: ${TGID}, Amount: ${amount}, Memo: ${memo}`);
        }
    });
}

