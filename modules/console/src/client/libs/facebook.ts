function getLoginStatus() {
  return new Promise(resolve => {
    FB.getLoginStatus(resolve);
  });
}

function login() {
  return new Promise(resolve => {
    FB.login(resolve);
  });
}

function handleResponse(response) {
  if (response.status !== 'connected') {
    return null;
  }
  return { token: response.authResponse.accessToken };
}

function retrieveToken() {
  return getLoginStatus().then(response => {
    const result = handleResponse(response);
    if (result) { return result; }
    return login().then(handleResponse);
  });
}

export default {
  retrieveToken,
}
