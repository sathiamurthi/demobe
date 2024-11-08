module.exports = async function (context, req) {
  context.log("JavaScript HTTP trigger function processed a request.");

  const axios = require("axios");

  let data = {
    client_id: client_id,
    client_secret: client_secret,
    refresh_token: refresh_token,
    grant_type: "refresh_token",
    scope: "offline_access openid",
  };

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: tokenEndpoint,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      responseMessage = JSON.stringify(response.data);
      console.log(`responseMessage: ${responseMessage}`);
      //console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
  if (responseMessage != "") {
    context.res = {
      // status: 200, /* Defaults to 200 */
      body: responseMessage,
    };
  }
};
