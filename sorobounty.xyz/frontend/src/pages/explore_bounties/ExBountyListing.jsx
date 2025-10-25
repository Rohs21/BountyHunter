import React, { useState, useCallback, useEffect } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from '@reach/router';
import * as SorobanClient from 'soroban-client';
import MainHeader from '../../components/menu/MainHeader';
import HelpButton from '../../components/menu/HelpButton';
import Subheader from '../../components/menu/SubHeader';
import { ListingDescription } from '../../components/ListingDescription';
import { Information } from '../../components/Information';
import { Participant } from '../../components/Participant';
import BackButton from '../../components/menu/BackButton';
import { useCustomWallet } from '../../contexts/WalletContext';
import { useContract } from '../../contexts/ContractContext';
import useBackend from '../../hooks/useBackend';
import { IsSmMobile } from '../../utils';

const ExBountyListingBody = ({bounty}) => {
  const nav = useNavigate();
  const { isConnected, walletAddress } = useCustomWallet();
  const { applyBounty } = useContract();
  const { createWork } = useBackend();
  
  const onClickApply = useCallback(async (event) => {
    if (!isConnected) {
      toast.warning('Wallet not connected yet!');
      return;
    }

    toast.info('Applying for bounty...');
    console.log('Applying with:', { walletAddress, bountyId: bounty?.bountyId });

    try {
      // First try blockchain
      let workId;
      try {
        // Create account if needed
        try {
          const server = new SorobanClient.Server("https://rpc-futurenet.stellar.org");
          await server.getAccount(walletAddress);
        } catch (e) {
          if (e.code === 404) {
            toast.info('Creating account on Futurenet...');
            try {
              const friendbot = "https://friendbot-futurenet.stellar.org";
              await fetch(friendbot + "?addr=" + walletAddress);
              toast.success('Account created successfully!');
            } catch (err) {
              toast.error('Failed to create account: ' + err.message);
              return;
            }
          }
        }

        workId = Date.now(); // Use timestamp as fallback
        const blockchainWorkId = await applyBounty(walletAddress, bounty?.bountyId);
        if (blockchainWorkId > 0) {
          workId = blockchainWorkId;
          toast.success('Successfully applied on blockchain!');
        }
      } catch (e) {
        console.error('Blockchain error:', e);
        if (e.code === 404) {
          toast.error('Account not found. Please make sure you have funds on Futurenet.');
          return;
        }
        toast.warning(`Blockchain error (continuing anyway): ${e.message}`);
      }

      // Then try backend
      const result = await createWork(walletAddress, bounty?.bountyId, workId);
      console.log('Backend result:', result);

      if (!result.success) {
        console.error('Backend error:', result.error);
        toast.error(`Backend error: ${result.error}`);
        return;
      }

      // All good!
      toast.success('Successfully applied for bounty!');
      
      // Force reload participants
      window.dispatchEvent(new CustomEvent('refreshWorks', { detail: bounty?.bountyId }));
      
      // Navigate to in progress page
      nav('/InProgress/');
    } catch (e) {
      console.error('Error applying for bounty:', e);
      toast.error(`Error: ${e.message}`);
    }
  }, [isConnected, walletAddress, bounty]);
  
  return (
    <div className='app-content pb-0 pr-4'>
      {!IsSmMobile() ?
        <div className='flex gap-3'>
          <div className='col-lg-7 pt-7'>
            <ListingDescription bounty={bounty} />
            <Participant bountyId={bounty.bountyId} />
          </div>
          <div className='col-lg-5'>
            <Information 
              wallet = {bounty?.creator?.wallet} 
              payAmount = {bounty?.payAmount} 
              type = {bounty?.type} 
              difficulty = {bounty?.difficulty} 
              topic = {bounty?.topic} 
              gitHub = {bounty?.gitHub} 
              startDate = {Date.parse(bounty?.startDate)} 
              endDate = {Date.parse(bounty?.endDate)} 
              block = {bounty?.block} 
              status = {bounty?.status}
            />
            <div className='w-full my-2 py-3'>
              <button className='text-[18px] w-full border rounded-2xl px-2 py-2 btn-hover' onClick={onClickApply}>Apply</button>
            </div>
          </div>
        </div> :
        <div className='flex flex-col'>
          <ListingDescription bounty={bounty} />
          <Information 
              wallet = {bounty?.creator?.wallet} 
              payAmount = {bounty?.payAmount} 
              type = {bounty?.type} 
              difficulty = {bounty?.difficulty} 
              topic = {bounty?.topic} 
              gitHub = {bounty?.gitHub} 
              startDate = {Date.parse(bounty?.startDate)} 
              endDate = {Date.parse(bounty?.endDate)} 
              block = {bounty?.block} 
              status = {bounty?.status}
          />
          <Participant bountyId={bounty.bountyId} />
          <div className='w-full my-2 py-3'>
            <button className='text-[18px] w-full border rounded-2xl px-2 py-2 btn-hover' onClick={onClickApply}>Apply</button>
          </div>
        </div>}
      <HelpButton />
    </div>
  );
}

const ExBountyListing = () => {
  const { getSingleBounty } = useBackend();
  const { id: bountyId } = useParams();
  const [bounty, setBounty] = useState({});
  
  useEffect(() => {
    async function fetchBounty(bountyId) {
      const singleBounty = await getSingleBounty(bountyId);
      setBounty(singleBounty);
    }

    fetchBounty(bountyId);
  }, [bountyId]);

  return (
    <div className='full-container'>
      <div className='container'>
        <MainHeader />
        <div className='bounty-listing-container'>
          <Subheader />
          <BackButton to='/ExploreBounties' />
          <div className='app-header px-0 xsm:items-start xl:items-center xsm:flex-col'>
            <div className='app-title'>
              <p className='text-[40px] sm:text-center text-white pt-3'>{bounty?.title}</p>
            </div>
          </div>
          {IsSmMobile() ? (
            <ExBountyListingBody bounty={bounty} />
          ) : (
            <Scrollbars id='body-scroll-bar' autoHide style={{ height: '100%' }}
              renderThumbVertical={({ style, ...props }) =>
                <div {...props} className={'thumb-horizontal'} />
              }>
              <ExBountyListingBody bounty={bounty} />
            </Scrollbars>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExBountyListing;
