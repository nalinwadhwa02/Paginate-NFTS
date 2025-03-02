import { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Metaplex } from '@metaplex-foundation/js';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('mainnet-beta'));
const mx = Metaplex.make(connection);

const Home = () => {
  const [address, setAddress] = useState(
    'Geh5Ss5knQGym81toYGXDbH3MFU2JCMK7E4QyeBHor1b',
  );

  const [nftList, setNftList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentView, setCurrentView] = useState(null);
  const perPage = 1;

  const fetchNFTs = async () => {
    try {
      setLoading(true);
      setCurrentView(null);
      const list = await mx.nfts().findAllByOwner(new PublicKey(address));
      setNftList(list);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!nftList) {
      return;
    }

    const execute = async () => {
      const startIndex = (currentPage - 1) * perPage;
      const endIndex = currentPage * perPage;
      await loadData(startIndex, endIndex);
      setCurrentView(nftList.slice(startIndex, endIndex));
      setLoading(false);
    };
    execute();
  }, [nftList, currentPage]);

  const loadData = async (startIndex, endIndex) => {
    const nftsToLoad = nftList.filter((nft, index) => {
      return (
        index >= startIndex && index < endIndex && nft.metadataTask.isPending()
      );
    });

    const promises = nftsToLoad.map((nft) => nft.metadataTask.run());
    await Promise.all(promises);
  };

  const changeCurrentPage = (operation) => {
    setLoading(true);
    if (operation === 'next') {
      setCurrentPage((prevValue) => prevValue + 1);
    } else {
      setCurrentPage((prevValue) => (prevValue > 1 ? prevValue - 1 : 1));
    }
  };

  return (
    <div>
      <Head>
        <title>Metaplex and Next.js example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.App}>
        <div className={styles.container}>
          <h1 className={styles.title}>Wallet Address</h1>
          <div className={styles.nftForm}>
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
            <button className={styles.styledButton} onClick={fetchNFTs}>
              Fetch
            </button>
          </div>
          {loading ? (
            <img className={styles.loadingIcon} src="/loading.svg" />
          ) : (
            currentView &&
            currentView.map((nft, index) => (
              <div key={index} className={styles.nftPreview}>
                <h1>{nft.name}</h1>
                <img
                  className={styles.nftImage}
                  src={nft.metadata.image || '/fallbackImage.jpg'}
                  alt="The downloaded illustration of the provided NFT address."
                />
              </div>
            ))
          )}
          {currentView && (
            <div className={styles.buttonWrapper}>
              <button
                disabled={currentPage === 1}
                className={styles.styledButton}
                onClick={() => changeCurrentPage('prev')}
              >
                Prev Page
              </button>
              <button
                disabled={
                  nftList && Math.ceil(nftList.length / perPage) === currentPage
                }
                className={styles.styledButton}
                onClick={() => changeCurrentPage('next')}
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
