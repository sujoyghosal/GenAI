var myHeaders = new Headers();
myHeaders.append("uuid", "c1a45bD9-c867-6Ed5-7CBb-3AC5177dCd24");
myHeaders.append("organization-id", "<string>");
myHeaders.append("Accept-Language", "<string>");
myHeaders.append("activity-id", "<string>");
myHeaders.append("branch-organization-id", "<string>");
myHeaders.append("client-metadata", "<string>");
myHeaders.append("device-id", "<string>");
myHeaders.append("Accept", "application/json");
myHeaders.append("Cookie", "ak_bmsc=5EF4E57843D90DE10123658DA34BA9DA~000000000000000000000000000000~YAAQ94fTF2imLf2KAQAAwOQ+ExVMCWiJ2fvTzwWGwP0ifQI50voQv2VyDixUWlE0WonH2gQ/PygSAqj7EqTpcsL/c0mH22ZbRrkIgl3Vx57o7CSBEvs2VUH4q232IqQmPxfVjyLgPo2uLiFsDz+LcTpIgLgFNR2v1Z1tVKVAqQJIVFa8VogzzXrbsLRibTBvmiKX1G9HyBY/X8xgrGOOoOS5G3hbLy2Gpc+tSAHVrKuSJFvd9o8OVs1g6ZtQY/WJiSQaiNS+XDg3C9KylZh1ErxADObzo9M2dhjX8/6+el64voTgYhcZwLT9MYliQSZe3Bq6j2mCXOYS5k9Zo2YCrKghtX2b6MarNuv4YoRiUx4Q6ip2YCa17Z65JNFR5gfBpw==");

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
};

fetch("https://api-gw-uat.fisglobal.com/api/mbp-api/account/v2/customers/<string>/balances?applicationName=<string>&approvalStatus=Cancelled&cursorKey=<string>&fromDate=0093-02-31&toDate=2123-08-31&numberRecordsRequested=<long>&primaryStatus=Settled&processorName=<string>", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));