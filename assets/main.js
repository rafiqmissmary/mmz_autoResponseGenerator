const client = ZAFClient.init();
let openAiModel = 'gpt-3.5-turbo'
client.metadata().then(function(metadata) {
  openAiModel = metadata.settings.openAiModel;
});

const pathMap = {
  U: 'https://asendiatracking.azurewebsites.net/api/postnordfull?code=tS1Hisghk0bmbjB38m1y816KH7PA0Qtt_rP99BtmG5LeAzFuF0VL9A%3D%3D&tracking=',
  D: 'https://asendiatracking.azurewebsites.net/api/dhlfull?code=tzT61L0Yd0lqz9cwyHPElFbEfwXbpkNw_N0tGUzZqtC5AzFuBmCeQw%3D%3D&trackingNumber=',
  A: 'https://asendiatracking.azurewebsites.net/api/asendiafull?code=bPjsoAjRnInqcqbd2IAZpSAmLTA2lMO-Xm7D9M4Tc-RkAzFuFeaSiA%3D%3D&tracking='
};
const opt = {
    type: "GET",
    headers: {
        'Content-Type': "application/json",
    },
    accepts: "application/json",
    //secure: false,
    secure: true,
    };
async function updateSummary(customerOrder) {
  const convo = await getTicketConvo();
  const prompt = await getPrompt(convo, customerOrder);
  const summary = await getSummary(prompt);
  const container = document.getElementById("container");

  container.innerText = summary;
}

async function getTicketConvo() {
  const ticketConvo = await client.get("ticket.conversation");
  return JSON.stringify(ticketConvo["ticket.conversation"]);
}

async function getPrompt(convo, customerOrder) {
    return [
        { role: "user", content: `Summarize the following customer service interaction with the customer. Suggest answer the customer's question: ${convo}` },
        { role: "system", content: "Context: We do not have any physical stores but offer fit guarantee, helpful customer service by phone and you may shop at www.missmary.com. Try for 100 days" },
        { role: "system", content:"Context: Orders usually takes 5-7 working days to arrive for european countries"},
        { role: "system", content: "You are a very friendly, empatheitc, 69 year old, female customer service agent  for a lingerie company named Miss Mary of Sweden which specialises in extra comfortable bras." },
        { role: "system", content:"Answer the question in the same language as the question. if the question is relating to an order, try to find shipping information in the order data." },
        { role: "system", content: `Order data in JSON: ${customerOrder}` },
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
  const email = await getUserEmail();
  const customerOrder = await getOrderLastOrderInfo(email);
  updateSummary(customerOrder);
});


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
                      address: shippingAddress{address1 address2 zipCode city country {name}}
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
            }
        });
    await Promise.all(promises);
    console.log(cdata, 'cdata openai');
    return JSON.stringify(cdata);

}