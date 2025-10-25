import React, { useState, useEffect } from 'react';
import { useCustomWallet } from '../contexts/WalletContext';
import useBackend from '../hooks/useBackend';

const Avatar = ({ hide }) => {
  const { isConnected, walletAddress } = useCustomWallet();
  const { getUser } = useBackend();
  const [userImg, setUserImg] = useState(null);
  
  useEffect(() => {
    if (!isConnected || !walletAddress) {
      setUserImg(null);
      return;
    }

    let cancelled = false;

    async function fetchUserImg(addr) {
      try {
        const userProfile = await getUser(addr);
        if (!cancelled && userProfile) {
          setUserImg(userProfile.image || userProfile.avatar || null);
        }
      } catch (e) {
        // Silently handle error - will use default image
        setUserImg(null);
      }
    }

    fetchUserImg(walletAddress);
    return () => { cancelled = true; };
  }, [isConnected, walletAddress]);

  return (
    <div className='relative flex items-center justify-center'>
      <img alt='' className='w-[120px] h-[120px] rounded-full' 
		    src={(!hide && userImg) ? userImg : '/images/banner/unknown.png'} />
    </div>
  );
}

export default Avatar;
