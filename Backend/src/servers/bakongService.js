import axios from 'axios';
import config from '../config/bakong.config';
import logger from '../utils/logger';

const RC = { SUCCESS: 0, FAILED: 1 };

/* Create an Axios client with bakong specific configuration */
function createClient(){
    return axios.create({
        baseURL: config.bakong.apiUrl,
        headers:{
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.bakong.token}`,
        },
        timeout: 10000, // 10 seconds timeout
    });
}


/* Map bakong API response to a standard response format */
function mapResponse(data){
    if(data.responseCode === RC.SUCCESS){
        return {
            found: true,
            status: 'SUCCESS',
            data: data.data
        }
    }

    const msg = (data.responseMessage || '').toLowerCase();
    if(msg.includes('Not found') || msg.includes('Could not be found')){
        return{
            found: false,
            status: 'NOT_FOUND',
            data: null
        }
    }

    return{
        found: false,
        status: 'FAILED',
        data: null
    }
}


/* Handle API errors and if unauthorized status */
function handleError(err){
    if(err.response?.status === 401){
        throw new Error('Bakong API unauthorized, Please check token again!');
    }
    
    if(err.response){
        logger.warn('Bakong API error response',{status: err.response.status});
        return {
            found: false,
            status: 'NOT_FOUND',
            data: null
        }
    }
    throw new Error(`Bakong API unerachable: ${err.message}`);
}

/**
 * 
 * Public API export
 * @check_transaction_by_md5
 */

export async function checkByMd5(md5Hash) {
    logger.info('Bakong API check_transaction_by_md5', {md5Hash});

    try {
        /* Create a axios server */
        const client = createClient();
        const data = await client.post('/v1/check_transaction_by_md5', {md5: md5Hash});

        /* For check if transaction exist or not */
        const result = mapResponse(data);  

        logger.info('Bakong API response', {status: result.status});
        return result;
    } catch (error) {
        
        /* Handle api if error */
        return handleError(error); 
    }
}


/* checkByHash */
export async function checkByHash(hash) {
    logger.info('Bakong API check_transaction_by_hash', {hash});

    try {
        const client = createClient();
        const data = await client.post('/v1/check_transaction_by_hash', {hash});
        return mapResponse(data);
    } catch (error) {
        return handleError(error);
    }
}


/* Start polling interval to check for transaction success */
export function startPolling(md5Hash, expiresAt, onResult, intervalMs = config.bakong.pollIntervalMs){
    const expireTime = expiresAt ? new Date(expiresAt).getTime() : Infinity;

    const timer = setInterval(async() =>{
        try {
            if(Date.now() > expireTime){
                clearInterval(timer);
                
                /* check of qr expired fail */
                logger.info('Polling QRCode expried', {md5Hash})
                return onResult('TIMEOUT', null);
            }

            const result = await checkByMd5(md5Hash);

            if(result.status === 'SUCCESS'){
                clearInterval(timer);
                return onResult('SUCCESS', result.data); 
            }
            if(result.status === 'FAILED'){
                clearInterval(timer);
                return onResult('FAILED', null);
            }
        } catch (error) {
            logger.error('Polling error', {error: error.message});
        }
    }, intervalMs);
    return timer;
}
