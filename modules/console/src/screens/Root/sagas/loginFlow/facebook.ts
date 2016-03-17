import * as Promise from 'bluebird';
declare const FB;

interface RetrieveTokenResult {
  token: string;
}

function handleResponse(response): RetrieveTokenResult {
  if (response.status !== 'connected') { return; }
  return { token: response.authResponse.accessToken };
}

async function getLoginStatus() {
  const response = await new Promise(resolve => FB.getLoginStatus(resolve));
  return handleResponse(response);
}

async function login() {
  const response = await new Promise(resolve => FB.login(resolve));
  return handleResponse(response);
}

export async function retrieveToken() {
  const result = await getLoginStatus();
  if (result) { return result; }
  return await login();
}
