import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from '@reach/router';
import Scrollbars from 'react-custom-scrollbars';
import { toast } from 'react-toastify';

import { useCustomWallet } from '../../contexts/WalletContext';
import MainHeader from '../../components/menu/MainHeader';
import HelpButton from '../../components/menu/HelpButton';
import Subheader from '../../components/menu/SubHeader';
import { Information } from '../../components/Information';
import { ListingDescription } from '../../components/ListingDescription';
import { Participant } from '../../components/Participant';
import WarningMsg from '../../components/WarningMsg';
import BackButton from '../../components/menu/BackButton'
import { useContract } from '../../contexts/ContractContext';
import useBackend from '../../hooks/useBackend';
import { Drawer } from './Drawer';
import { IsSmMobile } from '../../utils';
import * as SorobanClient from 'soroban-client';

const InBountyListingBody = ({ bounty, callback }) => {
  return (
    <div className='app-content pb-0 pr-4'>
      {!IsSmMobile() ?
        <div className='flex gap-3'>
          <div className='col-lg-7 pt-7'>
            <ListingDescription bounty={bounty} />
            <Participant bountyId={bounty.bountyId} submit={true} />
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
          <div className='w-full my-2 py-3'>
            <button className='text-[18px] w-full border rounded-2xl px-2 py-2 btn-hover' onClick={() => { callback() }}>Submit Work</button>
          </div>
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
            <button className='text-[18px] w-full border rounded-2xl px-2 py-2 btn-hover' onClick={() => { callback() }}>Submit Work</button>
          </div>
        </div>}
      <HelpButton />
    </div>
  );
}

const InBountyListing = () => {
  const { isConnected, walletAddress } = useCustomWallet();
  const { submitWork } = useContract();
  const { getSingleBounty, getWork, submitWorkB } = useBackend();
  const { id: bountyId } = useParams();
  const nav = useNavigate();
  const [bounty, setBounty] = useState({});
  const [work, setWork] = useState({});
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleDrawerOpen = useCallback(() => setDrawerOpen(true), []);
  const handleDrawerClose = useCallback(() => setDrawerOpen(false), []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gitHub, setGitHub] = useState('');
  
  useEffect(() => {
    async function fetchBountyAndWork(bountyId) {
	  if (!bountyId) return;
      const singleBounty = await getSingleBounty(bountyId);
      setBounty(singleBounty);
      if (!walletAddress) return;
      
      try {
        const work = await getWork(walletAddress, bountyId);
        console.log('Fetched work:', work);
        // Ensure workId is a valid u32 number
        if (work && work.workId) {
          // Convert string to number if needed
          const workId = typeof work.workId === 'string' ? parseInt(work.workId, 10) : work.workId;
          // Validate it's a positive integer within u32 range
          if (Number.isInteger(workId) && workId >= 0 && workId <= 4294967295) {
            setWork({...work, workId: workId});
          } else {
            console.error('Invalid workId:', workId);
            toast.error('Invalid work ID format');
          }
        } else {
          console.error('Work or workId is missing:', work);
        }
      } catch (error) {
        console.error('Error fetching work:', error);
        toast.error('Error fetching work details');
      }
    }

    fetchBountyAndWork(bountyId);
  }, [walletAddress, bountyId]);

  const onChangeTitle = useCallback((event) => {
    setTitle(event.target.value);
  }, []);
  const onChangeDescription = useCallback((event) => {
    setDescription(event.target.value);
  }, []);
  const onChangeGitHub = useCallback((event) => {
    setGitHub(event.target.value);
  }, []);

    const onSubmitClicked = useCallback(async (event) => {
    if (!isConnected) {
      toast.warning('Wallet not connected yet!');
      return;
    }

    console.log('Starting work submission process...');
    console.log('Parameters:', {
      walletAddress,
      workId: work?.workId,
      gitHub,
      title,
      description,
      bountyId: bounty?.bountyId
    });    // Validate required fields
    if (!work?.workId) {
      toast.error('Work ID is missing. Have you applied to this bounty first?');
      return;
    }

    if (!gitHub) {
      toast.error('Please enter a GitHub link');
      return;
    }

    if (!title) {
      toast.error('Please enter a title');
      return;
    }

    if (!description) {
      toast.error('Please enter a description');
      return;
    }

    if (!walletAddress) {
      toast.error('Wallet address is missing');
      return;
    }

    // Try to submit work to the blockchain
    try {
      console.log('Attempting to submit work to blockchain...');
      
      // Ensure workId is a valid u32 number
      const workId = work?.workId;
      console.log('Submitting with workId:', workId, 'type:', typeof workId);
      if (!workId || !Number.isInteger(workId) || workId < 0 || workId > 4294967295) {
        console.error('Invalid workId:', workId);
        toast.error('Invalid work ID. Please try applying to the bounty again.');
        return;
      }

      // Validate other required fields
      if (!gitHub) {
        toast.error('GitHub link is required');
        return;
      }

      if (!title) {
        toast.error('Title is required');
        return;
      }

      if (!description) {
        toast.error('Description is required');
        return;
      }

      // First submit to blockchain
      const res1 = await submitWork(walletAddress, workId);
      console.log('Blockchain submission result:', res1);

      // Check for specific error codes
      if (res1 === -1) {
        toast.error('Simulation failed - check console for details');
        return;
      } else if (res1 === -2) {
        toast.error('Transaction failed on blockchain');
        return;
      } else if (res1 === -3) {
        toast.error('Transaction status is FAILED');
        return;
      } else if (res1 === -4) {
        toast.error('Transaction error - check console for details');
        return;
      } else if (res1) {
        toast.error('Failed to submit to bounty on blockchain!');
        console.error('Blockchain submission failed with result:', res1);
        return;
      }
    } catch (error) {
      console.error('Blockchain submission error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Check if it's an account not found error
      if (error.message && error.message.includes('Account not found')) {
        toast.info('Creating Soroban account...');
        try {
          // Create the account using Friendbot
          const response = await fetch(
            `https://friendbot-futurenet.stellar.org/?addr=${walletAddress}`
          );
          if (!response.ok) {
            throw new Error('Failed to create account');
          }
          toast.success('Account created successfully!');
          
          // Try submitting work again after account creation (with just participant and workId)
          const res1Retry = await submitWork(walletAddress, work?.workId);
          if (res1Retry) {
            toast.error('Failed to submit to bounty even after account creation!');
            return;
          }
        } catch (createError) {
          toast.error('Failed to create account: ' + createError.message);
          return;
        }
      } else {
        toast.error('Failed to submit work: ' + error.message);
        return;
      }
    }

    // If blockchain submission succeeded, submit to backend
    try {
      console.log('Attempting to submit work to backend...');
      console.log('Backend parameters:', {
        walletAddress,
        workId: work?.workId,
        title,
        description,
        gitHub,
        bountyId: bounty?.bountyId
      });

      const res2 = await submitWorkB(walletAddress, work?.workId, title, description, gitHub, bounty?.bountyId);
      console.log('Backend submission result:', res2);

      if (res2 && typeof res2 === 'object' && res2.error) {
        toast.error('Backend error: ' + res2.error);
        return;
      } else if (res2) {
        toast.error('Failed to submit work to backend!');
        console.error('Backend submission failed with result:', res2);
        return;
      }
    } catch (error) {
      console.error('Backend submission error:', error);
      toast.error('Backend error: ' + error.message);
      return;
    }

    toast('Successfully submitted work!');

    nav('/InProgress/');
  }, [isConnected, walletAddress, work, gitHub]);

  return (
    <div className='full-container'>
      <div className='container'>
        <MainHeader />
        <div className='bounty-listing-container'>
          <Subheader />
          <BackButton to='/InProgress' />
          <div className='app-header px-0 xsm:items-start xl:items-center xsm:flex-col'>
            <div className='app-title'>
              <p className='text-[40px] sm:text-center text-white pt-3'>{bounty?.title}</p>
            </div>
          </div>
          {IsSmMobile() ? (
            <InBountyListingBody bounty={bounty} callback={handleDrawerOpen} />
          ) : (
            <Scrollbars id='body-scroll-bar' autoHide style={{ height: '100%' }}
              renderThumbVertical={({ style, ...props }) =>
                <div {...props} className={'thumb-horizontal'} />
              }>
              <InBountyListingBody bounty={bounty} callback={handleDrawerOpen} />
            </Scrollbars>
          )}
        </div>
      </div>
      <HelpButton />
      <Drawer anchor='right' className='w-full' open={drawerOpen} onClose={handleDrawerClose}>
        <button onClick={handleDrawerClose}>
          <div className='flex gap-2'>
            <span className='text-xl'><i className='fa fa-angle-left' /></span>
            <span className='text-xl'>Back</span>
          </div>
        </button>
        {!isConnected && (<WarningMsg msg='You need to connect your wallet in order to submit a work.'/>)}
        <div className='mt-3 text-[20px] font-bold'>
          <span>Bounty Listing / Submit Work</span>
        </div>
        <div className='input-form-control mt-3'>
          <label className='input-label'>Title</label>
          <div className='input-control'>
            <input type='text' name='title' value={title} className='input-main' onChange={onChangeTitle} />
          </div>
        </div>
        <div className='input-form-control mt-3'>
          <label className='input-label'>Description</label>
          <div className='input-control h-auto'>
            <textarea type='text' name='description' value={description} className='input-main' onChange={onChangeDescription} />
          </div>
        </div>
        <div className='input-form-control mt-3'>
          <label className='input-label'>Github Link</label>
          <div className='input-control'>
            <input type='text' name='gitHub' value={gitHub} className='input-main' onChange={onChangeGitHub} />
          </div>
        </div>
        <div className='input-form-control mt-3'>
          <div className='input-control w-1/2 border-0'>
            <button className='input-main btn-hover' onClick={onSubmitClicked}>Submit Work</button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default InBountyListing;
