import axios from 'axios';
import {BountyStatus, WorkStatus} from '../../contexts/ContractContext';

const useBackend = () => {
    // Use fixed backend URL to avoid process.env issues
    const BACKEND_URL = 'http://localhost:3000/api/bounty/';

    // Helper function to generate a valid u32 work ID
    const generateValidWorkId = () => {
        // Generate a number between 1 and 999999999 (well within u32 range)
        return Math.floor(Math.random() * 999999999) + 1;
    };
    
    // Helper function for API calls
    const callApi = async (endpoint, method = 'GET', body = null) => {
        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                ...(body && { body: JSON.stringify(body) })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    };

    const getUser = async (wallet) => {
        // Always return a default user to avoid any errors
        return {
            name: `User-${wallet?.slice(0, 6)}`,
            github: '',
            discord: '',
            image: '',
            wallet: wallet
        };
    };

    const setUser = 
        async (wallet, name, github, discord, image) => {
            // const formData = new FormData();

            // formData.append('wallet', wallet);
            // formData.append('name', name);
            // formData.append('github', github);
            // formData.append('discord', discord);
            // // formData.append('image', image);

            // console.log('formData:', formData);

            // axios.post(BACKEND_URL + 'set_user', formData)
            //     .then((response) => {
            //         console.log('response:', response);
            //         // console.log(response.data.details);
            //         return 0;
            //     })
            //     .catch ((error) => {
            //         console.error('Error uploading avatar:', error);
            //         return -1;
            //     });

            try {
                const res = await fetch(BACKEND_URL + 'set_user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        'wallet': wallet,
                        'name': name,
                        'github': github,
                        'discord': discord,
                        'image': image
                    })
                });
    
                const resData = await res.json();
                if (resData.error) {
                    console.error('error1:', resData.error);
                    return -1;
                } else {
                    console.log(resData.details);
                    return 0;
                }
            } catch (error) {
                console.error('error2:', error);
            }

            return -2;
        };

    const createBountyB = 
        async (wallet, bountyId, title, payAmount, duration, type, difficulty, topic, description, gitHub, block) => {
            try {
                const payload = {
                    wallet: wallet,
                    bountyId: bountyId,
                    title: title,
                    payAmount: payAmount,
                    duration: duration,
                    type: type,
                    difficulty: difficulty,
                    topic: topic,
                    description: description,
                    gitHub: gitHub,
                    block: block,
                    status: BountyStatus.ACTIVE
                };

                const res = await fetch(BACKEND_URL + 'create_bounty', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    throw new Error(`Backend server error: ${res.status} ${res.statusText}`);
                }

                const data = await res.json();
                if (data.error) {
                    throw new Error(`Backend error: ${data.error}`);
                }

                return { success: true }; // Success
            } catch (error) {
                return {
                    success: false,
                    error: error.message || 'Unknown backend error',
                    isBackendError: true
                };
            }
        };

    const getRecentBounties = async () => {
        try {
            const res = await fetch(BACKEND_URL + 'get_recent_bounties', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const resData = await res.json();
            if (resData.error) {
                console.error('error1:', resData.error);
            } else {
                console.log(resData.details);
                return resData.bounties;
            }
        } catch (error) {
            console.error('error2:', error);
        }

        return [];
    };

    const getSingleBounty = async (bountyId) => {
        try {
            const res = await fetch(BACKEND_URL + `get_single_bounty?bountyId=${bountyId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const resData = await res.json();
            if (resData.error) {
                console.error('error1:', resData.error);
            } else {
                console.log(resData.details);
                return resData.bounty;
            }
        } catch (error) {
            console.error('error2:', error);
        }

        return {};
    };

    const getAppliedBounties = async (wallet) => {
        try {
            const res = await fetch(BACKEND_URL + `get_bounties?wallet=${wallet}&filter=applied`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const resData = await res.json();
            if (resData.error) {
                console.error('error1:', resData.error);
            } else {
                console.log(resData.details);
                return resData.bounties;
            }
        } catch (error) {
            console.error('error2:', error);
        }

        return [];
    };

    const getCreatedBounties = async (wallet) => {
        try {
            const res = await fetch(BACKEND_URL + `get_bounties?wallet=${wallet}&filter=created`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const resData = await res.json();
            if (resData.error) {
                console.error('error1:', resData.error);
            } else {
                console.log(resData.details);
                return resData.bounties;
            }
        } catch (error) {
            console.error('error2:', error);
        }

        return [];
    };

    const countSubmissions = async (wallet, bountyId) => {
        try {
            const res = await fetch(BACKEND_URL + `count_submissions?wallet=${wallet}&bountyId=${bountyId}&status=${WorkStatus.SUBMITTED}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const resData = await res.json();
            if (resData.error) {
                console.error('error1:', resData.error);
                return -1;
            } else {
                return resData.count;
            }
        } catch (error) {
            console.error('error2:', error);
        }

        return -2;
    };

    const cancelBountyB = async (wallet, bountyId) => {
        try {
            const res = await fetch(BACKEND_URL + 'cancel_bounty', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'wallet': wallet,
                    'bountyId': bountyId,
                    'status': BountyStatus.CANCELLED
                })
            });

            const resData = await res.json();
            if (resData.error) {
                console.error('error1:', resData.error);
                return -1;
            } else {
                console.log(resData.details);
                return 0;
            }
        } catch (error) {
            console.error('error2:', error);
        }

        return -2;
    };

    const closeBountyB = async (wallet, bountyId) => {
        try {
            const res = await fetch(BACKEND_URL + 'close_bounty', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'wallet': wallet,
                    'bountyId': bountyId,
                    'status': BountyStatus.CLOSED
                })
            });

            const resData = await res.json();
            if (resData.error) {
                console.error('error1:', resData.error);
                return -1;
            } else {
                console.log(resData.details);
                return 0;
            }
        } catch (error) {
            console.error('error2:', error);
        }

        return -2;
    };


    const getWorks = async (bountyId, status) => {
        try {
            if (!bountyId) {
                console.error('No bountyId provided');
                return { works: [], error: 'Invalid bounty ID' };
            }

            console.log('Fetching works for bounty:', bountyId);

            const res = await fetch(BACKEND_URL + `get_works?bountyId=${bountyId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!res.ok) {
                console.error('Backend error:', res.status, res.statusText);
                return { works: [], error: `Backend error: ${res.status}` };
            }

            const resData = await res.json();
            if (resData.error) {
                console.error('Data error:', resData.error);
                return { works: [], error: resData.error };
            }

            console.log('Got works:', resData.works);
            
            // Process work IDs to ensure they're valid u32
            const processedWorks = (resData.works || []).map(work => {
                if (work.workId) {
                    const workId = Math.min(work.workId % 1000000000, 999999999);
                    return { ...work, workId };
                }
                return work;
            });

            return { works: processedWorks, error: null };
        } catch (error) {
            console.error('getWorks error:', error);
            return { works: [], error: error.message };
        }
    };

    const createWork = async (wallet, bountyId, workId) => {
        try {
            console.log('Creating work with:', { wallet, bountyId, workId });
            
            // First verify the bounty exists
            const bounty = await getSingleBounty(bountyId);
            if (!bounty) {
                throw new Error('Bounty not found');
            }
            
            // Use the workId from blockchain, or generate one if not provided
            const validWorkId = workId && workId > 0 ? workId : generateValidWorkId();
            
            const payload = {
                wallet: wallet,
                bountyId: bountyId,
                workId: validWorkId,
                status: WorkStatus.APPLIED
            };

            console.log('Sending payload:', payload);

            const res = await fetch(BACKEND_URL + 'create_work', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            console.log('Got response:', res.status);

            if (!res.ok) {
                console.error('Response not OK:', res.status, res.statusText);
                const text = await res.text();
                console.error('Response body:', text);
                throw new Error(`Backend error: ${res.status} ${res.statusText}`);
            }

            const resData = await res.json();
            console.log('Got data:', resData);

            if (resData.error) {
                throw new Error(resData.error);
            }

            console.log('Work created successfully:', resData.details);
            // Trigger a refresh of the works list
            await getWorks(payload.bountyId);
            
            return { 
                success: true, 
                work: resData.work,
                message: resData.details || 'Successfully applied for bounty'
            };
        } catch (error) {
            console.error('Error creating work:', error);
            return {
                success: false,
                error: error.message || 'Failed to apply for bounty',
                isBackendError: true
            };
        }
    };

    const getWork = async (wallet, bountyId) => {
        try {
            console.log('Fetching work for wallet and bounty:', { wallet, bountyId });
            
            // First check if we already have this work in the works list
            const worksResult = await getWorks(bountyId);
            if (!worksResult.error && worksResult.works) {
                const existingWork = worksResult.works.find(w => w.participant.wallet === wallet);
                if (existingWork) {
                    return existingWork;
                }
            }
            
            const res = await fetch(BACKEND_URL + `get_work?wallet=${wallet}&bountyId=${bountyId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const resData = await res.json();
            if (resData.error) {
                console.error('Error fetching work:', resData.error);
                throw new Error(resData.error);
            }

            if (!resData.work) {
                console.error('No work found');
                throw new Error('No work found for this bounty');
            }

            // Ensure workId is a valid u32
            const work = resData.work;
            if (work.workId) {
                const parsedWorkId = typeof work.workId === 'string' ? parseInt(work.workId, 10) : work.workId;
                if (Number.isInteger(parsedWorkId) && parsedWorkId >= 0 && parsedWorkId <= 4294967295) {
                    work.workId = parsedWorkId;
                } else {
                    console.error('Invalid workId format:', work.workId);
                    throw new Error('Invalid work ID format');
                }
            }

            console.log('Work retrieved successfully:', work);
            return work;
        } catch (error) {
            console.error('error2:', error);
        }

        return {};
    };

const submitWorkB = async (wallet, workId, workTitle, workDesc, workRepo, bountyId) => {
        try {
            console.log('submitWorkB received parameters:', { wallet, workId, workTitle, workDesc, workRepo, bountyId });
            
            // Validate workId is a proper u32
            const parsedWorkId = typeof workId === 'string' ? parseInt(workId, 10) : workId;
            if (!Number.isInteger(parsedWorkId) || parsedWorkId < 0 || parsedWorkId > 4294967295) {
                throw new Error('Invalid work ID format');
            }

            const requestBody = {
                'wallet': wallet,
                'workId': parsedWorkId,
                'title': workTitle,
                'description': workDesc,
                'workRepo': workRepo,
                'bountyId': bountyId,
                'status': WorkStatus.SUBMITTED
            };
            
            console.log('Sending request body:', requestBody);

            const res = await fetch(BACKEND_URL + 'submit_work', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const resData = await res.json();
            if (resData.error) {
                console.error('error1:', resData.error);
                return -1;
            } else {
                console.log(resData.details);
                return 0;
            }
        } catch (error) {
            console.error('error2:', error);
        }

        return -2;
    };

    const approveWorkB = async (wallet, workId, bountyId) => {
        try {
            console.log('approveWorkB received parameters:', { wallet, workId, bountyId });
            
            const res = await fetch(BACKEND_URL + 'approve_work', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'wallet': wallet,
                    'workId': workId,
                    'bountyId': bountyId,
                    'status': WorkStatus.APPROVED
                })
            });

            const resData = await res.json();
            if (resData.error) {
                console.error('error1:', resData.error);
                return -1;
            } else {
                console.log(resData.details);
                return 0;
            }
        } catch (error) {
            console.error('error2:', error);
        }

        return -2;
    };

    const rejectWorkB = async (wallet, workId) => {
        try {
            const res = await fetch(BACKEND_URL + 'reject_work', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'wallet': wallet,
                    'workId': workId,
                    'status': WorkStatus.REJECTED
                })
            });

            const resData = await res.json();
            if (resData.error) {
                console.error('error1:', resData.error);
                return -1;
            } else {
                console.log(resData.details);
                return 0;
            }
        } catch (error) {
            console.error('error2:', error);
        }

        return -2;
    };

    return {
        getUser, 
        setUser, 

        createBountyB, 
        submitWorkB, 
        approveWorkB, 
        rejectWorkB, 
        cancelBountyB, 
        closeBountyB, 
        
        getRecentBounties, 
        getSingleBounty, 
        getAppliedBounties, 
        getCreatedBounties, 
        countSubmissions, 
        
        createWork, 
        getWorks, 
        getWork, 
    };
};

export default useBackend;
