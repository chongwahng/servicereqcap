// Generic HTTP client approach provided by cloud SDK
const { executeHttpRequest } = require("@sap-cloud-sdk/core");

// Example - Use the following OData client to access cloud foundry workflow service 
// const { WorkflowInstanceApi } = require("@sap/cloud-sdk-workflow-service-cf");

module.exports = async function (srv) {
  const cds = require("@sap/cds");

  console.log(`Service name: ${srv.name} is served at ${srv.path}`);

  //-- Hook method before.CREATE
  srv.before("CREATE", "Incidents", async (req) => {
    const { Incidents } = srv.entities;
    const query = SELECT.one
      .from(Incidents)
      .columns("max(ticket_no) as ticketno");
    const result = await cds.run(query);
    const jobj = JSON.parse(JSON.stringify(result));
    var arg = `${jobj.ticketno} + 1`;
    req.data.ticket_no = JSON.stringify(eval(arg));
    req.data.status = `PENDING`;
    return req;
  });

  //-- Hook method after.CREATE
  srv.after("CREATE", "Incidents", (req, msg) => {
    getBearerToken((token) => {
      createWorkflowInstance(token, msg.data);
    });
  });

  //-- Hook method for UNBOUND ACTION ==> on.approve
  srv.on("approve", async (req) => {
    console.log(req.data.id);

    const { Incidents } = this.entities;

    await cds
      .transaction(req)
      .run(
        UPDATE(Incidents).set({ status: `APPROVED` }).where({ ID: req.data.id })
      )
      .catch(() => {
        return req.reject(
          400,
          `Error approving incident request : ${req.data.id}`
        );
      });
  });

  //-- Hook method for UNBOUND ACTION ==> on.reject
  srv.on("reject", async (req) => {
    console.log(req.data.id);

    const { Incidents } = this.entities;

    await cds
      .transaction(req)
      .run(
        UPDATE(Incidents).set({ status: `REJECTED` }).where({ ID: req.data.id })
      )
      .catch(() => {
        return req.reject(
          400,
          `Error rejecting incident request : ${req.data.id}`
        );
      });
  });

  //-- Hook method for BOUND ACTION ==> on.approve_incident
  srv.on("approve_incident", async (req) => {
    console.log(`Entity action ${req.event} invoked`);
    console.log(`ID = ${req.params[0]}`);

    const { Incidents } = this.entities;

    await cds
      .transaction(req)
      .run(
        UPDATE(Incidents)
          .set({ status: `APPROVED` })
          .where({ IncidentUUID: req.params[0] })
      )
      .catch(() => {
        return req.reject(400, `Error approving incident request`);
      });
  });

  //-- Hook method for BOUND ACTION ==> on.reject_incident
  srv.on("reject_incident", async (req) => {
    console.log(`Entity action ${req.event} invoked`);
    console.log(`ID = ${req.params[0]}`);

    const { Incidents } = this.entities;

    await cds
      .transaction(req)
      .run(
        UPDATE(Incidents)
          .set({ status: `REJECTED` })
          .where({ ID: req.params[0] })
      )
      .catch(() => {
        return req.reject(400, `Error rejecting incident request`);
      });
  });

  //-- Hook method after.READ
  srv.after("READ", "Incidents", async () => {
    const getWFInstances = await executeHttpRequest(
      { destinationName: "bpmworkflowruntime_test" },
      { method: "get", url: "/rest/v1/workflow-instances" }
    );

    console.log(getWFInstances.data);

    //    const newIncidents = [];
    //    incidents.forEach((x) => {
    //      x.ticket_no = jobj.ticketno;
    //      newIncidents.push(x);
    //    });
    //const q = SELECT `from Incidents { max(ticket_no) as ticketno }`
    //const r = await q
    //console.log(r)
  });
};

/* ======================== */
/* GET BEARER JWT TOKEN     */
/* ======================== */
const getBearerToken = (callback) => {
  const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

  const grantType = `grant_type=client_credentials`;
  const clientID = `client_id=sb-clone-c141add5-503f-4e44-8cd3-daee29012fb9!b113585|workflow!b10150`;
  const clientSecret = `client_secret=0dfcd112-7a2e-4c02-9024-721289f8fd60$ZhQk26IwRZGR8eb-6-S34E1qXa9fS4CafH4J-TT6-BU=`;

  var xhr = new XMLHttpRequest();
  xhr.withCredentials = false;

  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === this.DONE) {
      var resp_json = JSON.parse(this.responseText);

      if (callback && typeof callback === "function") {
        callback(resp_json.access_token);
      }
    }
  });

  xhr.open(
    "POST",
    "https://81333ea9trial.authentication.eu10.hana.ondemand.com/oauth/token",
    true
  );

  //adding request headers
  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

  //sending request
  xhr.send(`${grantType}&${clientID}&${clientSecret}`);
};

/* ======================== */
/* CREATE WORKFLOW INSTANCE */
/* ======================== */
const createWorkflowInstance = (token, incident) => {
  const payload = {
    definitionId: "cng.com.approvalprocess",
    context: {
      IncidentUUID: incident.ID,
      request: { id: incident.ID },
      TicketNo: incident.ticket_no,
      RaisedBy: incident.createdBy,
      Description: incident.description,
      Status: incident.status,
      approvalStep: {
        decision: "",
      },
      caller: "CAP",
    },
  };

  const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = false;

  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === this.DONE) {
      console.log(this.responseText);
    }
  });

  xhr.open(
    "POST",
    "https://api.workflow-sap.cfapps.eu10.hana.ondemand.com/workflow-service/rest/v1/workflow-instances"
  );

  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", "Bearer " + token);

  xhr.send(JSON.stringify(payload));
};
