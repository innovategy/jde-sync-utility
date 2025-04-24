import { JDEConnectionService } from '../services/JDEConnectionService';
import { error } from '../utils/logger';

/**
 * Fetches mailing info for a vendor from F0116 by address number.
 */
export async function getVendorMailingInfo(addressNumber: string): Promise<any> {
  const jde = new JDEConnectionService();
  await jde.authenticate();
  const params = new URLSearchParams({
    '$filter': `F0116.AN8 EQ ${addressNumber}`,
    '$limit': '10',
    '$token': jde.getToken()!
  });
  try {
    const response = await jde.getAxiosInstance().get(`/v2/dataservice/table/F0116?${params.toString()}`, {
      headers: { Authorization: `Bearer ${jde.getToken()}` }
    });
    return response.data;
  } catch (err: any) {
    if (err?.response) {
      error('Failed to fetch vendor mailing info:', err.response.status, err.response.data);
    } else {
      error('Failed to fetch vendor mailing info:', err?.message || err);
    }
    throw err;
  }
}

/**
 * Fetches phone numbers for a vendor from F0115 by address number.
 */
export async function getVendorPhones(addressNumber: string): Promise<any> {
  const jde = new JDEConnectionService();
  await jde.authenticate();
  const params = new URLSearchParams({
    '$filter': `F0115.AN8 EQ ${addressNumber}`,
    '$limit': '10',
    '$token': jde.getToken()!
  });
  try {
    const response = await jde.getAxiosInstance().get(`/v2/dataservice/table/F0115?${params.toString()}`, {
      headers: { Authorization: `Bearer ${jde.getToken()}` }
    });
    return response.data;
  } catch (err: any) {
    if (err?.response) {
      error('Failed to fetch vendor phone numbers:', err.response.status, err.response.data);
    } else {
      error('Failed to fetch vendor phone numbers:', err?.message || err);
    }
    throw err;
  }
}

/**
 * Fetches supplier master data for a vendor from F0401 by address number.
 */
export async function getSupplierMasterData(addressNumber: string): Promise<any> {
  const jde = new JDEConnectionService();
  await jde.authenticate();
  const params = new URLSearchParams({
    '$filter': `F0401.AN8 EQ ${addressNumber}`,
    '$limit': '10',
    '$token': jde.getToken()!
  });
  try {
    const response = await jde.getAxiosInstance().get(`/v2/dataservice/table/F0401?${params.toString()}`, {
      headers: { Authorization: `Bearer ${jde.getToken()}` }
    });
    return response.data;
  } catch (err: any) {
    if (err?.response) {
      error('Failed to fetch supplier master data:', err.response.status, err.response.data);
    } else {
      error('Failed to fetch supplier master data:', err?.message || err);
    }
    throw err;
  }
}

/**
 * Fetches supplier performance data for a vendor from F43230 by address number.
 */
export async function getSupplierPerformance(addressNumber: string): Promise<any> {
  const jde = new JDEConnectionService();
  await jde.authenticate();
  const params = new URLSearchParams({
    '$filter': `F43230.AN8 EQ ${addressNumber}`,
    '$limit': '10',
    '$token': jde.getToken()!
  });
  try {
    const response = await jde.getAxiosInstance().get(`/v2/dataservice/table/F43230?${params.toString()}`, {
      headers: { Authorization: `Bearer ${jde.getToken()}` }
    });
    return response.data;
  } catch (err: any) {
    if (err?.response) {
      error('Failed to fetch supplier performance data:', err.response.status, err.response.data);
    } else {
      error('Failed to fetch supplier performance data:', err?.message || err);
    }
    throw err;
  }
}

/**
 * Aggregates full vendor profile from multiple JDE tables by address number.
 */
export async function getVendorFullProfile(addressNumber: string): Promise<any> {
  const [mailing, phones, master, performance] = await Promise.all([
    getVendorMailingInfo(addressNumber),
    getVendorPhones(addressNumber),
    getSupplierMasterData(addressNumber),
    getSupplierPerformance(addressNumber)
  ]);
  return {
    addressNumber,
    mailing: mailing?.rowset || mailing?.fs_DATABROWSE_F0116?.data?.gridData?.rowset || [],
    phones: phones?.rowset || phones?.fs_DATABROWSE_F0115?.data?.gridData?.rowset || [],
    master: master?.rowset || master?.fs_DATABROWSE_F0401?.data?.gridData?.rowset || [],
    performance: performance?.rowset || performance?.fs_DATABROWSE_F43230?.data?.gridData?.rowset || []
  };
}
