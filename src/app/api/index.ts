import axios, { AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


const refreshToken = async (): Promise<string> => {
  try {
    const { data } = await axios.post(`${API_URL}/refresh-token`, {}, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    localStorage.setItem('accessToken', data.access_token);
    return data.access_token;
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    throw new Error('Could not refresh token.');
  }
}

const fetchWithToken = async (url: string, options: AxiosRequestConfig = {}): Promise<any> => {
  let accessToken = localStorage.getItem('accessToken') || '';
  
  axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  try {
    return await axios({ url, ...options });
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      try {
        accessToken = await refreshToken(); // Refresh the token
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        return await axios({ url, ...options }); // Retry the request
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        throw refreshError;
      }
    } else {
      throw error;
    }
  }
}

export const fetchData = async (url: string, options?: AxiosRequestConfig): Promise<any> => {
  try {
    const response = await fetchWithToken(`${API_URL}${url}`, options);
    return response.data;
  } catch (error: any) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export const login = async (email: string, password: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    const {access_token, refresh_token} = response.data
    
    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    
    return response.data
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
}