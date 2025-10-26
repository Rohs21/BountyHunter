const WorkModel = require('../models/work');
const { addLog } = require('../log');

async function createWork(user, bounty, workId, applyDate, status) {
    await bounty.populate('creator');
    if (bounty.creator._id === user._id) {
        throw new Error(`Can't apply to self-created bounty`);
    }

    const fWork = await WorkModel.findOne({participant: user._id, bounty: bounty._id});
    if (fWork !== null) {
        throw new Error(`Already created work`);
    }

    const newWork = new WorkModel({
        workId: workId,
        participant: user._id,
        bounty: bounty._id,
        applyDate: applyDate,
        status: status
    });

    await newWork.save();

    await addLog(user._id, applyDate, 'Apply', bounty._id, newWork._id, '');
    return true;
}

async function getWorks(bountyId) {
    const works = await WorkModel.find({bounty: bountyId}).populate('participant');
    return works;
}

async function getWork(user, bounty) {
    const works = await WorkModel.findOne({participant: user._id, bounty: bounty._id});
    return works;
}

async function submitWork(user, workId, title, description, workRepo, submitDate, newStatus, bounty) {
    // First try to find by workId
    let work = await WorkModel.findOne({workId: workId});
    
    // If not found by workId, try to find by user and bounty (fallback)
    if (work === null) {
        console.log('Work not found by workId, trying to find by user and bounty...');
        work = await WorkModel.findOne({participant: user._id, bounty: bounty._id});
        if (work) {
            console.log('Found work by user and bounty:', work);
        }
    }
    
    if (work === null) {
        throw new Error('Invalid Work');
    }
    
    work.title = title;
    work.description = description;
    work.workRepo = workRepo;
    work.submitDate = submitDate;
    work.status = newStatus;
    work.save();

    await addLog(user._id, submitDate, 'Submit', null, work._id, '');
    return true;
}

async function countSubmissions(bounty, countStatus) {
    return await WorkModel.countDocuments({bounty: bounty, status: countStatus});
}

async function approveWork(user, workId, newStatus, bounty) {
    console.log('approveWork called with:', { user: user._id, workId, newStatus, bounty: bounty?._id });
    
    // First try to find by workId
    let work = await WorkModel.findOne({workId: workId});
    console.log('Found work by workId:', work ? 'Yes' : 'No');
    
    // If not found by workId, try to find by user and bounty (fallback)
    if (work === null) {
        console.log('Work not found by workId in approveWork, trying to find by user and bounty...');
        console.log('Looking for work with participant:', user._id, 'and bounty:', bounty._id);
        work = await WorkModel.findOne({participant: user._id, bounty: bounty._id});
        if (work) {
            console.log('Found work by user and bounty in approveWork:', work);
        } else {
            console.log('No work found by user and bounty either');
        }
    }
    
    if (work === null) {
        console.log('No work found at all, throwing Invalid Work error');
        throw new Error('Invalid Work');
    }

    console.log('Updating work status to:', newStatus);
    work.status = newStatus;
    work.save();

    await addLog(user._id, Date.now(), 'Approve', null, work._id, '');
    return true;
}

async function rejectWork(user, workId, newStatus) {
    const work = await WorkModel.findOne({workId: workId});
    if (work === null) {
        throw new Error('Invalid Work');
    }

    work.status = newStatus;
    work.save();

    await addLog(user._id, Date.now(), 'Reject', null, work._id, '');
    return true;
}

module.exports = { createWork, getWorks, getWork, submitWork, countSubmissions, approveWork, rejectWork };
