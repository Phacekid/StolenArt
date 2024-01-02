import dotenv from "dotenv";
import express from "express";
import ethers from "ethers";
import axios from "axios";
import TelegramBot from "node-telegram-bot-api";
import jsonfile from "jsonfile";

const contractABI = await jsonfile.readFile("./abi/erc721ABI.json");

dotenv.config();
const CA = "0x01c2B0359bde2bE676d8aA9470DE921DC3b4EAF9";
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
const contract = new ethers.Contract(CA, contractABI, provider); // stolen Art

let getMetadata = async function (tokenId) {
  try {
    let answers = `https://nftrarity.cash/nft/stolen-art/punk/${tokenId}/json`;
    let request = await axios.get(answers);
    let result = request["data"]["punk"];
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
    let finalAttr = String(sorted).replace(/[\r\n]\s*[\r\n]/g, "\n");
    return [nftName, linkImg, finalAttr];
  } catch (err) {
    console.log(err);
  }
};

async function main() {
  try {
    contract.on("Transfer", (from, to, tokenId) => {
      let info = {
        from: from,
        to: to,
        tokenId: ethers.BigNumber.from(tokenId).toNumber(),
      };

      if (info.from === "0x0000000000000000000000000000000000000000") {
        sendMintMssg(info.tokenId);
      }
    });
  } catch (err) {
    console.log(err);
  }
}

let sendMintMssg = async function (id) {
  try {
    let [name, img, attr] = await getMetadata(id);
    bot.sendPhoto(chatId, img, {
      caption: `
Stolen Art ${name} has been Minted
\<code\>Traits:\<\/code\>
${attr}
`,
      parse_mode: "HTML",
    });
  } catch (err) {
    console.log(err);
  }
};

main();
app.listen(PORT, () => {
  console.log(`server running at port ${PORT}`);
});
