import dotenv from "dotenv";
import express from "express";
import ethers from "ethers";
import axios from "axios";
import TelegramBot from "node-telegram-bot-api";
import jsonfile from "jsonfile";

const contractABI = await jsonfile.readFile("./abi/erc721ABI.json");

dotenv.config();
const CA = "0x01c2B0359bde2bE676d8aA9470DE921DC3b4EAF9";
const receiver = "0xaCC3A464fa2Ac6c93e0Ee6F952FF0E8b438e2A36";
const rpcUrl = `https://smartbch.fountainhead.cash/mainnet`;

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });
const chatId = process.env.chat_ID;
const PORT = process.env.PORT || 5000;
const app = express();

app.get("/", (req, res) => {
  res.send("Hi there");
});

const provider = new ethers.providers.JsonRpcProvider(rpcUrl, 10000);
const contract = new ethers.Contract(CA, contractABI, provider); // cackles
var wallet = ethers.Wallet.createRandom();
const account = wallet.connect(provider);
const notMinted = "NFT not minted";

let getMetadatas = async function (contractAddress, id) {
  try {
    let nftContract = new ethers.Contract(
      contractAddress,
      contractABI,
      account
    );
    const tokenURI = await nftContract.tokenURI(id);
    console.log(tokenURI);
    return tokenURI;
  } catch (err) {
    if (err.reason == "ERC721Metadata: URI query for nonexistent token") {
      console.log(notMinted);
      return notMinted;
    }
  }
};

// async function main() {
//   try {
//     contract.on("Transfer", (from, to, tokenId) => {
//       let info = {
//         from: from,
//         to: to,
//         tokenId: ethers.BigNumber.from(tokenId).toNumber(),
//       };
//       transferDetected(info.from, info.to, info.tokenId);
//     });
//   } catch (err) {
//     console.log(err);
//   }
// }

let nftMetadata = async function (tokenId) {
  let answers = await getMetadatas(CA, tokenId);
  if (answers == notMinted) {
    return;
  }
  let request = await axios.get(answers);
  let result = request["data"];
  let nftName = result["name"];
  let linkImg = result["image"];
  let attrs = result["attributes"];

  let out = new Array();
  let sorted = {};
  let i = 0;
  for (i; i < attrs.length; i++) {
    let traitType = attrs[i]["trait_type"];
    let traitValue = attrs[i]["value"];

    out[i] = `- ${traitType}: ${traitValue}`;

    if (traitValue == "Blank") {
      delete out[i];
    }

    if (out.length == attrs.length) {
      let outSorted = out.join("\n");
      sorted = `\<code\>${outSorted}\<\/code\>`;
    }
  }
  let finalOut = String(sorted).replace(/[\r\n]\s*[\r\n]/g, "\n");
  console.log(finalOut);
  //   try {
  //     bot.sendPhoto(chatId, linkImg, {
  //       caption: `
  // ${nftName}
  // \<code\>Traits:\<\/code\>
  // ${finalOut}
  // `,
  //       parse_mode: "HTML",
  //     });
  //   } catch (err) {
  //     console.log(err);
  //   }
};
nftMetadata(1110);
// main();

app.listen(PORT, () => {
  console.log(`server running at port ${PORT}`);
});
