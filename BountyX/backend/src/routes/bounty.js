const { Router } = require('express');
const { getUser, setUser } = require('../user');
const { createBounty, getRecentBounties, getBounties, getSingleBounty, cancelBounty, closeBounty } = require('../bounty');
const { createWork, getWorks, getWork, submitWork, countSubmissions, approveWork, rejectWork } = require('../work');

const router = Router();

async function getOrCreateUser(wallet) {
    let user = await getUser(wallet);
    if (user === null) {
        await setUser(wallet, `User-${wallet.slice(0, 6)}`, '', '', '');
        user = await getUser(wallet);
    }
    return user;
}


router.get('/get_user', async (request, response) => {
    const query = request.query;
    const user = await getOrCreateUser(query.wallet);
    response.send({ 
        status: 'success', 
        details: `${user.name ? user.name : user.wallet}: successfully got info`, 
        user 
    });
});

router.post('/set_user', async (request, response) => {
    const query = request.body;

    try {
        const res = await setUser(query.wallet, 
            query.name, 
            query.github, 
            query.discord, 
            query.avatar);
        response.send({ status: 'success', 
            details: `${query.name ? query.name : query.wallet} ${res === true ? 'successfully set' : 'failed to set'} info` });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});


router.post('/create_bounty', async (request, response) => {
    const query = request.body;
    const creator = await getOrCreateUser(query.wallet);

    try {
        const startDate = Date.now();
        const added = await createBounty(creator._id, 
            query.bountyId, query.title, query.payAmount, 
            startDate, startDate + query.duration * 1000, 
            query.type, query.difficulty, query.topic, 
            query.description, query.gitHub, 
            query.block, query.status);
        response.send({ status: 'success', 
            details: `${creator.name ? creator.name : creator.wallet} ${added === true ? 'successfully created' : 'failed to create'} bounty` });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});

router.get('/get_recent_bounties', async (request, response) => {
    try {
        const bounties = await getRecentBounties();
        response.send({ status: 'success', details: `${bounties?.length} recent bounties`, bounties: bounties });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});

router.get('/get_bounties', async (request, response) => {
    const query = request.query;

    let user = await getUser(query.wallet);
    if (user === null) {
        // If user doesn't exist, create one automatically
        await setUser(
            query.wallet,
            `User-${query.wallet.slice(0, 6)}`, // Default name
            '', // github
            '', // discord
            ''  // avatar
        );
        user = await getUser(query.wallet);
    }
    if (user === null) {
        response.send({ status: 'failed', error: `Invalid wallet` });
        return;
    }

    try {
        const bounties = await getBounties(query.filter, query.param, user);
        response.send({ status: 'success', details: `${bounties?.length} bounties`, bounties: bounties });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});

router.get('/get_single_bounty', async (request, response) => {
    try {
        const bounty = await getSingleBounty(request.query.bountyId);
        if (bounty === null) throw new Error('Not found');
        response.send({ status: 'success', details: `Found`, bounty: bounty });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});

router.post('/cancel_bounty', async (request, response) => {
    const query = request.body;
    const creator = await getOrCreateUser(query.wallet);

    try {
        const res = await cancelBounty(query.bountyId);
        response.send({ status: 'success', 
            details: `${creator.name ? creator.name : creator.wallet} ${res === true ? 'successfully cancelled' : 'failed to cancel'} bounty${query.bountyId}` });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});

router.post('/close_bounty', async (request, response) => {
    const query = request.body;
    const creator = await getOrCreateUser(query.wallet);

    try {
        const res = await closeBounty(query.bountyId);
        response.send({ status: 'success', 
            details: `${creator.name ? creator.name : creator.wallet} ${res === true ? 'successfully closed' : 'failed to close'} bounty${query.bountyId}` });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});


router.post('/create_work', async (request, response) => {
    const query = request.body;
    const user = await getOrCreateUser(query.wallet);

    const bounty = await getSingleBounty(query.bountyId);
    if (bounty === null) {
        response.send({ status: 'failed', error: `Invalid bounty id!` });
        return;
    }

    try {
        const applyDate = Date.now();
        const res = await createWork(user, bounty, query.workId, applyDate, query.status);
        response.send({ status: 'success', 
            details: `${user.name ? user.name : user.wallet} ${res === true ? 'successfully created' : 'failed to created'} work${query.workId}` });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});

router.get('/get_works', async (request, response) => {
    const bounty = await getSingleBounty(request.query.bountyId);
    if (bounty === null) {
        response.send({ status: 'failed', error: `Invalid bounty id!` });
        return;
    }

    try {
        const works = await getWorks(bounty._id);
        response.send({ status: 'success', details: `${works?.length} works`, works: works });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});

router.get('/get_work', async (request, response) => {
    const query = request.query;
    const user = await getOrCreateUser(query.wallet);

    const bounty = await getSingleBounty(query.bountyId);
    if (bounty === null) {
        response.send({ status: 'failed', error: `Invalid bounty id!` });
        return;
    }

    try {
        const work = await getWork(user, bounty);
        if (work === null) throw new Error('Not found');
        response.send({ status: 'success', details: `Found`, work: work });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});

router.post('/submit_work', async (request, response) => {
    const query = request.body;
    const user = await getOrCreateUser(query.wallet);

    try {
        // Get the bounty to find the work properly
        const bounty = await getSingleBounty(query.bountyId);
        if (bounty === null) {
            response.send({ status: 'failed', error: `Invalid bounty id!` });
            return;
        }

        const res = await submitWork(user, query.workId, query.title, query.description, query.workRepo, Date.now(), query.status, bounty);
        response.send({ status: 'success', 
            details: `${user.name ? user.name : user.wallet} ${res === true ? 'successfully submitted' : 'failed to submit'} work${query.workId}` });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});

router.get('/count_submissions', async (request, response) => {
    const query = request.query;
    const user = await getOrCreateUser(query.wallet);

    const bounty = await getSingleBounty(query.bountyId);
    if (bounty === null) {
        response.send({ status: 'failed', error: `Failed to get bounty` });
        return;
    }

    try {
        const count = await countSubmissions(bounty._id, query.status);
        response.send({ status: 'success', count: count });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});

router.post('/approve_work', async (request, response) => {
    const query = request.body;
    console.log('approve_work route received:', query);
    
    const user = await getOrCreateUser(query.wallet);
    console.log('User found/created:', user._id);

    try {
        // Get the bounty to find the work properly
        const bounty = await getSingleBounty(query.bountyId);
        console.log('Bounty found:', bounty ? bounty._id : 'Not found');
        
        if (bounty === null) {
            response.send({ status: 'failed', error: `Invalid bounty id!` });
            return;
        }

        const res = await approveWork(user, query.workId, query.status, bounty);
        response.send({ status: 'success', 
            details: `${user.name ? user.name : user.wallet} ${res === true? 'successfully approved': 'failed to approve'} work${query.workId}` });
    } catch (err) {
        console.log('Error in approve_work route:', err.message);
        response.send({ status: 'failed', error: err.message });
    }
});

router.post('/reject_work', async (request, response) => {
    const query = request.body;

    const user = await getUser(query.wallet);
    if (user === null) {
        response.send({ status: 'failed', error: `You didn't login or you're an invalid user!` });
        return;
    }

    try {
        const res = await rejectWork(user, query.workId, query.status);
        response.send({ status: 'success', 
            details: `${user.name ? user.name : user.wallet} ${res === true ? 'successfully rejected' : 'failed to reject'} work${query.workId}` });
    } catch (err) {
        response.send({ status: 'failed', error: err.message });
    }
});

module.exports = router;
