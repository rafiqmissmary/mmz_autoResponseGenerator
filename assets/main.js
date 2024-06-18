const client = ZAFClient.init();



async function getTicketReply(){
    const ticketChannel = await client.get("ticket.via.channel");
    const reply = document.getElementById("reply_new");
    let text = reply.innerText;
    console.log(text, 'text before');
    //text = text.replace(/<br>/g, '\n\n');
    if(ticketChannel['ticket.via.channel'] != 'fb_private_message'){
      text = text.replace(/\n/g, '<br>');
    }
    console.log(text, 'text');
    client.invoke('comment.appendHtml', text);
    client.invoke('hide');
    client.invoke('show');
}



client.on("pane.activated", async () => {
  client.invoke("resize", { width: "600px", height: "800px" });
  getTicketSummary();
});

client.on("app.registered", async () => {
  client.invoke("resize", { width: "100%", height: "800px" });
  getTicketSummary();
});

async function getTicketSummary() {
  const ticketReplyNew = await client.get("ticket.customField:custom_field_19341780814482");
  document.getElementById("reply_new").innerText = ticketReplyNew["ticket.customField:custom_field_19341780814482"];
}

async function refreshAns(){
  document.getElementById("reply_new").innerText = "Loading...";
  document.querySelector('#refreshbtn').disabled = true;
  document.getElementById('pbtn').style.display = 'none';
  let ticketId = await client.get("ticket.id");
  ticketId = ticketId["ticket.id"];
  let ticketRequesterEmail = await client.get("ticket.requester.email");
  ticketRequesterEmail = ticketRequesterEmail["ticket.requester.email"] ?? '';
  let ticketRequesterName = await client.get("ticket.requester.name");
  ticketRequesterName = ticketRequesterName["ticket.requester.name"];

  let currentUserEmail = await client.get("currentUser.email");
  currentUserEmail = currentUserEmail["currentUser.email"];
  let currentUserName = await client.get("currentUser.name");
  currentUserName = currentUserName["currentUser.name"];
  var options = {
    url: 'https://mm-zendesk-chat.azurewebsites.net:443/api/SuggestedReply/triggers/When_a_HTTP_request_is_received/invoke?api-version=2022-05-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=-f1bnrXhJ6Gpd2zmH28079nuYWz1iFCnRUK_7u64kL4',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      id: ticketId,
      requester: {
        name: ticketRequesterName,
        email: ticketRequesterEmail
      },
      currentUser: {
        name: currentUserName,
        email: currentUserEmail
      }
    })
  };
  const response = await client.request(options);
  await new Promise(resolve => setTimeout(resolve, 30000));
  document.getElementById('pbtn').style.display = 'block';
  document.querySelector('#refreshbtn').disabled = false;
  console.log(response,'response from logic app')
}

async function updateAndRefresh() {
  await refreshAns();
  getTicketSummary();
}
async function refreshCustomFields(){
  document.querySelector('#refreshFieldsbtn').disabled = true;


  let ticketRequesterEmail = await client.get("ticket.requester.email");
  ticketRequesterEmail = ticketRequesterEmail["ticket.requester.email"];

  var options = {
    url: 'https://mm-zendesk-chat.azurewebsites.net:443/api/orderinfobyidoremail/triggers/When_a_HTTP_request_is_received/invoke?api-version=2022-05-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=QLPREiVf30bHHlogQjtyH6_l3AfGMztAAVGuTnZTLnE',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      ordernumberoremail: ticketRequesterEmail
    })
  };
  const response = await client.request(options);
  console.log(response, 'response')
  await client.set("ticket.customField:custom_field_17644429567122", response.orderNumber);
  await client.set("ticket.customField:custom_field_17644490468242", response.orderDate);
  await client.set("ticket.customField:custom_field_17644531581714", response.orderStatus);
  await client.set("ticket.customField:custom_field_17644519781394", response.msgShippmentCount);
  await client.set("ticket.customField:custom_field_17644521821970", response.msgTrackingNumber1);
  await client.set("ticket.customField:custom_field_17644523521554", response.msgTrackingLastStatus1);
  await client.set("ticket.customField:custom_field_17644556348946", response.msgTrackingNumber2);
  await client.set("ticket.customField:custom_field_17644521821970", response.msgTrackingLastStatus2);

  await client.set("ticket.customField:custom_field_17667619230226", response.msgShippmentDate1);
  await client.set("ticket.customField:custom_field_17667620570770", response.msgShippmentDate2);

  document.querySelector('#refreshFieldsbtn').disabled = false;

}