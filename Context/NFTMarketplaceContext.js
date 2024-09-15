import React, { useState, useEffect, useContext } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers"; // Ensure this import is correct
import Router from "next/router";
import axios from "axios";
import { create as ipfsHttpClient } from "ipfs-http-client";

// const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const projectId = "your project id here";
const projectSecretKey = "project secretkey"
const auth = `Basic ${Buffer.from(`${projectId}:${ projectSecretKey }`).toString(
"base64"
)}`;

const subdomain = "your subdomain";

const client = ipfsHttpClient({
  host: "infura-ipfs.io",
  port:5001,
  protocol: "https",
  headers:{
    authorization: auth,
  },
});

// INTERNAL IMPORT
import { NFTMarketplaceAddress, NFTMarketplaceABI } from "./constants";

// ----FETCHING SMART CONTRACT
const fetchContract = (signerOrProvider) =>
  new ethers.Contract(
    NFTMarketplaceAddress,
    NFTMarketplaceABI,
    signerOrProvider
  );

// CONNECTING WITH SMART CONTRACT
const connectingWithSmartContract = async () => {
  try {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection); // Ensure the correct case
    const signer = provider.getSigner();
    const contract = fetchContract(signer);
    return contract;
  } catch (error) {
    console.log("Something went wrong while connecting with contract:", error); // Log the error
  }
};

export const NFTMarketplaceContext = React.createContext();

export const NFTMarketplaceProvider = ({ children }) => {
  const titleData = "NFTs-MARKET PLACE";

  //    USESTATE

  const [currentAccount, setCurrentAccount] = useState("");

  // ---CHECK IF THE WALLET IS CONNECTED OR NOT
  const checkIfWalletConnected = async () => {
    try {
      if (!window.ethereum) return console.log("Install MetaMask");

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log("No Account Found");
      }
      // console.log("currentAccount");
    } catch (error) {
      console.log("Something wrong while connecting to wallet");
    }
  };

  useEffect(() => {
    checkIfWalletConnected();
  }, []);

  // CONNECT WALLET FUNCTION

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return console.log("Install MetaMask");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
      // window.location.reload();
    } catch (error) {
      console.log("Error while connecting to wallet");
    }
  };

  // UPLOAD TO IPFS FUNCTION

  const uploadToIPFS = async (file) => {
    try {
      const added = await client.add({ content: file });
      const url = `${subdomain}/ipfs/${added.path}`;
      return url;
    } catch (error) {
      console.log("Error Uploading to IPFS");
    }
  };

  // CREATE NFT FUNCTION

  const createNFT = async (name, price, image, description, router) => {
    if (!name || !description || !price || !image)
      return console.log("Data is missing");
    const data = JSON.stringify({ name, description, image});

    try {
      const added = await client.add(data);
      const url = `https://infura-ipfs.io/ipfs/${added.path}`;

      await createSale(url, price);
    } catch (error) {
      console.log(error);
    }
  };

  //   createSale Function

  const createSale = async (url, formInputPrice, isReselling, id) => {
    try {
      const price = ethers.utils.parseUnits(formInputPrice, "ether");
      const contract = await connectingWithSmartContract();

      const listingPrice = await contract.getListingPrice();

      const transcation = !isReselling
        ? await contract.createToken(url, price, {
            value: listingPrice.toString(),
          })
        : await contract.reSellToken(url, price, {
            value: listingPrice.toString(),
          });

      await transcation.wait();
      console.log(transcation);
    } catch (error) {
      console.log("error while creating sale");
    }
  };

//  FETCHNFTS FUNCTIONS

const fetchNFTS = async ()=>{
    try {
        const provider = new ethers.providers.JsonRpcProvider();
        const contract = fetchContract(provider);

        const data = await contract.fetchMarketItem();

        // console.log(data)

        const items = await Promise.all(
            data.map(async({tokenId, seller, owner, price: unformattedPrice}) =>{
                const tokenURI = await contract.toekenURI(tokenId);
                const {
                    data:{image, name, description},
                } = await axios.get(tokenURI);
                const price = ethers.utils.formatUnits(
                    unformattedPrice.toString(),
                    "ether"
                );

                return {
                    price, 
                    tokenId: tokenId.toNumber(),
                    seller,
                    owner,
                    image,
                    name,
                    description,
                    tokenURI
                };
    })

        );
        return items;
    } catch (error) {
        console.log("Error while fetching NFTS");
    }
}

// FETCHING MY NFT OR LISTED NFTs

const fetchMyNFTsOrListedNFTs = async(type)=>{
    try {
        const contract = await connectingWithSmartContract();
        const data = type == "fetchItemsListed"
         ? await contract.fetchItemsListed()
         : await contract.fetchMyNFT();
        
        const items = await Promise.all(
            data.map(async({tokenId, seller, owner, price: unformattedPrice})=>{
                const tokenURI = await contract.tokenURI(tokenId);
                const {
                    data :{image, name, description},

                } = await axios.get(tokenURI)
                const price = ethers.utils.formatUnits(
                    unformattedPrice.toString(),
                    "ether"
                );

                return{
                    price,
                    tokenId: tokenId.toNumber(),
                    seller,
                    owner,
                    image,
                    name,
                    description,
                    tokenURI,
                };
            })
        );
        return items;
    } catch (error) {
        console.log("Error while fetching listed NFTs");
        
    }
}

// BUY NFTs FUNCTION

const buyNFT = async (nft)=>{
    try {
        const contract = await connectingWithSmartContract();
        const price = ethers.utils.parseUnits(nft.price.toString(),"ether");
        const transcation = await contract.createMarketSale(nft.tokenId,{
            value: price,
        });
        await transcation.wait();
        
    } catch (error) {
        console.log("Error While buying NFT");
        
    }
}

  return (
    <NFTMarketplaceContext.Provider
      value={{
        checkIfWalletConnected,
        connectWallet,
        uploadToIPFS,
        createNFT,
        fetchNFTS,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
        currentAccount,
        titleData,
      }}
    >
      {children}
    </NFTMarketplaceContext.Provider>
  );
};
