const client = ZAFClient.init();
let openAiModel;

client.metadata().then(metadata => {
  openAiModel = metadata?.settings?.openAiModel || 'gpt-4-turbo-preview';
});


const BASE_URL = 'https://asendiatracking.azurewebsites.net/api/';
const pathMap = {
  U: `${BASE_URL}postnordfull?code=tS1Hisghk0bmbjB38m1y816KH7PA0Qtt_rP99BtmG5LeAzFuF0VL9A%3D%3D&tracking=`,
  D: `${BASE_URL}dhlfull?code=tzT61L0Yd0lqz9cwyHPElFbEfwXbpkNw_N0tGUzZqtC5AzFuBmCeQw%3D%3D&trackingNumber=`,
  A: `${BASE_URL}asendiafull?code=bPjsoAjRnInqcqbd2IAZpSAmLTA2lMO-Xm7D9M4Tc-RkAzFuFeaSiA%3D%3D&tracking=`
};
const shippingTime = {
  SE:'Orders usually takes 5-7 working days to arrive.',
  AU: 'Orders usually takes 12-20 working days to arrive.',
  NZ: 'Orders usually takes 12-20 working days to arrive.',
  CA: 'Orders usually takes 15-20 working days to arrive.',
  DK: 'Orders usually takes 5-10 working days to arrive.',
  DE: 'Orders usually takes 3-8 working days to arrive.',
  ES: 'Orders usually takes 7-11 working days to arrive.',
  GB: 'Orders usually takes 7-11 working days to arrive.',
  FI: 'Orders usually takes 6-13 working days to arrive.',
  FR: 'Orders usually takes 4-9 working days to arrive.',
  NO: 'Orders usually takes 6-13 working days to arrive.',
  US: 'Orders usually takes 8-15 working days to arrive.'
}
const trackingUrl = {
  FI: 'https://www.posti.fi/fi/seuranta#/lahetys/',
  GB: 'https://www.royalmail.com/track-your-item#/tracking-results/',
  US: 'https://tools.usps.com/go/TrackConfirmAction?tRef=fullpage&tLc=2&text28777=%2C&tABt=false&tLabels=',
  BE: 'https://track.bpost.cloud/btr/web/#/search?lang=nl&itemCode=',
  FR: 'https://www.laposte.fr/outils/track-a-parcel?code=',
  SE: 'https://www.postnord.se/vara-verktyg/spara-brev-paket-och-pall?shipmentId=',
  NO: 'https://sporing.posten.no/sporing/',
  GB_ASENDIA: 'https://tracking.asendia.com/tracking/',
  FEDEX: 'http://www.fedex.com/Tracking?tracknumber_list=',
  DEFAULT: 'https://tracking.asendia.com/tracking/',
  DHL: 'https://www.dhl.com/se-en/home/tracking.html?tracking-id='
};
const contactNumber = {
    SE: '+4633222220',
    NZ: '+6492806315',
    DK: '+4589870625',
    AT: '+43720881572',
    IE: '+35319014611',
    FI: '+358942419003',
    GB: '+448000885708',
    US: 'Toll Free 18009324286',
    DE: 'Toll Free 08001833845',
    MX: 'Toll Free 8008720467',
    AU: 'Toll Free 1800425890',
    CH: '+56225814871',
    FR: '+33182880969',
    PT: '+351308801818',
    NL: '+31208087555',
    ES: '+34518890925',
    BE: '+3225880680'
}

const opt = {
    type: "GET",
    headers: {
        'Content-Type': "application/json",
    },
    accepts: "application/json",
    //secure: false,
    secure: true,
    };
async function getUserName() {
  const response = await client.get("currentUser.name");
  const name = response["currentUser.name"];
  return name;
}
async function updateSummary(customerOrder, cc) {
  const convo = await getTicketConvo();
  const prompt = await getPrompt(convo, customerOrder, cc);
  const summary = await getSummary(prompt);
  const container = document.getElementById("container");
  container.innerText = summary;
  document.getElementById("btnPostReply").style.display = "block";
}
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
    /*document.getElementById('pbtn').addEventListener('click', function(){
      document.getElementById('ember3295').style.display = 'block';
    });*/
}

async function getTicketConvo() {
  const ticketConvo = await client.get("ticket.conversation");
  let array = ticketConvo["ticket.conversation"];
  array = array.map(obj => {
    // Remove 'attachments', 'channel' properties
    const { attachments, channel, ...newObj } = obj;
    // Remove 'avatar' property from 'author' object
    if (newObj.author) {
      const { avatar, ...newAuthor } = newObj.author;
      newObj.author = newAuthor;
    }
    // Remove 'contentType' property from 'message' object and strip HTML tags from 'content'
    if (newObj.message) {
      const { contentType, ...newMessage } = newObj.message;
      if (newMessage.content) {
        newMessage.content = newMessage.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\n/g, ' ');
      }
      newObj.message = newMessage;
    }
    return newObj;
  });
  console.log(array, 'array');
  return JSON.stringify(array);
}

async function getPrompt(convo, customerOrder, cc) {
    const name = await getUserName();
    return [
        { role: "user", content: `Context: Please summarize this customer service interaction and suggest a response to the customer's question: ${convo}` },
        { role: "system", content: "Context: Although we don't have physical stores, we offer a fit guarantee, helpful customer service by phone, and you can shop at Miss Mary's website. Try our products risk-free for 100 days!" },
        { role: "system", content: `Context: Shipping time: ${shippingTime[cc] || 'Orders usually takes 7-9 working days to arrive'}`},
        { role: "system", content: `Context: Contact Number for Miss Mary: ${contactNumber[cc] || '+4633222220'}`},
        { role: "system", content: `Context: Your name is ${name}. You're a friendly and empathetic customer service agent, aged 69, working for Miss Mary of Sweden -a lingerie company known for its extra comfortable bras.` },
        { role: "system", content:`Context: You are responding to a customer ticket. Begin with a warm greeting, address the customer by name, answer their question, and provide tracking information and delivery time if applicable. End with 'Miss Mary of Sweden.'` },
        { role: "system", content:"Context: Respond to the question using the same language it was asked in. If the question pertains to an order, look for relevant shipping information in the order data." },
        { role: "system", content: `Order data: ${customerOrder}` },
    ]
}

async function getSummary(prompt) {
  console.log(prompt, 'gpt prompt');
  const options = {
    url: "https://api.openai.com/v1/chat/completions",
    type: "POST",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer {{setting.openAiApiToken}}",
    },
    data: JSON.stringify({
      model: openAiModel,
      messages: prompt,
    }),
    secure: true,
  };
  console.log(options, 'options prompt');
  const response = await client.request(options);

  return response.choices[0].message.content.trim();
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
  const ticketSummary = await client.get("ticket.customField:custom_field_17187808083218");
  document.getElementById("reply").innerText = ticketSummary["ticket.customField:custom_field_17187808083218"];
  const ticketReplyNew = await client.get("ticket.customField:custom_field_19341780814482");
  document.getElementById("reply_new").innerText = ticketReplyNew["ticket.customField:custom_field_19341780814482"];
}

async function refreshAns(){
  document.getElementById("reply").innerText = "Loading...";
  document.getElementById("reply_new").innerText = "Loading...";
  document.querySelector('#refreshbtn').disabled = true;
  document.getElementById('pbtn').style.display = 'none';
  let ticketId = await client.get("ticket.id");
  ticketId = ticketId["ticket.id"];
  let ticketRequesterEmail = await client.get("ticket.requester.email");
  ticketRequesterEmail = ticketRequesterEmail["ticket.requester.email"];
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


async function getUserEmail(){
    const response = await client.get("ticket.requester.email");
    return response["ticket.requester.email"];
}
async function getOrderLastOrderInfo(email){
    const options = {
        url: "https://missmary.centra.com/graphql",
        type: "POST",
        headers: {
          Authorization: `Bearer {{setting.apiToken}}`,
          //Authorization: `Bearer ${token}`,
          'Content-Type': "application/json",
        },
        accepts: "application/json",
        //secure: false,
        secure: true,
        maxBodyLength: Infinity,
        data: JSON.stringify({
          query: `query jOrders {
              customers(
                  limit: 1
                  where: {email: {equals: "${email}"}}
              ) {
                  firstName
                  lastName
                  lastOrder {
                      number
                      orderDate(format: "Y-m-d H:i")
                      status
                      lines {
                          discountPercent
                          productName
                          productVariantName
                          productNumber
                          size
                          quantity
                          productVariant {
                                      variantNumber
                                    }
                          unitPrice {
                              value
                              currency {
                                  name
                              }
                          }
                          unitOriginalPrice{
                            value
                            currency {
                                name
                            }
                          }
                      }
                      address: shippingAddress{address1 address2 zipCode city country {name code}}
                      discountsApplied {
                          ... on AppliedVoucher {
                            voucher {
                              name
                              type
                            }
                          }
                          value {
                              value
                              currency {
                                  name
                              }
                          }
                      }
                      totals {
                          lineValues {
                            value
                          }
                      }
                      grandTotal {
                          value
                          currency {
                              name
                          }
                      }
                      paymentMethod {
                          name
                      }
                      shipments {
                        shipmentPlugin {name }
                          id
                          shippedAt(format: "Y-m-d H:i")
                          createdAt(format: "Y-m-d H:i")
                          trackingNumber
                          isShipped
                          carrierInformation {
                              carrierName
                          }
                          shippingAddress {
                              address1
                              address2
                              phoneNumber
                              email
                              city
                              zipCode
                              country {
                                  name
                                  code
                              }
                          }
                          lines {
                          orderLine{
                            productNumber
                            productVariantName
                            productName
                            size
                            productVariant {variantNumber}
                          }
                      }
                      }
                  }
              }
          }`
        }),
    };
    const getPath = (trackingNumber) => {
        if (/^U.*/.test(trackingNumber)) {
            return pathMap.U;
        } else if (/^.{15,}$/.test(trackingNumber)) {
            return pathMap.D;
        } else {
            return pathMap.A;
        }
    }
    const getTrackingUrl = (trackingNumber,cc,totalItemsPrice, shipmentMethod) => {
        if (shipmentMethod.includes('EXP') || !trackingUrl[cc]) {
            if (/^.{15,}$/.test(trackingNumber)) {
                return trackingUrl['DHL'] + trackingNumber;
            }else{
                return trackingUrl['DEFAULT'] + trackingNumber;
            }
        }
        if (shipmentMethod.includes('FedEx') || !trackingUrl[cc]) {
            return trackingUrl['FEDEX'] + trackingNum
        }
        if (cc === 'GB' && totalItemsPrice >= 135) {
            return trackingUrl['GB_ASENDIA'] + trackingNumber
        }
        return trackingUrl[cc] + trackingNumber
    }
    const results = await client.request(options);
    const cdata = results?.data ?? '';
    const promises = cdata?.customers
        .filter(customer => customer.lastOrder?.status === 'SHIPPED')
        .map(async customer => {
            for (const shipment of customer.lastOrder.shipments) {
                const path = getPath(shipment.trackingNumber);
                opt.url = `${path}${shipment.trackingNumber}`;
                const resp = await client.request(opt);
                shipment.tracking = JSON.parse(resp);
                shipment.trackingUrl = getTrackingUrl(shipment.trackingNumber, shipment.shippingAddress?.country?.code, customer?.lastOrder?.totals?.lineValues?.value, shipment.shipmentPlugin?.name );
            }
        });
    await Promise.all(promises);
    console.log(cdata, 'cdata openai');
    return [JSON.stringify(cdata),cdata?.customers[0]?.lastOrder?.address?.country.code];

}